import contractsConfig from '../config/contracts.json';
import { getNetwork, NetworkType } from '../config/network';

// Define the contract config key type
type ContractConfigKey = 'testnet-l2' | 'testnet-l3' | 'mainnet';

// Map network types to contract config keys
const mapNetworkToConfigKey = (network: NetworkType): ContractConfigKey => {
  // Map 'testnet' to 'testnet-l2' and 'mainnet' to 'mainnet'
  if (network === 'testnet') {
    return 'testnet-l2';
  }
  return 'mainnet'; // 'mainnet' is the correct key for mainnet
};

/**
 * Get contract information for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub', 'profile', 'profileHub')
 * @returns Contract information including address and contract name
 */
export const getContractInfo = (contractKey: string) => {
  const network = getNetwork();
  const configKey = mapNetworkToConfigKey(network);
  const networkConfig = contractsConfig.networks[configKey];
  
  if (!networkConfig) {
    throw new Error(`Network config not found for network: ${network} (config key: ${configKey})`);
  }
  
  const contractInfo = networkConfig[contractKey as keyof typeof networkConfig];
  
  if (!contractInfo) {
    throw new Error(`Contract info not found for key: ${contractKey} on network: ${network} (config key: ${configKey})`);
  }
  
  return contractInfo;
};

/**
 * Get contract address for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub', 'profile', 'profileHub')
 * @returns Contract address string
 */
export const getContractAddress = (contractKey: string): string => {
  const network = getNetwork();
  const configKey = mapNetworkToConfigKey(network);
  const address = getContractInfo(contractKey).address;
  
  console.debug(`Getting contract address for ${contractKey} on network ${network} (config key: ${configKey}):`, address);
  
  return address;
};

/**
 * Get contract name for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub', 'profile', 'profileHub')
 * @returns Contract name string
 */
export const getContractName = (contractKey: string): string => {
  return getContractInfo(contractKey).contract;
};

/**
 * Get all available contract keys
 * @returns Array of contract keys
 */
export const getAvailableContractKeys = (): string[] => {
  const network = getNetwork();
  const configKey = mapNetworkToConfigKey(network);
  const networkConfig = contractsConfig.networks[configKey];
  
  if (!networkConfig) {
    throw new Error(`Network config not found for network: ${network} (config key: ${configKey})`);
  }
  
  return Object.keys(networkConfig);
};

export default {
  getContractInfo,
  getContractAddress,
  getContractName,
  getAvailableContractKeys
}; 