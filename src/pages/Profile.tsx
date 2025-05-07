import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';
import { getUserProfile, createProfile } from '../contracts/ProfileHubContract';
import { getProfileInfo, getProfileRecentArtPieces } from '../contracts/ProfileContract';
import { ethers } from 'ethers';
import { getContractAddress } from '../utils/contracts';
import { loadABI } from '../utils/abi';

// Placeholder image until we load from blockchain
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

// Interface for art piece data
interface ArtPieceData {
  address: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

const Profile: React.FC = () => {
  const { address } = useParams<{ address: string }>();
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
  const [profileData, setProfileData] = useState<{
    name: string;
    isArtist: boolean;
    profileImage: string;
    owner: string;
  }>({
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
        
        // Get profile address from ProfileHub
        const profileAddr = await getUserProfile(address, provider);
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
        
        // Get profile info
        const info = await getProfileInfo(profileAddress, provider);
        
        setProfileData({
          name: `Profile at ${info.owner?.substring(0, 6)}...${info.owner?.substring(38)}`,
          isArtist: info.isArtist || false,
          profileImage: info.profileImage || DEFAULT_PROFILE_IMAGE,
          owner: info.owner || address || '',
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
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
        
        // Get recent art pieces
        const artPieceAddresses = await getProfileRecentArtPieces(profileAddress, provider);
        
        // For now, we'll use placeholder data with the real addresses
        const mockArtPieces = artPieceAddresses.map((artAddress, index) => ({
          address: artAddress,
          title: `Artwork ${index + 1}`,
          description: 'This is a sample artwork description',
          imageUrl: `https://picsum.photos/seed/${index + 1}/300/200`,
        }));
        
        // If no art pieces were found, use mock data for demonstration
        if (mockArtPieces.length === 0) {
          const placeholders = Array(6).fill(null).map((_, index) => ({
            address: `0x${index}abcdef1234567890abcdef1234567890abcdef12`,
            title: `Artwork ${index + 1}`,
            description: 'This is a sample artwork description',
            imageUrl: `https://picsum.photos/seed/${index + 1}/300/200`,
          }));
          
          setMyArtPieces(placeholders);
        } else {
          setMyArtPieces(mockArtPieces);
        }
        
        // For commissioned works, we'll use mock data for now
        const mockCommissions = Array(4).fill(null).map((_, index) => ({
          address: `0x${index}fedcba0987654321fedcba0987654321fedcba09`,
          title: `Commission ${index + 1}`,
          description: 'This is a sample commission description',
          imageUrl: `https://picsum.photos/seed/${index + 10}/300/200`,
        }));
        
        setCommissionedWorks(mockCommissions);
        setIsLoadingArt(false);
      } catch (error) {
        console.error('Error loading art pieces:', error);
        setIsLoadingArt(false);
      }
    };
    
    loadArtPieces();
  }, [profileAddress, isConnected, network.rpcUrl]);
  
  // Reusable art gallery component
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
            <div key={index} className="art-item">
              <div className="art-image-container">
                <img src={art.imageUrl} alt={art.title} className="art-image" />
              </div>
              <div className="art-details">
                <h3 className="art-title">{art.title}</h3>
                <p className="art-description">{art.description}</p>
                <p className="art-address">{`${art.address.substring(0, 6)}...${art.address.substring(38)}`}</p>
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
        imageUrl: `https://picsum.photos/seed/${index + 1}/300/200`,
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
            <img src={profileData.profileImage} alt="Profile" className="profile-image" />
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{profileData.name}</h1>
            <p className="profile-address">{profileData.owner}</p>
            <div className="profile-contract-address">
              <span className="profile-label">Profile Contract:</span>
              <span 
                className="profile-contract-value" 
                title={copySuccess || "Click to copy address"}
                onClick={() => profileAddress && copyToClipboard(profileAddress)}
              >
                {profileAddress ? `${profileAddress.substring(0, 8)}...${profileAddress.substring(36)}` : ''}
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
        <ArtGallery title="My Art" artPieces={myArtPieces} />
        
        {profileData.isArtist && (
          <ArtGallery title="Commissioned Works" artPieces={commissionedWorks} />
        )}
      </div>
    </div>
  );
};

export default Profile; 