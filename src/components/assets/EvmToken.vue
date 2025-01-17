<template>
  <div>
    <div class="border--separator" />
    <div class="rows">
      <div class="row row--details">
        <div class="row__left">
          <div class="column--currency">
            <img :src="tokenImg" :alt="token.name" class="token-logo" />
            <div class="column--ticker">
              <span class="text--title">{{ token.symbol }}</span>
              <span class="text--label">{{ formatTokenName(token.name) }}</span>
            </div>
          </div>
        </div>
        <div class="row__right">
          <div class="column column--balance">
            <div class="column__box">
              <div class="text--accent">
                <span>{{ $n(Number(token.userBalance)) }} {{ token.symbol }}</span>
              </div>
              <div class="text--label">
                <span>{{ $n(Number(token.userBalanceUsd)) }} {{ $t('usd') }}</span>
              </div>
            </div>
          </div>
          <div class="column--asset-buttons column--buttons--multi">
            <button
              class="btn btn--sm"
              @click="
                handleModalTransfer({
                  isOpen: true,
                  currency: token.symbol === nativeTokenSymbol ? nativeTokenSymbol : token,
                })
              "
            >
              {{ $t('assets.transfer') }}
            </button>
            <!-- Memo: temporary -->
            <router-link
              :to="{
                path: '/bridge',
                query: { from: sourceChainId, symbol: token.symbol },
              }"
            >
              <button class="btn btn--sm">
                {{ $t('assets.bridge') }}
              </button>
            </router-link>

            <button
              class="btn btn--sm screen--md btn--icon"
              @click="
                addToEvmWallet({
                  tokenAddress: token.address,
                  symbol: token.symbol,
                  decimals: token.decimal,
                  image: tokenImg,
                })
              "
            >
              <div class="icon--plus">
                <span> + </span>
              </div>
              <q-tooltip>
                <span class="text--tooltip">{{ $t('assets.addToWallet') }}</span>
              </q-tooltip>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { SelectedToken } from 'src/c-bridge';
import { getProviderIndex } from 'src/config/chainEndpoints';
import { getChainId } from 'src/config/web3';
import { addToEvmWallet } from 'src/hooks/helper/wallet';
import { useStore } from 'src/store';
import { getTokenImage } from 'src/token';
import { computed, defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    token: {
      type: Object as PropType<SelectedToken>,
      required: true,
    },
    handleModalTransfer: {
      type: Function,
      required: true,
    },
  },
  setup({ token }) {
    const tokenImg = computed(() =>
      getTokenImage({ isNativeToken: false, symbol: token.symbol, iconUrl: token.icon })
    );

    const store = useStore();
    const nativeTokenSymbol = computed(() => {
      const chainInfo = store.getters['general/chainInfo'];
      return chainInfo ? chainInfo.tokenSymbol : '';
    });

    const formatTokenName = (name: string) => {
      switch (name) {
        case 'Shiden Network':
          return 'Shiden';
        default:
          return name;
      }
    };

    const sourceChainId = computed(() => {
      const chainInfo = store.getters['general/chainInfo'];
      const chain = chainInfo ? chainInfo.chain : '';
      const networkIdx = getProviderIndex(chain);
      return token.hasOwnProperty('canonicalConfig')
        ? token.canonicalConfig && token.canonicalConfig.org_chain_id
        : getChainId(networkIdx);
    });

    return {
      formatTokenName,
      addToEvmWallet,
      tokenImg,
      nativeTokenSymbol,
      sourceChainId,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'src/components/assets/styles/asset-list.scss';
</style>
