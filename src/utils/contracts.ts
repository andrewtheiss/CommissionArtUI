import contractsConfig from '../config/contracts.json';
import { getNetwork } from '../config/network';

/**
 * Get contract information for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub')
 * @returns Contract information including address and contract name
 */
export const getContractInfo = (contractKey: string) => {
  const network = getNetwork();
  const networkConfig = contractsConfig.networks[network];
  
  if (!networkConfig) {
    throw new Error(`Network config not found for network: ${network}`);
  }
  
  const contractInfo = networkConfig[contractKey as keyof typeof networkConfig];
  
  if (!contractInfo) {
    throw new Error(`Contract info not found for key: ${contractKey} on network: ${network}`);
  }
  
  return contractInfo;
};

/**
 * Get contract address for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub')
 * @returns Contract address string
 */
export const getContractAddress = (contractKey: string): string => {
  return getContractInfo(contractKey).address;
};

/**
 * Get contract name for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub')
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
  const networkConfig = contractsConfig.networks[network];
  
  if (!networkConfig) {
    throw new Error(`Network config not found for network: ${network}`);
  }
  
  return Object.keys(networkConfig);
};

export default {
  getContractInfo,
  getContractAddress,
  getContractName,
  getAvailableContractKeys
}; 