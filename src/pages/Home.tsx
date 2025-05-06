import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';

const Home = () => {
  const { isConnected, isLoading, networkType, network } = useBlockchain();
  const [contracts, setContracts] = useState<string[]>([]);

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
      <div className="image-grid">
        {renderPlaceholders()}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Connecting to AnimeChain...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 