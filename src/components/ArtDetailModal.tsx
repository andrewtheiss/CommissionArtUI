import React from 'react';
import ArtDetail from '../pages/ArtDetail';

interface ArtDetailModalProps {
  artId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ArtDetailModal: React.FC<ArtDetailModalProps> = ({ artId, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <ArtDetail 
      artId={artId} 
      isModal={true} 
      onClose={onClose} 
    />
  );
};

export default ArtDetailModal; 