import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';

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
  const { isConnected, isLoading, networkType, network, walletAddress } = useBlockchain();
  
  // State for checking if profile exists
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
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
  
  // Check if profile exists
  useEffect(() => {
    const checkProfileExists = async () => {
      if (!address || !isConnected) {
        setIsCheckingProfile(false);
        return;
      }
      
      setIsCheckingProfile(true);
      
      try {
        // TODO: Replace with actual blockchain call to check if profile exists
        // Example: const profileHub = await getProfileHubContract();
        // const exists = await profileHub.hasProfile(address);
        
        // For now, we'll use mock data with a 50/50 chance for demo
        setTimeout(() => {
          // Generating random boolean for demo purposes only
          // In real implementation, this would be determined by the blockchain call
          const exists = Math.random() > 0.5;
          setProfileExists(exists);
          setIsCheckingProfile(false);
        }, 1000);
      } catch (error) {
        console.error('Error checking if profile exists:', error);
        setProfileExists(false);
        setIsCheckingProfile(false);
      }
    };
    
    checkProfileExists();
  }, [address, isConnected]);
  
  // Load profile data from blockchain when address changes and profile exists
  useEffect(() => {
    const loadProfileData = async () => {
      if (!address || !isConnected || !profileExists) return;
      
      try {
        // TODO: Replace with actual blockchain calls
        // Example: const profile = await getProfileContract(address);
        // const isArtist = await profile.isArtist();
        // const profileImageAddress = await profile.profileImage();
        // etc.
        
        // For now, we'll use placeholder data
        setTimeout(() => {
          setProfileData({
            name: `Artist at ${address?.substring(0, 6)}...${address?.substring(38)}`,
            isArtist: true,
            profileImage: DEFAULT_PROFILE_IMAGE,
            owner: address,
          });
        }, 1000);
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    
    loadProfileData();
  }, [address, isConnected, profileExists]);
  
  // Load art pieces from blockchain
  useEffect(() => {
    const loadArtPieces = async () => {
      if (!address || !isConnected || !profileExists) return;
      
      setIsLoadingArt(true);
      
      try {
        // TODO: Replace with actual blockchain calls
        // For MyArt: profile.getArtPieces(0, 10);
        // For Commissioned: profile.getArtistCommissionedWorks(0, 10);
        
        // Mock data for now
        const mockArtPieces = Array(6).fill(null).map((_, index) => ({
          address: `0x${index}abcdef1234567890abcdef1234567890abcdef12`,
          title: `Artwork ${index + 1}`,
          description: 'This is a sample artwork description',
          imageUrl: `https://picsum.photos/seed/${index + 1}/300/200`,
        }));
        
        const mockCommissions = Array(4).fill(null).map((_, index) => ({
          address: `0x${index}fedcba0987654321fedcba0987654321fedcba09`,
          title: `Commission ${index + 1}`,
          description: 'This is a sample commission description',
          imageUrl: `https://picsum.photos/seed/${index + 10}/300/200`,
        }));
        
        setTimeout(() => {
          setMyArtPieces(mockArtPieces);
          setCommissionedWorks(mockCommissions);
          setIsLoadingArt(false);
        }, 1500);
      } catch (error) {
        console.error('Error loading art pieces:', error);
        setIsLoadingArt(false);
      }
    };
    
    loadArtPieces();
  }, [address, isConnected, profileExists]);
  
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
      // TODO: Show connect wallet message or redirect to login
      return;
    }
    
    setIsCreatingProfile(true);
    
    try {
      // TODO: Replace with actual blockchain call to create profile
      // Example: const profileHub = await getProfileHubContract();
      // await profileHub.createProfile();
      
      // Simulate profile creation
      setTimeout(() => {
        setProfileExists(true);
        setIsCreatingProfile(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating profile:', error);
      setIsCreatingProfile(false);
    }
  };
  
  // Loading screen
  if (isLoading || isCheckingProfile) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile information...</p>
      </div>
    );
  }
  
  // Profile not found view
  if (!profileExists) {
    const isOwnProfile = walletAddress?.toLowerCase() === address?.toLowerCase();
    
    return (
      <div className="profile-not-found">
        <div className="profile-not-found-content">
          <div className="profile-not-found-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="9" r="3" stroke="#535bf2" strokeWidth="1.5"/>
              <path d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20" stroke="#535bf2" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="10" stroke="#535bf2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3"/>
            </svg>
          </div>
          <h2>Profile Not Found</h2>
          <p className="address-display">{address}</p>
          <p className="profile-not-found-message">
            This address doesn't have a profile on Commission Art yet.
          </p>
          
          {isOwnProfile ? (
            <div className="create-profile-section">
              <p>This looks like your address. Would you like to create a profile?</p>
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
                ) : 'Create My Profile'}
              </button>
            </div>
          ) : (
            <div className="other-address-message">
              <p>You're viewing someone else's address. They need to create their own profile.</p>
              <Link to="/" className="return-home-link">Return to Home</Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Normal profile view
  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-info-section">
            <div className="profile-image-container">
              <img 
                src={profileData.profileImage} 
                alt="Profile" 
                className="profile-image" 
              />
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{profileData.name}</h1>
              <div className="profile-badges">
                {profileData.isArtist && <span className="artist-badge">Artist</span>}
              </div>
              <div className="profile-address">
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-content">
          <ArtGallery title="My Art" artPieces={myArtPieces} />
          <ArtGallery title="Commissioned Works" artPieces={commissionedWorks} />
        </div>
      </div>
    </div>
  );
};

export default Profile; 