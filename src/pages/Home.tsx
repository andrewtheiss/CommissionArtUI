import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';

const Home = () => {
  const { isConnected, isLoading, networkType, network } = useBlockchain();
  const [contracts, setContracts] = useState<string[]>([]);
  // Track when initial data is being loaded
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Number of placeholder images to show initially
  const placeholderCount = 6;

  // Mock data for demonstration
  useEffect(() => {
    const mockContracts = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12',
      '0x7890abcdef1234567890abcdef1234567890abcd'
    ];

    setTimeout(() => {
      setContracts(mockContracts);
      setIsDataLoading(false);
    }, 1500);
  }, []);

  // Generate placeholders based on whether we have contracts or not
  const renderPlaceholders = () => {
    if (contracts.length > 0) {
      return contracts.map((contract, index) => (
        <div key={index} className="image-placeholder">
          <div className="image-outline"></div>
          <div className="contract-address">{`${contract.substring(0, 6)}...${contract.substring(38)}`}</div>
        </div>
      ));
    } else {
      // Show empty placeholders before data loads
      return Array(placeholderCount).fill(0).map((_, index) => (
        <div key={index} className="image-placeholder">
          <div className="image-outline"></div>
          <div className="contract-address placeholder"></div>
        </div>
      ));
    }
  };

  return (
    <div className="container">
        
    <h1>Latest Commissions</h1>
    <div style={{ textAlign: 'center', marginBottom: '1.5em', color: '#aaa', fontSize: '1.1em' }}>
      <div style={{ fontStyle: 'italic', fontWeight: 500, marginBottom: '0.5em' }}>
        *Verified Commissions Coming Soon*
      </div>
      <div>
        for now, <a href="/profile/0x2D68643fC11D8952324ca051fFa5c7DB5F9219D8" style={{ color: '#646cff', textDecoration: 'underline' }}>check one out</a> or upload some art
      </div>
    </div>
      <div className="image-grid">
        {renderPlaceholders()}
        {isDataLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 