import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtPieceData } from '../contracts/ArtPieceContract';
import { useBlockchain } from '../contexts/BlockchainContext';
import ArtDisplay from '../components/ArtDisplay';
import { ethers } from 'ethers';
import './ArtDetail.css';

export interface ArtDetailProps {
  artId?: string;  // Optional art ID, used when component is used directly
  isModal?: boolean; // Whether this is shown as a modal
  onClose?: () => void; // Close callback for modal mode
}

// Enhanced ArtDisplay wrapper that detects aspect ratio
const EnhancedArtDisplay = ({ 
  imageData, 
  title, 
  contractAddress,
  onAspectRatioDetected 
}: { 
  imageData: Uint8Array; 
  title: string; 
  contractAddress: string;
  onAspectRatioDetected: (ratio: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add mutation observer to detect when image is rendered within ArtDisplay
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        const imgElement = containerRef.current?.querySelector('.art-image');
        if (imgElement && imgElement instanceof HTMLImageElement) {
          if (imgElement.complete) {
            handleImageLoad(imgElement);
          } else {
            imgElement.onload = () => handleImageLoad(imgElement);
          }
        }
      });
      
      observer.observe(containerRef.current, { 
        childList: true,
        subtree: true
      });
      
      // Check periodically in case mutation observer misses the image
      const intervalId = setInterval(() => {
        const imgElement = containerRef.current?.querySelector('.art-image');
        if (imgElement && imgElement instanceof HTMLImageElement && imgElement.complete) {
          handleImageLoad(imgElement);
          clearInterval(intervalId);
        }
      }, 500);
      
      return () => {
        observer.disconnect();
        clearInterval(intervalId);
      };
    }
  }, []);
  
  const handleImageLoad = (imgElement: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = imgElement;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      console.log(`Image loaded with dimensions: ${naturalWidth}x${naturalHeight}, ratio: ${ratio}`);
      onAspectRatioDetected(ratio);
      
      // Apply size constraints: minimum 600px, maximum 800px in any dimension
      if (naturalWidth > naturalHeight) {
        // Landscape image
        if (naturalWidth > 800) {
          // Constrain width to 800px max
          imgElement.style.width = '800px';
          imgElement.style.height = 'auto';
        } else if (naturalWidth < 600) {
          // Ensure minimum width of 600px
          imgElement.style.width = '600px';
          imgElement.style.height = 'auto';
        }
      } else {
        // Portrait or square image
        if (naturalHeight > 800) {
          // Constrain height to 800px max
          imgElement.style.height = '800px';
          imgElement.style.width = 'auto';
        } else if (naturalHeight < 600) {
          // Ensure minimum height of 600px
          imgElement.style.height = '600px';
          imgElement.style.width = 'auto';
        }
      }
      
      // Ensure the other dimension doesn't exceed limits
      setTimeout(() => {
        if (imgElement.width > 800) {
          imgElement.style.width = '800px';
          imgElement.style.height = 'auto';
        }
        if (imgElement.height > 800) {
          imgElement.style.height = '800px';
          imgElement.style.width = 'auto';
        }
      }, 0);
    }
  };
  
  return (
    <div ref={containerRef} className="enhanced-art-display">
      <ArtDisplay 
        imageData={imageData} 
        title={title}
        contractAddress={contractAddress || ''}
        className="art-detail-display"
        showDebug={false}
      />
    </div>
  );
};

const ArtDetail: React.FC<ArtDetailProps> = ({ artId: propArtId, isModal = false, onClose }) => {
  const { artId: paramArtId } = useParams<{ artId: string }>();
  const navigate = useNavigate();
  const { network } = useBlockchain();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artData, setArtData] = useState<any>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  
  // Create a provider from the network information
  const provider = useMemo(() => {
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
  
  // Use prop artId if provided, otherwise use from route params
  const artId = propArtId || paramArtId;

  useEffect(() => {
    if (!artId) {
      setError('No art ID provided');
      setIsLoading(false);
      return;
    }

    if (!provider) {
      setError('Could not create blockchain provider');
      setIsLoading(false);
      return;
    }

    const loadArtData = async () => {
      try {
        setIsLoading(true);
        const data = await getArtPieceData(artId, provider);
        setArtData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading art piece:', err);
        setError('Failed to load artwork data');
        setIsLoading(false);
      }
    };

    loadArtData();
  }, [artId, provider]);

  const handleClose = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate(-1); // Go back to previous page if not in modal mode
    }
  };

  // Handle the aspect ratio detection from the enhanced art display
  const handleAspectRatioDetected = (ratio: number) => {
    setImageAspectRatio(ratio);
  };

  // Determine layout based on image aspect ratio
  const isLandscape = imageAspectRatio > 1.2; // If wider than tall by more than 20%
  const isPortrait = imageAspectRatio < 0.8; // If taller than wide by more than 20%
  // Otherwise it's treated as relatively square

  if (isLoading) {
    return (
      <div className={`art-detail-container ${isModal ? 'modal' : ''}`}>
        <div className="art-detail-content">
          <div className="art-detail-loading">
            <div className="spinner"></div>
            <p>Loading artwork...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artData) {
    return (
      <div className={`art-detail-container ${isModal ? 'modal' : ''}`}>
        <div className="art-detail-content">
          <div className="art-detail-error">
            <h3>Error</h3>
            <p>{error || 'Failed to load artwork'}</p>
            <button onClick={handleClose} className="back-button">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`art-detail-container ${isModal ? 'modal' : ''}`}>
      {isModal && (
        <div className="modal-overlay" onClick={(e) => {
          // Only close if clicking directly on the overlay, not on its children
          if (e.target === e.currentTarget) {
            handleClose();
          }
          e.stopPropagation(); // Prevent event from bubbling up
        }}></div>
      )}
      <div className={`art-detail-content ${isLandscape ? 'landscape' : isPortrait ? 'portrait' : 'square'}`}>
        {isModal && (
          <button onClick={handleClose} className="modal-close-button">
            &times;
          </button>
        )}
        <div className="art-detail-header">
          <h2>{artData.title}</h2>
          {!isModal && (
            <button onClick={handleClose} className="back-button">
              Back
            </button>
          )}
        </div>
        
        <div className="art-detail-main">
          <div className="art-detail-image">
            <EnhancedArtDisplay
              imageData={artData.tokenUriData}
              title={artData.title}
              contractAddress={artId || ''}
              onAspectRatioDetected={handleAspectRatioDetected}
            />
          </div>
          
          <div className="art-detail-info">
            <div className="art-info-section">
              <h3>Description</h3>
              <p>{artData.description || 'No description available'}</p>
            </div>
            <div className="art-info-section">
              <h3>Details</h3>
              <p><strong>Contract Address:</strong> {artId}</p>
              <p><strong>Artist:</strong> {artData.artist}</p>
              <p><strong>Owner:</strong> {artData.owner}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtDetail; 