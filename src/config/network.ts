/**
 * Network configuration for the application
 * Can be set to 'testnet' or 'mainnet'
 */

// Network type definition
export type NetworkType = 'testnet' | 'mainnet';

// Default network configuration 
export const DEFAULT_NETWORK: NetworkType = 'testnet';

// Current active network - initialized to default
export let currentNetwork: NetworkType = DEFAULT_NETWORK;

/**
 * Set the current network
 * @param network The network to set ('testnet' or 'mainnet')
 */
export const setNetwork = (network: NetworkType): void => {
  if (network !== 'testnet' && network !== 'mainnet') {
    console.error(`Invalid network: ${network}. Must be 'testnet' or 'mainnet'`);
    return;
  }
  
  currentNetwork = network;
  console.log(`Network switched to: ${network}`);
};

/**
 * Get the current network
 * @returns The current active network
 */
export const getNetwork = (): NetworkType => {
  return currentNetwork;
};

export default {
  DEFAULT_NETWORK,
  currentNetwork,
  setNetwork,
  getNetwork
}; 