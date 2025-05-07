import { ethers, Contract } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { loadABI } from '../utils/abi';
import { getContractAddress } from '../utils/contracts';
import { useMemo } from 'react';
import { getNetwork } from '../config/network';

/**
 * Get an instance of the ProfileHub contract
 * @param providerOrSigner The provider or signer to connect to the contract
 * @returns Contract instance for ProfileHub
 */
export function getProfileHubContract(
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Contract {
  const address = getContractAddress('profileHub');
  const abi = loadABI('ProfileHub');
  
  if (!address) {
    throw new Error('ProfileHub contract address not found');
  }
  
  if (!abi) {
    throw new Error('ProfileHub contract ABI not found');
  }
  
  try {
    const currentNetwork = getNetwork();
    console.debug('Creating ProfileHub contract for network:', currentNetwork, {
      address,
      network: currentNetwork,
      abiType: typeof abi,
      isArray: Array.isArray(abi),
      abiLength: Array.isArray(abi) ? abi.length : 'N/A'
    });
    
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error('Failed to create ProfileHub contract:', error);
    console.error('ABI details:', abi);
    throw error;
  }
}

/**
 * React hook to use the ProfileHub contract within components
 * @returns Contract instance for ProfileHub or null if not available
 */
export function useProfileHubContract(): Contract | null {
  const { network } = useBlockchain();
  const ethersProvider = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      } else {
        // Fallback to a read-only provider using the network's RPC URL
        return new ethers.JsonRpcProvider(network.rpcUrl);
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      return null;
    }
  }, [network.rpcUrl]);
  
  // Always get the latest contract address based on the current network
  return useMemo(() => {
    if (!ethersProvider) return null;
    
    try {
      // This will call getContractAddress which will use the current network
      return getProfileHubContract(ethersProvider);
    } catch (error) {
      console.error('Error creating ProfileHub contract instance:', error);
      return null;
    }
  }, [ethersProvider, network]);
}

/**
 * Check if a user has a profile
 * @param userAddress The address of the user to check
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to a boolean indicating if the user has a profile
 */
