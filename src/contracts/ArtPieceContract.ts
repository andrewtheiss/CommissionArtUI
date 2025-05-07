import { ethers, Contract } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { loadABI } from '../utils/abi';
import { getContractAddress } from '../utils/contracts';
import { useMemo } from 'react';

// Minimal Proxy (EIP-1167) bytecode prefix and suffix
const MINIMAL_PROXY_PREFIX = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73';
const MINIMAL_PROXY_SUFFIX = '5af43d82803e903d91602b57fd5bf3';

/**
 * Get an instance of the ArtPiece template contract
 * @param providerOrSigner The provider or signer to connect to the contract
 * @returns Contract instance for ArtPiece template
 */
export function getArtPieceTemplateContract(
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Contract {
  const address = getContractAddress('artPiece');
  const abi = loadABI('ArtPiece');
  
  if (!address) {
    throw new Error('ArtPiece contract address not found');
  }
  
  if (!abi) {
    throw new Error('ArtPiece contract ABI not found');
  }
  
  try {
    // Log ABI for debugging
    console.debug('Creating ArtPiece template contract with:', {
      address,
      abiType: typeof abi,
      isArray: Array.isArray(abi),
      abiLength: Array.isArray(abi) ? abi.length : 'N/A'
    });
    
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error('Failed to create ArtPiece template contract:', error);
    console.error('ABI details:', abi);
    throw error;
  }
}

/**
 * Get an instance of a specific ArtPiece contract by address
 * @param address The address of the specific ArtPiece contract
 * @param providerOrSigner The provider or signer to connect to the contract
 * @returns Contract instance for the specific ArtPiece
 */
export function getArtPieceContract(
  address: string,
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Contract {
  const abi = loadABI('ArtPiece');
  
  if (!abi) {
    throw new Error('ArtPiece contract ABI not found');
  }
  
  try {
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error(`Failed to create ArtPiece contract at ${address}:`, error);
    throw error;
  }
}

/**
 * React hook to use the ArtPiece template contract within components
 * @returns Contract instance for ArtPiece template or null if not available
 */
export function useArtPieceTemplateContract(): Contract | null {
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
  
  return useMemo(() => {
    if (!ethersProvider) return null;
    
    try {
      const address = getContractAddress('artPiece');
      return getArtPieceContract(address, ethersProvider);
    } catch (error) {
      console.error('Error creating ArtPiece template contract instance:', error);
      return null;
    }
  }, [ethersProvider, network]);
}

/**
 * Creates a minimal proxy contract pointing to the template
 * @param templateAddress The address of the template contract
 * @param signer The signer to deploy the contract
 * @returns The transaction response from the deployment
 */
export async function createMinimalProxy(
  templateAddress: string,
  signer: ethers.JsonRpcSigner
): Promise<{tx: ethers.TransactionResponse, proxyAddress: string}> {
  // Remove '0x' prefix and ensure address is lowercase
  const addressWithoutPrefix = templateAddress.slice(2).toLowerCase();
  
  // Create the minimal proxy bytecode
  const bytecode = `${MINIMAL_PROXY_PREFIX}${addressWithoutPrefix}${MINIMAL_PROXY_SUFFIX}`;
  
  // Create a contract factory for deployment
  const factory = new ethers.ContractFactory([], bytecode, signer);
  
  // Deploy the proxy
  const deployedContract = await factory.deploy();
  
  // Get the deployment transaction
  const tx = deployedContract.deploymentTransaction();
  if (!tx) {
    throw new Error('Failed to get deployment transaction');
  }
  
  // Get the proxy address
  const proxyAddress = await deployedContract.getAddress();
  
  console.log(`Deployed minimal proxy at ${proxyAddress} pointing to template ${templateAddress}`);
  
  return { tx, proxyAddress };
}

/**
 * Get an art piece by its token ID
 * @param tokenId The ID of the art piece token
 * @param contractAddress The address of the specific ArtPiece contract
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to the art piece data
 */
export async function getArtPieceById(
  tokenId: number | string,
  contractAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<any> {
  try {
    const contract = getArtPieceContract(contractAddress, provider);
    return await contract.getArtPiece(tokenId);
  } catch (error) {
    console.error(`Error getting art piece with ID ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Get all art pieces owned by an address
 * @param ownerAddress The address to check ownership for
 * @param contractAddress The address of the specific ArtPiece contract
 * @param provider The provider to use for the contract call
 * @returns Promise resolving to an array of owned art pieces
 */
export async function getArtPiecesByOwner(
  ownerAddress: string,
  contractAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<any[]> {
  try {
    const contract = getArtPieceContract(contractAddress, provider);
    const balance = await contract.balanceOf(ownerAddress);
    
    const artPieces = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
      const artPiece = await getArtPieceById(tokenId, contractAddress, provider);
      artPieces.push(artPiece);
    }
    
    return artPieces;
  } catch (error) {
    console.error(`Error getting art pieces owned by ${ownerAddress}:`, error);
    return [];
  }
}

/**
 * Create a new art piece contract instance and initialize it
 * @param title The title of the art piece
 * @param description The description of the art piece
 * @param imageData The raw image data as Uint8Array
 * @param imageFormat The format of the image (e.g., 'webp', 'png')
 * @param signer The signer to use for the contract call
 * @param aiGenerated Whether the art is AI-generated
 * @returns Promise resolving to the transaction response and new contract address
 */
export async function createArtPiece(
  title: string,
  description: string,
  imageData: Uint8Array,
  imageFormat: string,
  signer: ethers.JsonRpcSigner,
  aiGenerated: boolean = false
): Promise<{tx: ethers.TransactionResponse, contractAddress: string}> {
  try {
    // Step 1: Get the template address
    const templateAddress = getContractAddress('artPiece');
    console.log(`Using ArtPiece template at ${templateAddress}`);
    
    // Step 2: Create a minimal proxy clone of the template
    const { tx: deployTx, proxyAddress } = await createMinimalProxy(templateAddress, signer);
    
    // Wait for the deployment transaction to be mined
    await deployTx.wait();
    console.log(`Minimal proxy deployed at ${proxyAddress}`);
    
    // Step 3: Get an instance of the newly deployed contract
    const abi = loadABI('ArtPiece');
    console.log('ABI for initialization:', abi);
    
    const artPieceInstance = getArtPieceContract(proxyAddress, signer);
    
    // Get the signer's address (will be both owner and artist in this case)
    const signerAddress = await signer.getAddress();
    
    // Step 4: Initialize the contract with the correct parameters
    try {
      console.log('Initializing contract with parameters:', {
        imageDataLength: imageData.length,
        imageFormat,
        title,
        description,
        owner: signerAddress,
        artist: signerAddress,
        commissionHub: ethers.ZeroAddress, // Null address for now
        aiGenerated
      });
      
      // Convert the Uint8Array to a bytes format that ethers can handle
      const imageDataBytes = ethers.hexlify(imageData);
      
      // Call initialize with the correct parameters
      console.log('Estimating gas for initialize...');
      let estimatedGas;
      try {
        estimatedGas = await artPieceInstance.initialize.estimateGas(
          imageData,              // _token_uri_data
          imageFormat,            // _token_uri_data_format
          title,                  // _title_input
          description,            // _description_input
          signerAddress,          // _owner_input
          signerAddress,          // _artist_input
          ethers.ZeroAddress,     // _commission_hub (null address for now)
          aiGenerated             // _ai_generated
        );
        
        // Add a 20% buffer to the estimated gas
        estimatedGas = Math.floor(Number(estimatedGas) * 1.2);
        console.log(`Estimated gas with buffer: ${estimatedGas}`);
      } catch (estimateError) {
        console.warn('Gas estimation failed, using safe default:', estimateError);
        // Use a safe default if estimation fails
        estimatedGas = 1000000; // 1 million gas units as a fallback
      }
      
      const initTx = await artPieceInstance.initialize(
        imageData,              // _token_uri_data
        imageFormat,                 // _token_uri_data_format
        title,                       // _title_input
        description,                 // _description_input
        signerAddress,               // _owner_input
        signerAddress,               // _artist_input
        ethers.ZeroAddress,          // _commission_hub (null address for now)
        aiGenerated,                 // _ai_generated
        { gasLimit: estimatedGas }
      );
      
      console.log(`Initialization transaction sent: ${initTx.hash}`);
      
      // Wait for the initialization transaction to be mined
      await initTx.wait();
      console.log(`Contract initialized successfully at ${proxyAddress}`);
      
      return { tx: initTx, contractAddress: proxyAddress };
    } catch (error) {
      console.error('Error initializing contract:', error);
      
      // Try direct function call as a fallback
      try {
        console.log('Attempting to initialize using direct function call');
        
        // Convert the Uint8Array to a bytes format that ethers can handle
        const imageDataBytes = ethers.hexlify(imageData);
        
        // Create a transaction directly
        const initializeData = artPieceInstance.interface.encodeFunctionData(
          'initialize',
          [
            imageData,          // _token_uri_data
            imageFormat,             // _token_uri_data_format
            title,                   // _title_input
            description,             // _description_input
            signerAddress,           // _owner_input
            signerAddress,           // _artist_input
            ethers.ZeroAddress,      // _commission_hub
            aiGenerated              // _ai_generated
          ]
        );
        
        // Send the transaction
        const initTx = await signer.sendTransaction({
          to: proxyAddress,
          data: initializeData,
          gasLimit: 1000000  // Safe default gas limit
        });
        
        console.log(`Direct initialization transaction sent: ${initTx.hash}`);
        await initTx.wait();
        console.log(`Contract initialized via direct call at ${proxyAddress}`);
        return { tx: initTx, contractAddress: proxyAddress };
      } catch (directError) {
        console.error('Direct initialization also failed:', directError);
        throw error; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error creating art piece:', error);
    throw error;
  }
}

export default {
  getArtPieceTemplateContract,
  getArtPieceContract,
  useArtPieceTemplateContract,
  createMinimalProxy,
  getArtPieceById,
  getArtPiecesByOwner,
  createArtPiece
}; 