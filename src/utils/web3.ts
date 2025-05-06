import { getContractAddress, getContractName } from './contracts';
import { loadABI } from './abi';
import { getNetwork } from '../config/network';

/**
 * Get contract details including address and ABI for the current network
 * @param contractKey The contract key (e.g., 'l1', 'commissionHub')
 * @returns Object with contract address and ABI
 */
export const getContractDetails = (contractKey: string) => {
  const address = getContractAddress(contractKey);
  const contractName = getContractName(contractKey);
  const abi = loadABI(contractName);
  
  if (!address) {
    throw new Error(`Contract address not found for key: ${contractKey}`);
  }
  
  if (!abi) {
    throw new Error(`ABI not found for contract: ${contractName}`);
  }
  
  return {
    address,
    abi,
    contractName,
    network: getNetwork()
  };
};

export default {
  getContractDetails
}; 