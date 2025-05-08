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
      // Set localStorage so modal doesn't show again today
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('welcomeWidgetLastShown', today);
      window.location.assign('/profile/0x2D68643fC11D8952324ca051fFa5c7DB5F9219D8');
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
      <h1 className="coming-soon-text">Welcome to Commission Art!</h1>
        <button className="close-button" onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem('welcomeWidgetLastShown', today);
          onClose();
        }}>×</button>
        
        <div className="nft-showcase">
          <div className="nft-image-container">
            <div className="nft-image">
              <img src={ogArt} alt="Original Artwork" className="artwork-image" />
            </div>
          </div>
          
          <p className="subtitle" style={{ fontWeight: 700, color: '#f44336', fontSize: '1.2em' }}>We are currently early Alpha</p>
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
        
        <a
          href="https://x.com/andrewtheiss"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', color: '#1da1f2', textDecoration: 'underline', fontWeight: 500, margin: '1.5em 0 1em 0' }}
        >
          Follow updates on X
        </a>
        <button className="notify-button" onClick={handleButtonClick}>
          {buttonState === 0 
            ? "For now,I will only use Testnet L2 - Sepolia Arbitrum" 
            : "I understand: ALL uploaded art during alpha will have to be re-uploaded."}
        </button>
      </div>
    </div>
  );
};

export default WelcomeWidget; 