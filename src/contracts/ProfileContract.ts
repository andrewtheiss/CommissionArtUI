import { ethers, Contract } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { loadABI } from '../utils/abi';
import { getContractAddress } from '../utils/contracts';
import { useMemo } from 'react';

/**
 * Get an instance of the Profile template contract
 * @param providerOrSigner The provider or signer to connect to the contract
 * @returns Contract instance for Profile template
 */
export function getProfileTemplateContract(
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Contract {
  const address = getContractAddress('profileTemplate');
  const abi = loadABI('Profile');
  
  if (!address) {
    throw new Error('Profile contract address not found');
  }
  
  if (!abi) {
    throw new Error('Profile contract ABI not found');
  }
  
  try {
    console.debug('Creating Profile template contract with:', {
      address,
      abiType: typeof abi,
      isArray: Array.isArray(abi),
      abiLength: Array.isArray(abi) ? abi.length : 'N/A'
    });
    
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error('Failed to create Profile template contract:', error);
    console.error('ABI details:', abi);
    throw error;
  }
}

/**
 * Get an instance of a specific Profile contract by address
 * @param address The address of the specific Profile contract
 * @param providerOrSigner The provider or signer to connect to the contract
 * @returns Contract instance for the specific Profile
 */
export function getProfileContract(
  address: string,
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Contract {
  const abi = loadABI('Profile');
  
  if (!abi) {
    throw new Error('Profile contract ABI not found');
  }
  
  try {
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error(`Failed to create Profile contract at ${address}:`, error);
    throw error;
  }
}

/**
 * React hook to use the Profile template contract within components
 * @returns Contract instance for Profile template or null if not available
 */
export function useProfileTemplateContract(): Contract | null {
  const { isConnected, walletAddress, network } = useBlockchain();
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
      const address = getContractAddress('profileTemplate');
      return getProfileContract(address, ethersProvider);
    } catch (error) {
      console.error('Error creating Profile template contract instance:', error);
      return null;
    }
  }, [ethersProvider, network]);
}

/**
 * React hook to use a specific Profile contract within components
 * @param profileAddress The address of the specific Profile contract
 * @returns Contract instance for the specific Profile or null if not available
 */
export function useProfileContract(profileAddress: string | null): Contract | null {
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
  
  // Always recreate the contract when the network changes
  return useMemo(() => {
    if (!ethersProvider || !profileAddress) return null;
    
    try {
      return getProfileContract(profileAddress, ethersProvider);
    } catch (error) {
      console.error(`Error creating Profile contract instance at ${profileAddress}:`, error);
      return null;
    }
  }, [ethersProvider, profileAddress, network]);
}

/**
 * Get profile information by address
 * @param profileAddress The address of the profile contract
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to the profile data
 */
