import { getNetwork, setNetwork as setGlobalNetwork, NetworkType as GlobalNetworkType } from '../config/network';
import { mapLayerToNetwork } from '../contexts/BlockchainContext';

// Store the last synced network to avoid unnecessary updates
let lastSyncedNetwork: GlobalNetworkType | null = null;
let isSyncInProgress = false;

/**
 * Sync the global network setting with the blockchain context
 * @param blockchainSwitchToLayer The switchToLayer function from the blockchain context
 */
export const syncNetworkWithBlockchain = (blockchainSwitchToLayer: (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => void) => {
  // Prevent multiple simultaneous syncs
  if (isSyncInProgress) {
    return;
  }
  
  try {
    isSyncInProgress = true;
    
    // Get the current global network
    const currentGlobalNetwork = getNetwork();
    
    // Skip if we've already synced with this network
    if (lastSyncedNetwork === currentGlobalNetwork) {
      return;
    }
    
    // Update the last synced network
    lastSyncedNetwork = currentGlobalNetwork;
    
    // Determine the appropriate layer based on global network - always use L3 for our networks
    const layer: 'l1' | 'l2' | 'l3' = 'l3';
    
    // Call the blockchain context method
    blockchainSwitchToLayer(layer, currentGlobalNetwork);
    
    console.log(`Synced global network (${currentGlobalNetwork}) with blockchain context`);
  } finally {
    isSyncInProgress = false;
  }
};

/**
 * Set the network in both the global config and blockchain context
 * @param network The network to set ('testnet' or 'mainnet')
 * @param blockchainSwitchToLayer The switchToLayer function from the blockchain context
 */
export const setNetworkEverywhere = (
  network: GlobalNetworkType, 
  blockchainSwitchToLayer: (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => void
) => {
  // Prevent multiple simultaneous operations
  if (isSyncInProgress) {
    return;
  }
  
  try {
    isSyncInProgress = true;
    
    // Skip if already using this network
    if (lastSyncedNetwork === network) {
      return;
    }
    
    // Set global network
    setGlobalNetwork(network);
    
    // Update the last synced network
    lastSyncedNetwork = network;
    
    // Always use L3 for simplicity
    blockchainSwitchToLayer('l3', network);
    
    console.log(`Network set everywhere to: ${network}`);
  } finally {
    isSyncInProgress = false;
  }
};

export default {
  syncNetworkWithBlockchain,
  setNetworkEverywhere
}; 