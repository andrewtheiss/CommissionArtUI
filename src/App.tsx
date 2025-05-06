import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import UpdateNFTOwnership from './pages/UpdateNFTOwnership'
import WelcomeWidget from './components/WelcomeWidget'
import { BlockchainProvider, useBlockchain } from './contexts/BlockchainContext'

// Network Status component that uses the blockchain context
const NetworkStatus = () => {
  const { isConnected, isLoading, networkType, network } = useBlockchain();
  
  // Determine layer based on network type
  const getLayer = () => {
    if (networkType === 'animechain') return 'L3';
    if (networkType === 'arbitrum_mainnet' || networkType === 'arbitrum_testnet') return 'L2';
    return 'L1';
  };
  
  return (
    <div className={isLoading ? "blockchain-status loading" : "blockchain-status"}>
      <p>
        Network: <span className="network-name">{network.name}</span>
        <span className="environment">{getLayer()}</span>
        {!isConnected && <span className="disconnected"> (Disconnected)</span>}
      </p>
    </div>
  );
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <BlockchainProvider>
      <BrowserRouter>
        <div className="app-container">
          <div className="app-header">
            <NetworkStatus />
            <Link to="/update-nft" className="update-nft-button">Update NFT Ownership</Link>
          </div>
          
          <h1>Latest Commissions</h1>
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/update-nft" element={<UpdateNFTOwnership />} />
          </Routes>
          
          <WelcomeWidget visible={showWelcome} onClose={() => setShowWelcome(false)} />
        </div>
      </BrowserRouter>
    </BlockchainProvider>
  )
}

export default App
