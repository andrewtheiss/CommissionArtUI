// This is a placeholder until real ABIs are manually added
// Import ABIs from their respective files
// The commented imports will be uncommented once the ABI files are added
/*
import ArrayManagerABI from '../assets/abis/ArrayManager.json';
import ArtPieceABI from '../assets/abis/ArtPiece.json';
import ArtPieceOffChainABI from '../assets/abis/ArtPieceOffChain.json';
import CommissionHubABI from '../assets/abis/CommissionHub.json';
import L1QueryOwnerABI from '../assets/abis/L1QueryOwner.json';
import L2RelayABI from '../assets/abis/L2Relay.json';
import OwnerRegistryABI from '../assets/abis/OwnerRegistry.json';
import ProfileABI from '../assets/abis/Profile.json';
import ProfileHubABI from '../assets/abis/ProfileHub.json';
import SimpleERC721ABI from '../assets/abis/SimpleERC721.json';
*/

// Temporary placeholder ABIs until real ones are added
// These are minimal ABIs with basic ERC721 functions to allow the code to work
const placeholderERC721ABI = [
  // Basic ERC721 functions
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // ArtPiece specific functions (placeholders)
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getArtPiece",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string", "name": "uri", "type": "string"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
        ],
        "internalType": "struct ArtPiece.ArtPieceData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "uri", "type": "string"}
    ],
    "name": "createArtPiece",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Actual initialize function from the contract
  {
    "inputs": [
      {"internalType": "bytes", "name": "_token_uri_data", "type": "bytes"},
      {"internalType": "string", "name": "_token_uri_data_format", "type": "string"},
      {"internalType": "string", "name": "_title_input", "type": "string"},
      {"internalType": "string", "name": "_description_input", "type": "string"},
      {"internalType": "address", "name": "_owner_input", "type": "address"},
      {"internalType": "address", "name": "_artist_input", "type": "address"},
      {"internalType": "address", "name": "_commission_hub", "type": "address"},
      {"internalType": "bool", "name": "_ai_generated", "type": "bool"}
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Common functions for proxy contracts
  {
    "inputs": [],
    "name": "initialized",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isInitialized",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const placeholderCommissionHubABI = [
  // Basic CommissionHub functions (placeholders)
  {
    "inputs": [],
    "name": "getCommissions",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "commissionId", "type": "uint256"}],
    "name": "getCommissionDetails",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "client", "type": "address"},
          {"internalType": "address", "name": "artist", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "string", "name": "description", "type": "string"}
        ],
        "internalType": "struct CommissionHub.CommissionData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Placeholder ABI for Profile contract based on the provided Vyper code
const placeholderProfileABI = [
  // View functions
  {
    "inputs": [],
    "name": "deployer",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hub",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
    "name": "artistCommissionedWorkCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "artistErc1155sToSellCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "artistProceedsAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Initialize function
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Setter functions
  {
    "inputs": [{"internalType": "bool", "name": "_is_artist", "type": "bool"}],
    "name": "setIsArtist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_image", "type": "address"}],
    "name": "setProfileImage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_format", "type": "string"}],
    "name": "setProfileImageFormat",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Art piece functions
  {
    "inputs": [{"internalType": "address", "name": "_art_piece", "type": "address"}],
    "name": "addArtPiece",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_art_piece", "type": "address"}],
    "name": "removeArtPiece",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_page", "type": "uint256"}, {"internalType": "uint256", "name": "_page_size", "type": "uint256"}],
    "name": "getArtPieces",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_page", "type": "uint256"}, {"internalType": "uint256", "name": "_page_size", "type": "uint256"}],
    "name": "getRecentArtPieces",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLatestArtPieces",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Commission functions
  {
    "inputs": [{"internalType": "address", "name": "_commission", "type": "address"}],
    "name": "addCommission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_commission", "type": "address"}],
    "name": "removeCommission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_page", "type": "uint256"}, {"internalType": "uint256", "name": "_page_size", "type": "uint256"}],
    "name": "getCommissions",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Create art piece function
  {
    "inputs": [
      {"internalType": "address", "name": "_art_piece_template", "type": "address"},
      {"internalType": "bytes", "name": "_token_uri_data", "type": "bytes"},
      {"internalType": "string", "name": "_token_uri_data_format", "type": "string"},
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "bool", "name": "_is_artist", "type": "bool"},
      {"internalType": "address", "name": "_other_party", "type": "address"},
      {"internalType": "address", "name": "_commission_hub", "type": "address"},
      {"internalType": "bool", "name": "_ai_generated", "type": "bool"}
    ],
    "name": "createArtPiece",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Placeholder ABI for ProfileHub contract based on the provided Vyper code
