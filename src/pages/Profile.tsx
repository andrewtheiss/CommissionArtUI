import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';
import { getUserProfile, createProfile } from '../contracts/ProfileHubContract';
import { getProfileInfo, getProfileRecentArtPieces } from '../contracts/ProfileContract';
import { ethers } from 'ethers';
import { getContractAddress } from '../utils/contracts';
import { loadABI } from '../utils/abi';
import { getArtPieceData } from '../contracts/ArtPieceContract';
import ArtDisplay from '../components/ArtDisplay';
import ArtDetailModal from '../components/ArtDetailModal';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import { showArtDetail } from '../utils/navigation';
import './Profile.css';

// Placeholder image until we load from blockchain
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

// Interface for art piece data
interface ArtPieceData {
  address: string;
  title: string;
  description: string;
  tokenUriData?: Uint8Array;
  tokenUriFormat?: string;
  owner?: string;
  artist?: string;
  isLoaded?: boolean;
}

// Interface for profile data
interface ProfileData {
  name: string;
  isArtist: boolean;
  profileImage: string | Uint8Array;
  profileImageData?: Uint8Array;
  owner: string;
}

const Profile: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { 
    isConnected, 
    isLoading, 
    networkType, 
    network, 
    walletAddress,
    hasUserProfile,
    checkUserProfile
  } = useBlockchain();
  
  // State for checking if profile exists
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  
  // State for profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Artist Name',
    isArtist: true,
    profileImage: DEFAULT_PROFILE_IMAGE,
    owner: address || '',
  });
  
  // State for art pieces and commissioned works
  const [myArtPieces, setMyArtPieces] = useState<ArtPieceData[]>([]);
  const [commissionedWorks, setCommissionedWorks] = useState<ArtPieceData[]>([]);
  const [isLoadingArt, setIsLoadingArt] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileCreationError, setProfileCreationError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  // State for art detail modal
  const [selectedArtId, setSelectedArtId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Add a preference for modal view
  const [preferModalView, setPreferModalView] = useState(true);
  
  // State for profile photo upload modal
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Open art detail modal
  const openArtDetailModal = (artId: string) => {
    setSelectedArtId(artId);
    setIsModalOpen(true);
  };
  
  // Close art detail modal
  const closeArtDetailModal = () => {
    setIsModalOpen(false);
    setSelectedArtId(null);
  };
  
  // Check if profile exists and get profile address
  useEffect(() => {
    const fetchProfileAddress = async () => {
      if (!address || !isConnected) {
        setIsCheckingProfile(false);
        return;
      }
      
      setIsCheckingProfile(true);
      
      try {
        // Create a provider
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        console.debug(`Fetching profile address for wallet address: ${address}`);
        // Get profile address from ProfileHub
        const profileAddr = await getUserProfile(address, provider);
        console.debug(`ProfileHub returned profile address: ${profileAddr}`);
        
        setProfileAddress(profileAddr);
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Error checking profile address:', error);
        setProfileAddress(null);
        setIsCheckingProfile(false);
      }
    };
    
    fetchProfileAddress();
  }, [address, isConnected, network.rpcUrl]);
  
  // Load profile data from blockchain when address changes and profile exists
  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileAddress || !isConnected) return;
      
      try {
        // Create a provider
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        console.debug(`Loading profile info for profile address: ${profileAddress}`);
        // Get profile info using the profileAddress obtained from ProfileHub
        const info = await getProfileInfo(profileAddress, provider);
        console.debug(`Profile info loaded for ${profileAddress}:`, info);
        
        // If there's a profile image, we need to fetch the image data from the contract
        let profileImageData: string | Uint8Array = DEFAULT_PROFILE_IMAGE;
        let imageRawData: Uint8Array | undefined = undefined;
        
        if (info.profileImage) {
          try {
            // Get the ArtPiece contract ABI
            const artPieceABI = loadABI('ArtPiece');
            
            if (artPieceABI) {
              // Create contract instance for the profile image
              const imageContract = new ethers.Contract(info.profileImage, artPieceABI, provider);
              
              // Fetch the image data
              const tokenUriData = await imageContract.getTokenURIData();
              
              if (tokenUriData) {
                // Store the raw image data for ArtDisplay
                imageRawData = tokenUriData;
                // Use the contract address as the image data source
                profileImageData = info.profileImage;
              }
            }
          } catch (imageError) {
            console.error(`Error loading profile image data from ${info.profileImage}:`, imageError);
            // Fall back to default image
            profileImageData = DEFAULT_PROFILE_IMAGE;
          }
        }
        
        setProfileData({
          name: `Profile at ${info.owner?.substring(0, 6)}...${info.owner?.substring(38)}`,
          isArtist: info.isArtist || false,
          profileImage: profileImageData,
          profileImageData: imageRawData,
          owner: info.owner || address || '',
        });
      } catch (error) {
        console.error(`Error loading profile data for profile ${profileAddress}:`, error);
      }
    };
    
    loadProfileData();
  }, [profileAddress, isConnected, network.rpcUrl, address]);
  
  // Load art pieces from blockchain
  useEffect(() => {
    const loadArtPieces = async () => {
      if (!profileAddress || !isConnected) return;
      
      setIsLoadingArt(true);
      
      try {
        // Create a provider
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        console.debug(`Loading art pieces for profile: ${profileAddress}`);
        // Use the profileAddress obtained from ProfileHub to get recent art pieces
        const artPieceAddresses = await getProfileRecentArtPieces(profileAddress, provider);
        console.debug(`Found ${artPieceAddresses.length} art pieces for profile: ${profileAddress}`);
        
        // Initialize art pieces array with minimal data
        const artPiecesInitial = artPieceAddresses.map(address => ({
          address,
          title: 'Loading...',
          description: 'Loading artwork data...',
          isLoaded: false
        }));
        
        // Set initial state while we load the full data
        setMyArtPieces(artPiecesInitial);
        
        // Load detailed data for each art piece in parallel
        const artPiecesPromises = artPieceAddresses.map(async (artAddress, index) => {
          try {
            // Get detailed art piece data including the image data
            const artData = await getArtPieceData(artAddress, provider);
            
            return {
              address: artAddress,
              title: artData.title,
              description: artData.description,
              tokenUriData: artData.tokenUriData,
              tokenUriFormat: artData.tokenUriFormat,
              owner: artData.owner,
              artist: artData.artist,
              isLoaded: true
            };
          } catch (error) {
            console.error(`Error loading data for art piece ${artAddress}:`, error);
            // Return the minimal data with error status
            return {
              ...artPiecesInitial[index],
              title: 'Error loading artwork',
              description: 'Could not load artwork data. Please try again later.',
              isLoaded: true
            };
          }
        });
        
        // Wait for all art piece data to load
        const loadedArtPieces = await Promise.all(artPiecesPromises);
        
        // Update state with the loaded art pieces
        setMyArtPieces(loadedArtPieces);
        
        setIsLoadingArt(false);
      } catch (error) {
        console.error(`Error loading art pieces for profile ${profileAddress}:`, error);
        setIsLoadingArt(false);
      }
    };
    
    loadArtPieces();
  }, [profileAddress, isConnected, network.rpcUrl]);
  
  // Load commissioned works only if artist
  useEffect(() => {
    const loadCommissionedWorks = async () => {
      if (!profileAddress || !isConnected || !profileData.isArtist) return;
      // Placeholder: in a real implementation, fetch commissioned works here
      setCommissionedWorks([]);
    };
    loadCommissionedWorks();
  }, [profileAddress, isConnected, network.rpcUrl, profileData.isArtist]);
  
  // Reusable art gallery component with ArtDisplay
  const ArtGallery = ({ title, artPieces }: { title: string, artPieces: ArtPieceData[] }) => (
    <div className="art-gallery-section">
      <h2>{title}</h2>
      {isLoadingArt ? (
        <div className="art-gallery-loading">
          <div className="spinner"></div>
          <p>Loading artwork...</p>
        </div>
      ) : artPieces.length === 0 ? (
        <div className="no-art-message">
          <p>No artwork to display</p>
        </div>
      ) : (
        <div className="art-gallery-grid">
          {artPieces.map((art, index) => (
            <div 
              key={index} 
              className="art-item-link"
              onClick={(e) => {
                e.preventDefault();
                showArtDetail(preferModalView, art.address, navigate, openArtDetailModal);
              }}
            >
              <div className="art-item">
                {art.tokenUriData ? (
                  <ArtDisplay 
                    imageData={art.tokenUriData} 
                    title={art.title}
                    contractAddress={art.address}
                    className="art-display-component"
                  />
                ) : (
                  <div className="art-fallback-container">
                    <div className="art-image-container">
                      <div className="art-loading-placeholder">
                        <p>Loading artwork data...</p>
                      </div>
                    </div>
                    <div className="art-details">
                      <h3 className="art-title">{art.title}</h3>
                      <p className="art-description">{art.description}</p>
                      <p className="art-address">{`${art.address.substring(0, 6)}...${art.address.substring(38)}`}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Handle profile creation
  const handleCreateProfile = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setIsCreatingProfile(true);
    setProfileCreationError(null);
    
    try {
      // Get a signer for the transaction
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get the ProfileHub contract directly
      const profileHubAddress = getContractAddress('profileHub');
      const profileHubABI = loadABI('ProfileHub');
      
      console.debug('ProfileHub contract info:', {
        address: profileHubAddress,
        abiExists: Boolean(profileHubABI),
        abiLength: Array.isArray(profileHubABI) ? profileHubABI.length : 'N/A'
      });
      
      if (!profileHubAddress || !profileHubABI || !Array.isArray(profileHubABI) || profileHubABI.length === 0) {
        throw new Error('ProfileHub contract address or ABI not found');
      }
      
      // Get signer address
      const userAddress = await signer.getAddress();
      
      // Create contract instance with signer
      const contract = new ethers.Contract(profileHubAddress, profileHubABI, signer);
      
      console.log('Checking if user already has a profile');
      // Check if user already has a profile
      let hasExistingProfile = false;
      try {
        hasExistingProfile = await contract.hasProfile(userAddress);
      } catch (error) {
        console.warn('Error checking if user has profile:', error);
        // Continue even if this check fails
      }
      
      if (hasExistingProfile) {
        throw new Error('You already have a profile');
      }
      
      console.log('Calling createProfile with explicit gas limit');
      
      // Call createProfile with explicit gas limit
      // Note: This function doesn't return the profile address, it emits an event
      const tx = await contract.createProfile({ 
        gasLimit: 1000000  // Explicit gas limit to avoid estimation issues
      });
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // After successful transaction, get the profile address
      console.log('Getting profile address for user:', userAddress);
      const newProfileAddress = await contract.getProfile(userAddress);
      
      console.log(`Profile created successfully at address: ${newProfileAddress}`);
      
      // Update the UI without page refresh
      setProfileAddress(newProfileAddress);
      
      // Update the profile status in the blockchain context
      await checkUserProfile();
      
      // Generate placeholder data for the newly created profile
      const placeholders = Array(6).fill(null).map((_, index) => ({
        address: `0x${index}abcdef1234567890abcdef1234567890abcdef12`,
        title: `Artwork ${index + 1}`,
        description: 'This is a sample artwork description',
        isLoaded: true
      }));
      
      setMyArtPieces(placeholders);
      
      // Set default profile data
      setProfileData({
        name: `Profile at ${walletAddress?.substring(0, 6)}...${walletAddress?.substring(38)}`,
        isArtist: true,
        profileImage: DEFAULT_PROFILE_IMAGE,
        owner: walletAddress || '',
      });
      
      // Set loading art to false
      setIsLoadingArt(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error instanceof Error) {
        // Extract more detailed error information if available
        if ('data' in error) {
          errorMessage = `Contract error: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `Error (${error.code}): ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setProfileCreationError(errorMessage);
    } finally {
      setIsCreatingProfile(false);
    }
  };
  
  // Check if this is the current user's profile
  const isOwnProfile = address === walletAddress;
  
  // Determine if we should show the "Create Profile" button
  const showCreateProfileButton = isOwnProfile && hasUserProfile === false;
  
  // Function to copy the profile address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      
      // Reset the "Copied!" message after 2 seconds
      setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy');
    }
  };
  
  // Handle successful profile photo upload
  const handlePhotoUploadSuccess = async () => {
    setShowPhotoUpload(false);
    
    if (!profileAddress || !isConnected) return;
    
    try {
      // Create a provider
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      console.debug(`Loading profile info for profile address: ${profileAddress}`);
      // Get profile info using the profileAddress obtained from ProfileHub
      const info = await getProfileInfo(profileAddress, provider);
      console.debug(`Profile info loaded for ${profileAddress}:`, info);
      
      // If there's a profile image, we need to fetch the image data from the contract
      let profileImageData: string | Uint8Array = DEFAULT_PROFILE_IMAGE;
      let imageRawData: Uint8Array | undefined = undefined;
      
      if (info.profileImage) {
        try {
          // Get the ArtPiece contract ABI
          const artPieceABI = loadABI('ArtPiece');
          
          if (artPieceABI) {
            // Create contract instance for the profile image
            const imageContract = new ethers.Contract(info.profileImage, artPieceABI, provider);
            
            // Fetch the image data
            const tokenUriData = await imageContract.getTokenURIData();
            
            if (tokenUriData) {
              // Store the raw image data for ArtDisplay
              imageRawData = tokenUriData;
              // Use the contract address as the image data source
              profileImageData = info.profileImage;
            }
          }
        } catch (imageError) {
          console.error(`Error loading profile image data from ${info.profileImage}:`, imageError);
          // Fall back to default image
          profileImageData = DEFAULT_PROFILE_IMAGE;
        }
      }
      
      setProfileData({
        name: `Profile at ${info.owner?.substring(0, 6)}...${info.owner?.substring(38)}`,
        isArtist: info.isArtist || false,
        profileImage: profileImageData,
        profileImageData: imageRawData,
        owner: info.owner || address || '',
      });
    } catch (error) {
      console.error(`Error loading profile data for profile ${profileAddress}:`, error);
    }
  };
  
  // Show loading state
  if (isCheckingProfile || isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  // Show "no profile" state
  if (!profileAddress) {
    return (
      <div className="profile-not-found">
        <h1>Profile Not Found</h1>
        <p>No profile exists for address {address}</p>
        {showCreateProfileButton && (
          <div className="create-profile-section">
            <button 
              className="create-profile-button" 
              onClick={handleCreateProfile}
              disabled={isCreatingProfile}
            >
              {isCreatingProfile ? (
                <>
                  <span className="spinner small"></span>
                  Creating Profile...
                </>
              ) : 'Create Your Profile'}
            </button>
            
            {profileCreationError && (
              <div className="error-message">
                {profileCreationError}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info-section">
          <div className="profile-image-container">
            {isCheckingProfile || isLoading ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="spinner" style={{ margin: '24px 0' }}></div>
                </div>
              </>
            ) : !profileData.profileImage || profileData.profileImage === '' ? (
              <div style={{ fontSize: '3rem', textAlign: 'center', margin: '24px 0' }} title="Profile image not found">🚫</div>
            ) : profileData.profileImage !== DEFAULT_PROFILE_IMAGE ? (
              <ArtDisplay
                imageData={profileData.profileImageData || profileData.profileImage}
                title="Profile Photo"
                className="profile-display"
                showDebug={false}
              />
            ) : (
              <img 
                src={DEFAULT_PROFILE_IMAGE} 
                alt="" 
                className="profile-image" 
              />
            )}
            {isOwnProfile && (
              <button 
                className="change-photo-button"
                onClick={() => setShowPhotoUpload(true)}
              >
                Change Photo
              </button>
            )}
          </div>
          <div className="profile-details left-justified">
            <h1 className="profile-name">Collector {profileData.owner ? `${profileData.owner.substring(0, 6)}...${profileData.owner.substring(profileData.owner.length - 4)}` : ''}</h1>
            <p className="profile-address">{profileData.owner}</p>
            <div className="profile-contract-address">
              <span className="profile-label">Profile Contract:</span>
              <span 
                className="profile-contract-value" 
                title={copySuccess || "Click to copy address"}
                onClick={() => profileAddress && copyToClipboard(profileAddress)}
              >
                {profileAddress ? `${profileAddress.substring(0, 8)}...${profileAddress.substring(profileAddress.length - 4)}` : ''}
                <span className="copy-icon">📋</span>
                {copySuccess && <span className="copy-indicator">{copySuccess}</span>}
              </span>
            </div>
            <div className="profile-badges">
              {profileData.isArtist && <span className="artist-badge">Artist</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="profile-content">
        <div className="gallery-header">
          <h2>My Art</h2>
        </div>
        
        <div className="art-gallery-section">
          {isLoadingArt ? (
            <div className="art-gallery-loading">
              <div className="spinner"></div>
              <p>Loading artwork...</p>
            </div>
          ) : myArtPieces.length === 0 ? (
            <div className="no-art-message">
              <p>No artwork to display</p>
            </div>
          ) : (
            <div className="art-gallery-grid">
              {myArtPieces.map((art, index) => (
                <div 
                  key={index} 
                  className="art-item-link"
                  onClick={(e) => {
                    e.preventDefault();
                    showArtDetail(preferModalView, art.address, navigate, openArtDetailModal);
                  }}
                >
                  <div className="art-item">
                    {art.tokenUriData ? (
                      <ArtDisplay 
                        imageData={art.tokenUriData} 
                        title={art.title}
                        contractAddress={art.address}
                        className="art-display-component"
                      />
                    ) : (
                      <div className="art-fallback-container">
                        <div className="art-image-container">
                          <div className="art-loading-placeholder">
                            <p>Loading artwork data...</p>
                          </div>
                        </div>
                        <div className="art-details">
                          <h3 className="art-title">{art.title}</h3>
                          <p className="art-description">{art.description}</p>
                          <p className="art-address">{`${art.address.substring(0, 6)}...${art.address.substring(38)}`}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Art Detail Modal */}
        {selectedArtId && (
          <ArtDetailModal 
            artId={selectedArtId}
            isOpen={isModalOpen}
            onClose={closeArtDetailModal}
          />
        )}
      </div>
      
      {/* Profile photo upload modal */}
      {showPhotoUpload && profileAddress && (
        <ProfilePhotoUpload
          profileAddress={profileAddress}
          isOpen={showPhotoUpload}
          onClose={() => setShowPhotoUpload(false)}
          onSuccess={handlePhotoUploadSuccess}
        />
      )}
    </div>
  );
};

export default Profile; 