export async function getProfileInfo(
  profileAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<any> {
  try {
    const contract = getProfileContract(profileAddress, provider);
    
    // Get basic profile information
    const owner = await contract.owner();
    const isArtist = await contract.isArtist();
    
    // Get profile image if available
    let profileImage = null;
    let profileImageFormat = null;
    try {
      profileImage = await contract.profileImage();
      profileImageFormat = await contract.profileImageFormat();
    } catch (error) {
      console.warn(`Profile ${profileAddress} has no profile image`);
    }
    
    // Get counts
    const commissionCount = await contract.commissionCount();
    const unverifiedCommissionCount = await contract.unverifiedCommissionCount();
    const myArtCount = await contract.myArtCount();
    const likedProfileCount = await contract.likedProfileCount();
    const linkedProfileCount = await contract.linkedProfileCount();
    
    // Check if user is an artist and get artist-specific data
    let artistData = null;
    if (isArtist) {
      const artistCommissionedWorkCount = await contract.artistCommissionedWorkCount();
      const artistErc1155sToSellCount = await contract.artistErc1155sToSellCount();
      const artistProceedsAddress = await contract.artistProceedsAddress();
      
      artistData = {
        artistCommissionedWorkCount,
        artistErc1155sToSellCount,
        artistProceedsAddress
      };
    }
    
    return {
      address: profileAddress,
      owner,
      isArtist,
      profileImage,
      profileImageFormat,
      commissionCount,
      unverifiedCommissionCount,
      myArtCount,
      likedProfileCount,
      linkedProfileCount,
      artistData
    };
  } catch (error) {
    console.error(`Error getting profile info for ${profileAddress}:`, error);
    throw error;
  }
}

/**
 * Get recent art pieces from a profile
 * @param profileAddress The address of the profile contract
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to an array of art piece addresses
 */
export async function getProfileRecentArtPieces(
  profileAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<string[]> {
  try {
    const contract = getProfileContract(profileAddress, provider);
    return await contract.getLatestArtPieces();
  } catch (error) {
    console.error(`Error getting recent art pieces for profile ${profileAddress}:`, error);
    return [];
  }
}

/**
 * Get paginated art pieces from a profile
 * @param profileAddress The address of the profile contract
 * @param page The page number (0-indexed)
 * @param pageSize The number of items per page
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to an array of art piece addresses
 */
export async function getProfileArtPieces(
  profileAddress: string,
  page: number,
  pageSize: number,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<string[]> {
  try {
    const contract = getProfileContract(profileAddress, provider);
    return await contract.getArtPieces(page, pageSize);
  } catch (error) {
    console.error(`Error getting art pieces for profile ${profileAddress}:`, error);
    return [];
  }
}

/**
 * Get paginated commissions from a profile
 * @param profileAddress The address of the profile contract
 * @param page The page number (0-indexed)
 * @param pageSize The number of items per page
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to an array of commission addresses
 */
export async function getProfileCommissions(
  profileAddress: string,
  page: number,
  pageSize: number,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<string[]> {
  try {
    const contract = getProfileContract(profileAddress, provider);
    return await contract.getCommissions(page, pageSize);
  } catch (error) {
    console.error(`Error getting commissions for profile ${profileAddress}:`, error);
    return [];
  }
}

/**
 * Add an art piece to a profile
 * @param profileAddress The address of the profile contract
 * @param artPieceAddress The address of the art piece to add
 * @param signer The signer to use for the contract call
 * @returns Promise resolving to the transaction response
 */
export async function addArtPieceToProfile(
  profileAddress: string,
  artPieceAddress: string,
  signer: ethers.JsonRpcSigner
): Promise<ethers.TransactionResponse> {
  try {
    const contract = getProfileContract(profileAddress, signer);
    return await contract.addArtPiece(artPieceAddress);
  } catch (error) {
    console.error(`Error adding art piece ${artPieceAddress} to profile ${profileAddress}:`, error);
    throw error;
  }
}

/**
 * Set artist status for a profile
 * @param profileAddress The address of the profile contract
 * @param isArtist Whether the profile is an artist
 * @param signer The signer to use for the contract call
 * @returns Promise resolving to the transaction response
 */
export async function setProfileArtistStatus(
  profileAddress: string,
  isArtist: boolean,
  signer: ethers.JsonRpcSigner
): Promise<ethers.TransactionResponse> {
  try {
    const contract = getProfileContract(profileAddress, signer);
    return await contract.setIsArtist(isArtist);
  } catch (error) {
    console.error(`Error setting artist status for profile ${profileAddress}:`, error);
    throw error;
  }
}

/**
 * Set profile image
 * @param profileAddress The address of the profile contract
 * @param imageAddress The address of the image contract
 * @param imageFormat The format of the image
 * @param signer The signer to use for the contract call
 * @returns Promise resolving to the transaction responses
 */
export async function setProfileImage(
  profileAddress: string,
  imageAddress: string,
  imageFormat: string,
  signer: ethers.JsonRpcSigner
): Promise<ethers.TransactionResponse[]> {
  try {
    const contract = getProfileContract(profileAddress, signer);
    
    // Set image address and format
    const tx1 = await contract.setProfileImage(imageAddress);
    await tx1.wait();
    
    const tx2 = await contract.setProfileImageFormat(imageFormat);
    
    return [tx1, tx2];
  } catch (error) {
    console.error(`Error setting profile image for ${profileAddress}:`, error);
    throw error;
  }
}

/**
 * Create a new art piece through a profile contract
 * @param profileAddress The address of the profile contract
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
 * @returns Promise resolving to the transaction response and art piece address
 */
export async function createArtPieceOnProfile(
  profileAddress: string,
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
): Promise<{tx: ethers.TransactionResponse, artPieceAddress: string}> {
  try {
    const contract = getProfileContract(profileAddress, signer);
    
    // Estimate gas first
    console.log('Estimating gas for createArtPiece...');
    let estimatedGas;
    try {
      estimatedGas = await contract.createArtPiece.estimateGas(
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
      estimatedGas = 1000000; // 1 million gas units as a fallback
    }
    
    // Call the contract function with our gas estimate
    const tx = await contract.createArtPiece(
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
    
    // Extract the art piece address from the event logs
    let artPieceAddress = null;
    
    if (receipt && receipt.logs) {
      // Find the relevant events
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'ArtPieceCreated') {
            artPieceAddress = parsedLog.args.art_piece;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
          continue;
        }
      }
    }
    
    if (!artPieceAddress) {
      console.warn('Could not extract art piece address from transaction logs');
    }
    
    return { tx, artPieceAddress };
  } catch (error) {
    console.error(`Error creating art piece through profile ${profileAddress}:`, error);
    throw error;
  }
}

export default {
  getProfileTemplateContract,
  getProfileContract,
  useProfileTemplateContract,
  useProfileContract,
  getProfileInfo,
  getProfileRecentArtPieces,
  getProfileArtPieces,
  getProfileCommissions,
  addArtPieceToProfile,
  setProfileArtistStatus,
  setProfileImage,
  createArtPieceOnProfile
}; 