const placeholderProfileHubABI = [
  // View functions
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "profileTemplate",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "accountToProfile",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "userCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Profile management functions
  {
    "inputs": [],
    "name": "createProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "hasProfile",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_new_template", "type": "address"}],
    "name": "updateProfileTemplateContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_page_size", "type": "uint256"}, {"internalType": "uint256", "name": "_page_number", "type": "uint256"}],
    "name": "getUserProfiles",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Create art piece and register profile
  {
    "inputs": [
      {"internalType": "address", "name": "_art_piece_template", "type": "address"},
      {"internalType": "bytes", "name": "_token_uri_data", "type": "bytes"},
      {"internalType": "string", "name": "_token_uri_data_format", "type": "string"},
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "bool", "name": "_is_artist", "type": "bool"},
      {"internalType": "address", "name": "_other_party", "type": "address"},
      {"internalType": "address", "name": "_commission_hub", "type": "address"},
      {"internalType": "bool", "name": "_ai_generated", "type": "bool"}
    ],
    "name": "createNewArtPieceAndRegisterProfile",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Create profile from contract
  {
    "inputs": [{"internalType": "address", "name": "_profile_contract", "type": "address"}],
    "name": "createProfileFromContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "profile", "type": "address"}
    ],
    "name": "ProfileCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "profile", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "art_piece", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "ArtPieceCreated",
    "type": "event"
  }
];

// Default placeholder for other contracts
const placeholderABI: any[] = [];

// Map of ABI names to their actual content
const abiMap: { [key: string]: any[] } = {
  // These will be replaced with real ABIs once files are added
  'ArrayManager': placeholderABI,
  'ArtPiece': placeholderERC721ABI,
  'ArtPieceOffChain': placeholderABI,
  'CommissionHub': placeholderCommissionHubABI,
  'L1QueryOwner': placeholderABI,
  'L2Relay': placeholderABI,
  'OwnerRegistry': placeholderABI,
  'Profile': placeholderProfileABI,
  'ProfileHub': placeholderProfileHubABI,
  'SimpleERC721': placeholderERC721ABI,
};

/**
 * Get the list of available ABI names
 * @returns Array of available ABI names
 */
export const getAvailableABIs = (): string[] => {
  return Object.keys(abiMap);
};

/**
 * Load an ABI by name
 * @param abiName Name of the ABI to load
 * @returns The ABI object or null if not found
 */
export const loadABI = (abiName: string): any => {
  if (!abiName || !abiMap[abiName]) {
    console.error(`ABI '${abiName}' not found`);
    return null;
  }
  
  return abiMap[abiName];
};

/**
 * Get the human-readable method names from an ABI
 * @param abiName Name of the ABI to analyze
 * @returns Array of method names
 */
export const getMethodNames = (abiName: string): string[] => {
  const abi = loadABI(abiName);
  if (!abi) return [];
  
  return abi
    .filter((item: any) => item.type === 'function')
    .map((item: any) => item.name);
};

/**
 * Find ABIs that have a specific method
 * @param methodName Method name to search for
 * @returns Array of ABI names that contain the method
 */
export const findABIsWithMethod = (methodName: string): string[] => {
  return Object.keys(abiMap).filter(abiName => {
    const abi = abiMap[abiName];
    return abi.some((item: any) => 
      item.type === 'function' && item.name === methodName
    );
  });
};

export default {
  getAvailableABIs,
  loadABI,
  getMethodNames,
  findABIsWithMethod
}; 