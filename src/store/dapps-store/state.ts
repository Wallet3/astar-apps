export interface DappItem extends LooseObject {
	name: string;
	iconUrl: string;
	description: string;
	url: string;
  address:string;
}

export interface NewDappItem extends DappItem {
  iconFileName: string;
  iconFile: string;
  signature: string;
}

export interface DappStateInterface {
  dapps: DappItem[];
}

export interface LooseObject {
  [key: string]: any;
}

function state(): DappStateInterface {
  return {
    dapps: []
  }
}

export default state;