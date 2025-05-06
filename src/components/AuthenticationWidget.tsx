import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import './AuthenticationWidget.css';

const AuthenticationWidget = () => {
  const { 
    isConnected, 
    isLoading, 
    authMethod,
    connectWallet, 
    walletAddress,
    connectWithEmail,
    emailAddress,
    disconnect
  } = useBlockchain();

  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Handle email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
  };

  // Handle email form submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      connectWithEmail(emailInput.trim());
      setShowEmailForm(false);
    }
  };

  // Display account info based on auth method
  const renderAccountInfo = () => {
    if (!isConnected) return null;

    if (authMethod === 'web3' && walletAddress) {
      const shortAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
      return (
        <div className="account-info">
          <p>Connected with Wallet</p>
          <div className="address">
            {shortAddress}
          </div>
        </div>
      );
    }

    if (authMethod === 'email' && emailAddress) {
      return (
        <div className="account-info">
          <p>Connected with Email</p>
          <div className="email-address">
            {emailAddress}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render authentication options when not connected
  const renderAuthOptions = () => {
    if (isConnected) return null;

    return (
      <div className="auth-options">
        <button 
          className="connect-wallet-btn" 
          onClick={connectWallet}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {showEmailForm ? (
          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              value={emailInput}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              disabled={true} // Email authentication is greyed out
            />
            <button 
              type="submit" 
              disabled={true} // Email authentication is greyed out
              className="email-submit-btn greyed-out"
            >
              Connect with Email
            </button>
            <button 
              type="button" 
              onClick={() => setShowEmailForm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button 
            className="email-auth-btn greyed-out" 
            onClick={() => setShowEmailForm(true)}
            disabled={true} // Email authentication is greyed out
          >
            Connect with Email (Coming Soon)
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="authentication-widget">
      <h3>Authentication</h3>
      
      {renderAccountInfo()}
      {renderAuthOptions()}
      
      {isConnected && (
        <button 
          className="disconnect-btn" 
          onClick={disconnect}
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

export default AuthenticationWidget; 