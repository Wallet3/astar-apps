import { LOCAL_STORAGE } from './../../config/localStorage';
import {
  CbridgeToken,
  EvmChain,
  getSelectedToken,
  getTransferConfigs,
  SelectedToken,
} from 'src/c-bridge';
import { endpointKey, getProviderIndex } from 'src/config/chainEndpoints';
import { getTokenBal } from 'src/config/web3';
import { objToArray } from 'src/hooks/helper/common';
import { useStore } from 'src/store';
import { computed, ref, watchEffect } from 'vue';
import { useAccount } from '../useAccount';
import { calUsdAmount } from './../helper/price';

const { Astar, Shiden } = EvmChain;

export function useCbridgeV2() {
  const tokens = ref<SelectedToken[] | null>(null);
  const ttlErc20Amount = ref<number>(0);
  const store = useStore();
  const isH160 = computed(() => store.getters['general/isH160Formatted']);
  const { currentAccount } = useAccount();

  const currentNetworkIdx = computed(() => {
    const chainInfo = store.getters['general/chainInfo'];
    const chain = chainInfo ? chainInfo.chain : '';
    return getProviderIndex(chain);
  });

  const filterTokens = (): void => {
    if (!tokens.value) return;
    tokens.value.sort((a: SelectedToken, b: SelectedToken) => {
      return a.symbol.localeCompare(b.symbol);
    });

    tokens.value.sort((a: SelectedToken, b: SelectedToken) => {
      return Number(b.userBalance) - Number(a.userBalance);
    });
  };

  const updateTokenBalanceHandler = async ({
    srcChainId,
    userAddress,
    token,
  }: {
    srcChainId: EvmChain;
    userAddress: string;
    token: SelectedToken;
  }): Promise<{
    balUsd: number;
    userBalance: string;
  }> => {
    let balUsd = 0;
    const userBalance = await getTokenBal({
      srcChainId,
      address: userAddress,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
    });
    if (Number(userBalance) > 0) {
      try {
        balUsd = await calUsdAmount({
          amount: Number(userBalance),
          symbol: token.symbol,
        });
      } catch (error) {
        console.error(error);
        balUsd = 0;
      }
      ttlErc20Amount.value += balUsd;
    }
    return { balUsd, userBalance };
  };

  const updateTokenBalances = async ({
    srcChainId,
    userAddress,
  }: {
    srcChainId: EvmChain;
    userAddress: string;
  }): Promise<void> => {
    if (!tokens.value) return;
    tokens.value = await Promise.all(
      tokens.value.map(async (token: SelectedToken) => {
        const { balUsd, userBalance } = await updateTokenBalanceHandler({
          srcChainId,
          userAddress,
          token,
        });
        const tokenWithBalance = { ...token, userBalance, userBalanceUsd: String(balUsd) };
        return tokenWithBalance;
      })
    );

    filterTokens();
  };

  const updateBridgeConfig = async ({
    srcChainId,
    userAddress,
  }: {
    srcChainId: EvmChain;
    userAddress: string;
  }): Promise<void> => {
    const data = await getTransferConfigs(currentNetworkIdx.value);
    if (!data || !data.tokens) {
      throw Error('Cannot fetch from cBridge API');
    }
    const seen = new Set();
    // Todo: use srcChain and destChainID to re-define token information for bridging (ex: PKEX)
    tokens.value = (await Promise.all(
      objToArray(data.tokens[srcChainId])
        .flat()
        .map(async (token: CbridgeToken) => {
          const t = getSelectedToken({ srcChainId, token });
          if (!t) return undefined;
          const isDuplicated = seen.has(t.address);
          seen.add(t.address);
          // Memo: Remove the duplicated contract address (ex: PKEX)
          if (isDuplicated) return undefined;

          const { balUsd, userBalance } = await updateTokenBalanceHandler({
            srcChainId,
            userAddress,
            token: t,
          });
          const tokenWithBalance = { ...t, userBalance, userBalanceUsd: String(balUsd) };
          return tokenWithBalance;
        })
    )) as SelectedToken[];

    tokens.value = tokens.value.filter((token) => {
      return token !== undefined;
    });

    filterTokens();
  };

  const handleCbridgeConfiguration = async (): Promise<void> => {
    ttlErc20Amount.value = 0;
    const networkIdxStore = localStorage.getItem(LOCAL_STORAGE.NETWORK_IDX);
    const isShibuya =
      currentNetworkIdx.value === endpointKey.SHIBUYA ||
      networkIdxStore === String(endpointKey.SHIBUYA);
    if (!currentAccount.value || isShibuya || !isH160.value) {
      tokens.value = null;
      return;
    }

    const srcChainId = currentNetworkIdx.value === endpointKey.ASTAR ? Astar : Shiden;
    try {
      store.commit('general/setLoading', true);
      await updateBridgeConfig({ srcChainId, userAddress: currentAccount.value });
    } catch (error: any) {
      console.error(error.message);
    } finally {
      store.commit('general/setLoading', false);
    }
  };

  const handleUpdateTokenBalances = async (): Promise<void> => {
    ttlErc20Amount.value = 0;
    if (!currentAccount.value || currentNetworkIdx.value === endpointKey.SHIBUYA || !isH160.value) {
      tokens.value = null;
      return;
    }
    const srcChainId = currentNetworkIdx.value === endpointKey.ASTAR ? Astar : Shiden;
    try {
      await updateTokenBalances({ srcChainId, userAddress: currentAccount.value });
    } catch (error) {
      console.error(error);
    }
  };

  watchEffect(async () => {
    await handleCbridgeConfiguration();
  });

  return { tokens, ttlErc20Amount, handleUpdateTokenBalances };
}
