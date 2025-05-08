import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import { BlockchainProvider, useBlockchain } from './contexts/BlockchainContext'
import { mapLayerToNetwork } from './utils/networkUtils'
import { syncNetworkWithBlockchain, setNetworkEverywhere } from './utils/networkBridge'
import Footer from './components/Footer'
import Profile from './pages/Profile'
import ProfileStatusIndicator from './components/ProfileStatusIndicator'
import { preloadCriticalABIs } from './utils/abi'
import ArtDetail from './pages/ArtDetail'
import WelcomeWidget from './components/WelcomeWidget'

// Preload critical ABIs to ensure they're available before they're needed
preloadCriticalABIs().catch(error => {
  console.error('Error preloading ABIs:', error);
});

// Lazy load heavy modules
const AddArt = lazy(() => import('./pages/AddArt'));
const UpdateNFTOwnership = lazy(() => import('./pages/UpdateNFTOwnership'));

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
  // Show WelcomeWidget only if not shown today
  const getShouldShowWelcome = () => {
    const lastShown = localStorage.getItem('welcomeWidgetLastShown');
    const today = new Date().toISOString().slice(0, 10);
    return lastShown !== today;
  };
  const [showWelcome, setShowWelcome] = useState(getShouldShowWelcome());
  const { switchToLayer, networkType, isConnected, isLoading, walletAddress, connectWallet } = useBlockchain();
  const [hasSynced, setHasSynced] = useState(false);
  // Add state to track initial loading vs. connection attempts
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    // Sync the global network setting with blockchain context on load
    // Only run once to prevent unnecessary re-renders
    if (!hasSynced) {
      syncNetworkWithBlockchain(switchToLayer);
      setHasSynced(true);
    }
  }, [switchToLayer, hasSynced]);

  // Track when initial loading is complete
  useEffect(() => {
    if (!initialLoadComplete && !isLoading) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Add connect handler for Account button
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Remove the full-page loading screen. Always render the app structure.
  return (
    <div className="app-container">
      {isLoading && !initialLoadComplete && (
        <div style={{ width: '100%', background: '#23234a', color: '#fff', textAlign: 'center', padding: '8px 0', fontWeight: 500, letterSpacing: 1, zIndex: 1000 }}>
          <span className="spinner" style={{ marginRight: 10, verticalAlign: 'middle' }} />
          Connecting to blockchain...
        </div>
      )}
      <div className="app-main-content">
        <div className="app-header">
          <NetworkStatus />
          <div className="header-links">
            <Link to="/" className="header-link">Home</Link>
            <Link to="/add-art" className="header-link">Add Art</Link>
            <Link to="/update-nft" className="update-nft-button">Update NFT Ownership</Link>
            <div className="account-link-container">
              {isConnected ? (
                <Link to={`/profile/${walletAddress || ''}`} className="update-nft-button">
                  Account
                </Link>
              ) : (
                <button className="update-nft-button" onClick={handleConnectWallet} style={{ minWidth: 0 }}>
                  Account
                </button>
              )}
              <ProfileStatusIndicator />
            </div>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/update-nft" element={
            <Suspense fallback={<div style={{textAlign: 'center', padding: '2em'}}><span className="spinner" style={{ marginRight: 10, verticalAlign: 'middle' }} />Loading...</div>}>
              <UpdateNFTOwnership />
            </Suspense>
          } />
          <Route path="/add-art" element={
            <Suspense fallback={<div style={{textAlign: 'center', padding: '2em'}}><span className="spinner" style={{ marginRight: 10, verticalAlign: 'middle' }} />Loading...</div>}>
              <AddArt />
            </Suspense>
          } />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/myArt/:artId" element={<ArtDetail />} />
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
