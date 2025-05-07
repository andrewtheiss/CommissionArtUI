import ArtPieceContract from './ArtPieceContract';

// Export individual contract modules
export { ArtPieceContract };

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

// Default export with all contract modules
export default {
  ArtPieceContract
}; 