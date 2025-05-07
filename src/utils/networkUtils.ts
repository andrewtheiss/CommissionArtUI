// Define the network types
export type BlockchainNetworkType = 'animechain' | 'animechain_testnet' | 'dev' | 'prod' | 'local' | 'arbitrum_testnet' | 'arbitrum_mainnet' | 'testnet' | 'mainnet';

/**
 * Map layer and environment to network type
 * @param layer The layer (l1, l2, l3)
 * @param environment The environment (testnet, mainnet)
 * @returns The corresponding network type
 */
export const mapLayerToNetwork = (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet'): BlockchainNetworkType => {
  // L1 networks: default Ethereum networks
  if (layer === 'l1') {
    return environment === 'testnet' ? 'testnet' : 'mainnet';
  } 
  // L2 networks: Arbitrum networks
  else if (layer === 'l2') {
    return environment === 'testnet' ? 'arbitrum_testnet' : 'arbitrum_mainnet';
  } 
  // L3 networks: AnimeChain networks
  else if (layer === 'l3') {
    return environment === 'testnet' ? 'animechain_testnet' : 'animechain';
  } 
  // Default fallback
  else {
    return environment === 'testnet' ? 'testnet' : 'mainnet';
  }
};

export default {
  mapLayerToNetwork
}; 