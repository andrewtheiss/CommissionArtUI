import ArtPieceContract from './ArtPieceContract';
import ProfileContract from './ProfileContract';
import ProfileHubContract from './ProfileHubContract';

// Export individual contract modules
export { ArtPieceContract, ProfileContract, ProfileHubContract };

// Export specific functions from contract modules
export { 
  getArtPieceTemplateContract,
  getArtPieceContract,
  useArtPieceTemplateContract,
  createMinimalProxy,
  getArtPieceById,
  getArtPiecesByOwner,
  createArtPiece
} from './ArtPieceContract';

export {
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
  setProfileImage
} from './ProfileContract';

export {
  getProfileHubContract,
  useProfileHubContract,
  hasProfile,
  getUserProfile,
  createProfile,
  getUserProfiles,
  createNewArtPieceAndRegisterProfile
} from './ProfileHubContract';

// Default export with all contract modules
export default {
  ArtPieceContract,
  ProfileContract,
  ProfileHubContract
}; 