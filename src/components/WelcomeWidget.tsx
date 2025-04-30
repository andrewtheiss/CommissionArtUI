import { useState, useEffect } from 'react';
import '../styles/WelcomeWidget.css';
// Import artwork images
import ogArt from '../assets/art/og.webp';
import characterDesignArt from '../assets/art/characterDesign.webp';
import fullBodyArt from '../assets/art/fullBody.webp';
import videoFile from '../assets/art/vid.mp4';

interface WelcomeWidgetProps {
  visible: boolean;
  onClose: () => void;
}

const WelcomeWidget: React.FC<WelcomeWidgetProps> = ({ visible, onClose }) => {
  if (!visible) return null;
  
  const [buttonState, setButtonState] = useState(0);

  const handleButtonClick = () => {
    if (buttonState === 0) {
      setButtonState(1);
    } else if (buttonState === 1) {
      window.open('https://x.com/andrewtheiss', '_blank');
    }
  };

  // Art commissions with actual artwork
  const commissions = [
    {
      id: 1,
      title: "Character Design",
      description: "Custom anime character portrait",
      artist: "cha_wak_",
      image: characterDesignArt,
      type: "image"
    },
    {
      id: 2,
      title: "Video Animation",
      description: "Short animated scene with character",
      artist: "RedkamSitipop",
      video: videoFile,
      type: "video"
    },
    {
      id: 3,
      title: "Full Body Artwork",
      description: "Complete character illustration",
      artist: "undertow6150",
      image: fullBodyArt,
      type: "image"
    }
  ];

  return (
    <div className="welcome-overlay">
      <div className="welcome-widget">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="nft-showcase">
          <div className="nft-image-container">
            <div className="nft-image">
              <img src={ogArt} alt="Original Artwork" className="artwork-image" />
            </div>
          </div>
          
          <h1 className="coming-soon-text">Commission Art is coming soon</h1>
          <p className="subtitle">Curate and track your art.  Find artists and commission them.</p>
        </div>
        
        <div className="commission-grid">
          {commissions.map(commission => (
            <div key={commission.id} className="commission-card">
              <div className="commission-image">
                {commission.type === "image" ? (
                  <img src={commission.image} alt={commission.title} className="artwork-image" />
                ) : (
                  <video 
                    src={commission.video} 
                    className="artwork-video" 
                    autoPlay 
                    muted 
                    loop
                    playsInline
                  />
                )}
              </div>
              <div className="commission-info">
                <h3>{commission.title}</h3>
                <p>{commission.description}</p>
                <span className="price">By: {commission.artist}</span>
              </div>
            </div>
          ))}
        </div>
        
        <button className="notify-button" onClick={handleButtonClick}>
          {buttonState === 0 
            ? "Notify me when Beta Access is available" 
            : "No emails yet: Follow development on X for now"}
        </button>
      </div>
    </div>
  );
};

export default WelcomeWidget; 