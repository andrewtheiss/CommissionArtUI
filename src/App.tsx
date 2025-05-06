import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import UpdateNFTOwnership from './pages/UpdateNFTOwnership'
import WelcomeWidget from './components/WelcomeWidget'
import { BlockchainProvider, useBlockchain } from './contexts/BlockchainContext'
import { syncNetworkWithBlockchain, setNetworkEverywhere } from './utils/networkBridge'
import AddArt from './pages/AddArt'
import Footer from './components/Footer'

// Network Status component that uses the blockchain context
const NetworkStatus = () => {
  const { isConnected, isLoading, networkType, network, switchToLayer } = useBlockchain();
  
  // Add console log to debug network type
  console.log('Current networkType:', networkType);
  
  // Determine layer based on network type
  const getLayer = () => {
    if (networkType === 'animechain') return 'L3';
    if (networkType === 'arbitrum_mainnet' || networkType === 'arbitrum_testnet') return 'L2';
    if (networkType === 'testnet' || networkType === 'mainnet') return ''; // No layer for our networks
    return 'L1';
  };

  const getNetworkDisplayName = () => {
    // Use our network name from config for testnet and mainnet
    if (networkType === 'testnet' || networkType === 'mainnet') {
      return network.name;
    }
    
    // For other networks, use the existing name + layer display
    return network.name;
  };

  // Minimal toggle handler
  const handleSwitch = (targetNetwork: 'testnet' | 'mainnet') => {
    if (isLoading || 
        (targetNetwork === 'testnet' && networkType.includes('testnet')) || 
        (targetNetwork === 'mainnet' && (networkType.includes('mainnet') || networkType === 'animechain'))) {
      return;
    }
    console.log('Switching network from', networkType, 'to', targetNetwork);
    setNetworkEverywhere(targetNetwork, switchToLayer);
  };
  
  // Determine which button should have the selected class
  // Match any network type containing "testnet" as a testnet
  const isTestnetSelected = networkType.includes('testnet');
  // Match any network type containing "mainnet" or "animechain" as mainnet
  const isMainnetSelected = networkType.includes('mainnet') || networkType === 'animechain';
  
  return (
    <div className={isLoading ? "blockchain-status loading" : "blockchain-status"}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Network: <span className="network-name">{getNetworkDisplayName()}</span>
        {getLayer() && <span className="environment">{getLayer()}</span>}
        {!isConnected && <span className="disconnected"> (Disconnected)</span>}
        {/* Radio-style network toggle */}
        <span style={{ display: 'flex', gap: 0, marginLeft: 12 }}>
          <button
            className={isTestnetSelected ? "network-radio-btn selected" : "network-radio-btn"}
            disabled={isLoading || isTestnetSelected}
            onClick={() => handleSwitch('testnet')}
          >
            Testnet
          </button>
          <button
            className={isMainnetSelected ? "network-radio-btn selected" : "network-radio-btn"}
            disabled={isLoading || isMainnetSelected}
            onClick={() => handleSwitch('mainnet')}
          >
            Mainnet
          </button>
        </span>
      </p>
    </div>
  );
};

// Main app component that uses the network bridge
const AppContent = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { switchToLayer, networkType, isConnected, isLoading } = useBlockchain();
  const [hasSynced, setHasSynced] = useState(false);
  
  useEffect(() => {
    // Sync the global network setting with blockchain context on load
    // Only run once to prevent unnecessary re-renders
    if (!hasSynced) {
      syncNetworkWithBlockchain(switchToLayer);
      setHasSynced(true);
    }
  }, [switchToLayer, hasSynced]);

  // Show a loading indicator while blockchain connection is initializing
  if (isLoading) {
    return (
      <div className="app-container loading-container">
        <div className="loader">Connecting to blockchain...</div>
      </div>
    );
  }
  
  return (
    <div className="app-container">
      <div className="app-main-content">
        <div className="app-header">
          <NetworkStatus />
          <div className="header-links">
            <Link to="/add-art" className="header-link">Add Art</Link>
            <Link to="/update-nft" className="update-nft-button">Update NFT Ownership</Link>
          </div>
        </div>
        
        <h1>Latest Commissions</h1>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/update-nft" element={<UpdateNFTOwnership />} />
          <Route path="/add-art" element={<AddArt />} />
        </Routes>
        
        <WelcomeWidget visible={showWelcome} onClose={() => setShowWelcome(false)} />
      </div>
      
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BlockchainProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </BlockchainProvider>
  )
}

export default App
