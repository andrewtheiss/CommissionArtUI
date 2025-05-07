import { useBlockchain } from '../contexts/BlockchainContext';

interface ProfileStatusIndicatorProps {
  className?: string;
}

const ProfileStatusIndicator = ({ className = '' }: ProfileStatusIndicatorProps) => {
  const { isConnected, hasUserProfile, checkUserProfile } = useBlockchain();

  // Don't render anything if not connected
  if (!isConnected) {
    return null;
  }

  // Determine the status dot class
  let statusDotClass = 'status-dot';
  if (hasUserProfile === true) {
    statusDotClass += ' status-dot-green';
  } else if (hasUserProfile === false) {
    statusDotClass += ' status-dot-red';
  } else {
    statusDotClass += ' status-dot-loading';
  }

  // Determine tooltip text
  let tooltipText = 'Checking profile status...';
  if (hasUserProfile === true) {
    tooltipText = 'Profile exists - Click to refresh status';
  } else if (hasUserProfile === false) {
    tooltipText = 'No profile found - Click to refresh status';
  }

  // Handle click to refresh profile status
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent link click
    checkUserProfile();
  };

  return (
    <span className={`profile-status-indicator ${className}`}>
      <span 
        className={statusDotClass} 
        title={tooltipText}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    </span>
  );
};

export default ProfileStatusIndicator; 