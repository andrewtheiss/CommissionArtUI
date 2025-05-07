/**
 * Utility to dynamically load ABIs from the assets/abis folder
 */

// Type definition for ABI items
interface ABIItem {
  type: string;
  name?: string;
  inputs?: Array<{name: string; type: string; internalType?: string}>;
  outputs?: Array<{name: string; type: string; internalType?: string}>;
  stateMutability?: string;
  anonymous?: boolean;
  indexed?: boolean;
}

// Type for the ABI cache
type ABICache = {
  [key: string]: ABIItem[]
};

/**
 * Cache for loaded ABIs to avoid repeated file loading
 */
const abiCache: ABICache = {};

// Fallback ABIs for essential contracts to ensure application doesn't break
const fallbackABIs: Record<string, ABIItem[]> = {
  'ProfileHub': [
    {
      "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
      "name": "hasProfile",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
      "name": "getProfile",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "createProfile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  'Profile': [
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isArtist",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "profileImage",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "profileImageFormat",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "commissionCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unverifiedCommissionCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "myArtCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "likedProfileCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "linkedProfileCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

/**
 * Get all available ABI names from the assets/abis directory
 * @returns Array of available ABI names (without .json extension)
 */
export const getAvailableABIs = async (): Promise<string[]> => {
  try {
    // Using Vite's glob import feature to get all JSON files in the directory
    const abiModules = import.meta.glob('../assets/abis/*.json', { eager: true });
    
    // Extract filenames from the paths
    return Object.keys(abiModules).map((path: string) => {
      // Extract filename without extension from path
      // Example: '../assets/abis/ArtPiece.json' -> 'ArtPiece'
      const filename = path.split('/').pop() || '';
      return filename.replace(/\.json$/, '');
    });
  } catch (error) {
    console.error('Error loading available ABIs:', error);
    
    // Fallback: Try direct import of known contracts
    // This is less dynamic but provides a safety net if glob fails
    const knownContracts = [
      'ArrayManager', 'ArtPiece', 'ArtPieceOffChain', 'CommissionHub',
      'L1QueryOwner', 'L2Relay', 'OwnerRegistry', 'Profile', 'ProfileHub', 
      'SimpleERC721', 'L3OwnerVerifier', 'L3OwnerRegistry', 'Registry',
      'CommissionedArt', 'CommissionedArtData'
    ];
    
    // Filter out any contracts that don't have corresponding files
    const availableContracts: string[] = [];
    for (const contract of knownContracts) {
      try {
        // Try to load the contract to see if it exists
        await import(`../assets/abis/${contract}.json`);
        availableContracts.push(contract);
      } catch {
        // Skip contracts that can't be imported
      }
    }
    
    return availableContracts;
  }
};

/**
 * Load an ABI by name (synchronous version)
 * This is for backward compatibility with existing code
 * @param abiName Name of the ABI to load (without .json extension)
 * @returns The ABI object or fallback if not found
 */
export function loadABI(abiName: string): ABIItem[] {
  if (!abiName) {
    console.error('No ABI name provided');
    return [];
  }

  // Return from cache if already loaded
  if (abiCache[abiName]) {
    return abiCache[abiName];
  }

  // If not in cache, load a fallback ABI with essential functions
  // This ensures critical functions still work
  console.warn(`Using fallback ABI for ${abiName} - dynamic loading was not awaited`);
  
  // Trigger async load for future use
  loadABIAsync(abiName).then(abi => {
    if (abi) {
      // Update cache when async load completes
      abiCache[abiName] = abi;
    }
  }).catch(error => {
    console.error(`Async loading of ABI '${abiName}' failed:`, error);
  });
  
  // Return fallback ABI or empty array if no fallback exists
  return fallbackABIs[abiName] || [];
}

/**
 * Load an ABI by name (async version)
 * @param abiName Name of the ABI to load (without .json extension)
 * @returns Promise resolving to the ABI object or null if not found
 */
export const loadABIAsync = async (abiName: string): Promise<ABIItem[] | null> => {
  if (!abiName) {
    console.error('No ABI name provided');
    return null;
  }

  try {
    // Return from cache if already loaded
    if (abiCache[abiName]) {
      return abiCache[abiName];
    }

    // Dynamically import the ABI file
    const abiModule = await import(`../assets/abis/${abiName}.json`);
    
    // Store in cache for future use
    const abi = abiModule.default || abiModule;
    abiCache[abiName] = abi;
    
    return abi;
  } catch (error) {
    console.error(`Error loading ABI '${abiName}':`, error);
    return null;
  }
};

/**
 * Get the human-readable method names from an ABI
 * @param abiName Name of the ABI to analyze
 * @returns Array of method names
 */
export const getMethodNames = async (abiName: string): Promise<string[]> => {
  const abi = await loadABIAsync(abiName);
  if (!abi) return [];
  
  return abi
    .filter((item: ABIItem) => item.type === 'function' && item.name)
    .map((item: ABIItem) => item.name as string);
};

/**
 * Find ABIs that have a specific method
 * @param methodName Method name to search for
 * @returns Array of ABI names that contain the method
 */
export const findABIsWithMethod = async (methodName: string): Promise<string[]> => {
  const abiNames = await getAvailableABIs();
  const result: string[] = [];
  
  for (const abiName of abiNames) {
    const abi = await loadABIAsync(abiName);
    if (abi && abi.some((item: ABIItem) => 
      item.type === 'function' && item.name === methodName
    )) {
      result.push(abiName);
    }
  }
  
  return result;
};

/**
 * Preload important ABIs to ensure they're available before they're needed
 * This function should be called early in the app startup
 */
export const preloadCriticalABIs = async (): Promise<void> => {
  const criticalContracts = ['ProfileHub', 'Profile', 'CommissionHub', 'ArtPiece'];
  
  console.log('Preloading critical contract ABIs...');
  
  for (const contractName of criticalContracts) {
    try {
      const abi = await loadABIAsync(contractName);
      if (abi && Array.isArray(abi) && abi.length > 0) {
        // Store in cache
        abiCache[contractName] = abi;
        console.log(`Successfully preloaded ABI for ${contractName} (${abi.length} entries)`);
      } else {
        console.warn(`Failed to preload ABI for ${contractName}: Invalid ABI format`);
      }
    } catch (error) {
      console.error(`Error preloading ABI for ${contractName}:`, error);
    }
  }
};

export default {
  getAvailableABIs,
  loadABI,
  loadABIAsync,
  getMethodNames,
  findABIsWithMethod,
  preloadCriticalABIs
}; 