export async function hasProfile(
  userAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<boolean> {
  try {
    const contract = getProfileHubContract(provider);
    return await contract.hasProfile(userAddress);
  } catch (error) {
    console.error(`Error checking if user ${userAddress} has a profile:`, error);
    return false;
  }
}

/**
 * Get a user's profile address
 * @param userAddress The address of the user
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to the profile address or null if not found
 */
export async function getUserProfile(
  userAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<string | null> {
  try {
    const contract = getProfileHubContract(provider);
    const profileAddress = await contract.getProfile(userAddress);
    
    // Check if the address is the zero address (no profile)
    if (profileAddress === ethers.ZeroAddress) {
      return null;
    }
    
    return profileAddress;
  } catch (error) {
    console.error(`Error getting profile for user ${userAddress}:`, error);
    return null;
  }
}

/**
 * Create a profile for the current user
 * @param signer The signer to use for the contract call
 * @returns Promise resolving to the transaction response and new profile address
 */
export async function createProfile(
  signer: ethers.JsonRpcSigner
): Promise<{tx: ethers.TransactionResponse, profileAddress: string}> {
  try {
    const contract = getProfileHubContract(signer);
    
    // Create the profile
    const tx = await contract.createProfile();
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Extract the profile address from the event logs
    let profileAddress = null;
    if (receipt && receipt.logs) {
      // Find the ProfileCreated event
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'ProfileCreated') {
            profileAddress = parsedLog.args.profile;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
          continue;
        }
      }
    }
    
    if (!profileAddress) {
      // If we couldn't get the profile address from logs, try to get it directly
      const userAddress = await signer.getAddress();
      profileAddress = await contract.getProfile(userAddress);
    }
    
    return { tx, profileAddress };
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Get a list of user profiles
 * @param pageSize The number of profiles per page
 * @param pageNumber The page number (0-indexed)
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to an array of user addresses
 */
export async function getUserProfiles(
  pageSize: number,
  pageNumber: number,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<string[]> {
  try {
    const contract = getProfileHubContract(provider);
    return await contract.getUserProfiles(pageSize, pageNumber);
  } catch (error) {
    console.error('Error getting user profiles:', error);
    return [];
  }
}

/**
 * Create a new art piece and register a profile if needed
 * @param artPieceTemplate The address of the art piece template
 * @param tokenUriData The token URI data
 * @param tokenUriDataFormat The format of the token URI data
 * @param title The title of the art piece
 * @param description The description of the art piece
 * @param isArtist Whether the caller is the artist
 * @param otherParty The address of the other party (artist or commissioner)
 * @param commissionHub The address of the commission hub
 * @param aiGenerated Whether the art is AI generated
 * @param signer The signer to use for the contract call
 * @returns Promise resolving to the transaction response, profile address, and art piece address
 */
export async function createNewArtPieceAndRegisterProfile(
  artPieceTemplate: string,
  tokenUriData: Uint8Array,
  tokenUriDataFormat: string,
  title: string,
  description: string,
  isArtist: boolean,
  otherParty: string,
  commissionHub: string,
  aiGenerated: boolean,
  signer: ethers.JsonRpcSigner
): Promise<{tx: ethers.TransactionResponse, profileAddress: string, artPieceAddress: string}> {
  try {
    const contract = getProfileHubContract(signer);
    
    // Estimate gas first
    console.log('Estimating gas for createNewArtPieceAndRegisterProfile...');
    let estimatedGas;
    try {
      estimatedGas = await contract.createNewArtPieceAndRegisterProfile.estimateGas(
        artPieceTemplate,
        tokenUriData,
        tokenUriDataFormat,
        title,
        description,
        isArtist,
        otherParty || ethers.ZeroAddress,
        commissionHub || ethers.ZeroAddress,
        aiGenerated
      );
      
      // Add a 20% buffer to the estimated gas
      estimatedGas = Math.floor(Number(estimatedGas) * 1.2);
      console.log(`Estimated gas with buffer: ${estimatedGas}`);
    } catch (estimateError) {
      console.warn('Gas estimation failed, using safe default:', estimateError);
      // Use a safe default if estimation fails
      estimatedGas = 1500000; // 1.5 million gas units as a fallback (higher than profile because it also creates a profile)
    }
    
    // Call the contract function with our gas estimate
    const tx = await contract.createNewArtPieceAndRegisterProfile(
      artPieceTemplate,
      tokenUriData,
      tokenUriDataFormat,
      title,
      description,
      isArtist,
      otherParty || ethers.ZeroAddress,
      commissionHub || ethers.ZeroAddress,
      aiGenerated,
      { gasLimit: estimatedGas }
    );
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Extract the profile and art piece addresses from the event logs
    let profileAddress = null;
    let artPieceAddress = null;
    
    if (receipt && receipt.logs) {
      // Find the relevant events
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'ProfileCreated') {
            profileAddress = parsedLog.args.profile;
          } else if (parsedLog && parsedLog.name === 'ArtPieceCreated') {
            artPieceAddress = parsedLog.args.art_piece;
          }
        } catch (e) {
          // Skip logs that can't be parsed
          continue;
        }
      }
    }
    
    if (!profileAddress || !artPieceAddress) {
      // If we couldn't get the addresses from logs, try to get them directly
      const userAddress = await signer.getAddress();
      profileAddress = await contract.getProfile(userAddress);
      
      // We don't have a direct way to get the art piece address, so this is incomplete
      console.warn('Could not extract art piece address from transaction logs');
    }
    
    return { tx, profileAddress, artPieceAddress };
  } catch (error) {
    console.error('Error creating art piece and registering profile:', error);
    throw error;
  }
}

export default {
  getProfileHubContract,
  useProfileHubContract,
  hasProfile,
  getUserProfile,
  createProfile,
  getUserProfiles,
  createNewArtPieceAndRegisterProfile
}; 