import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import UpdateNFTOwnership from './pages/UpdateNFTOwnership'
import WelcomeWidget from './components/WelcomeWidget'
import { BlockchainProvider, useBlockchain, mapLayerToNetwork } from './contexts/BlockchainContext'
import { syncNetworkWithBlockchain, setNetworkEverywhere } from './utils/networkBridge'
import AddArt from './pages/AddArt'
import Footer from './components/Footer'
import Profile from './pages/Profile'

// Network Status component that uses the blockchain context
const NetworkStatus = () => {
  const { 
    isConnected, 
    isLoading, 
    networkType, 
    network, 
    switchToLayer, 
    connectWallet, 
    disconnect, 
    walletAddress 
  } = useBlockchain();
  
  // Add console log to debug network type
  console.log('Current networkType:', networkType);
  
  // Determine layer based on network type
  const getLayer = () => {
    if (networkType === 'animechain') return 'L3';
    if (networkType === 'animechain_testnet') return 'L3';
    if (networkType === 'arbitrum_testnet') return 'L2';
    if (networkType === 'arbitrum_mainnet') return 'L2';
    return '';
  };

  const getNetworkDisplayName = () => {
    // Custom network display names for clearer identification
    if (networkType === 'animechain') {
      return 'AnimeChain (Mainnet)';
    }
    if (networkType === 'animechain_testnet') {
      return 'AnimeChain Testnet';
    }
    if (networkType === 'arbitrum_testnet') {
      return 'Arbitrum Sepolia';
    }
    if (networkType === 'arbitrum_mainnet') {
      return 'Arbitrum One';
    }
    
    // For other networks, use the existing name from config
    return network.name;
  };

  // Enhanced handler for specific layer/environment combinations
  const handleSwitchLayer = async (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => {
    if (isLoading) {
      return;
    }
    
    const targetNetwork = mapLayerToNetwork(layer, environment);
    
    // Skip if already on this network
    if (networkType === targetNetwork) {
      return;
    }
    
    console.log(`Switching to ${environment} ${layer.toUpperCase()}: ${targetNetwork}`);
    
    // Switch network via context
    switchToLayer(layer, environment);
    
    // If the user is already connected, attempt to reconnect to the new network
    if (isConnected) {
      console.log('User is connected, attempting to reconnect to the new network');
      
      // Give MetaMask time to switch networks before trying to reconnect
      setTimeout(async () => {
        try {
          await connectWallet();
          console.log('Successfully reconnected to the new network');
        } catch (error) {
          console.error('Failed to reconnect to the new network:', error);
          // If reconnection fails, disconnect to maintain a consistent state
          disconnect();
        }
      }, 1000); // Wait 1 second before trying to reconnect
    }
  };
  
  // Determine which button should have the selected class
  const isMainnetSelected = networkType === 'animechain';
  const isTestnetL2Selected = networkType === 'arbitrum_testnet';
  const isTestnetL3Selected = networkType === 'animechain_testnet';
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
  };
  
  return (
    <div className={isLoading ? "blockchain-status loading" : "blockchain-status"}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        Network: <span className="network-name">{getNetworkDisplayName()}</span>
        {getLayer() && <span className="environment">{getLayer()}</span>}
        {!isConnected && <span className="disconnected"> (Disconnected)</span>}
        {/* Enhanced network toggle with L2/L3 options */}
        <span style={{ display: 'flex', gap: 0, marginLeft: 12 }}>
          <button
            className={isTestnetL2Selected ? "network-radio-btn selected" : "network-radio-btn"}
            disabled={isLoading || isTestnetL2Selected}
            onClick={() => handleSwitchLayer('l2', 'testnet')}
          >
            Testnet L2
          </button>
          <button
            className={isTestnetL3Selected ? "network-radio-btn selected" : "network-radio-btn"}
            disabled={isLoading || isTestnetL3Selected}
            onClick={() => handleSwitchLayer('l3', 'testnet')}
          >
            Testnet L3
          </button>
          <button
            className={isMainnetSelected ? "network-radio-btn selected" : "network-radio-btn"}
            disabled={isLoading || isMainnetSelected}
            onClick={() => switchToLayer('l3', 'mainnet')}
          >
            Mainnet
          </button>
        </span>
        {/* Connect/Disconnect button */}
        <button
          className="network-action-btn"
          disabled={isLoading}
          onClick={isConnected ? handleDisconnect : handleConnectWallet}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </p>
    </div>
  );
};

// Main app component that uses the network bridge
const AppContent = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { switchToLayer, networkType, isConnected, isLoading, walletAddress } = useBlockchain();
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
            <Link to={`/profile/${walletAddress || ''}`} className="update-nft-button">Account</Link>
          </div>
        </div>
        
        <h1>Latest Commissions</h1>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/update-nft" element={<UpdateNFTOwnership />} />
          <Route path="/add-art" element={<AddArt />} />
          <Route path="/profile/:address" element={<Profile />} />
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
