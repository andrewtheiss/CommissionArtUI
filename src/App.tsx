import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import UpdateNFTOwnership from './pages/UpdateNFTOwnership'

function App() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Effect to simulate connection
  useEffect(() => {
    setTimeout(() => {
      setConnected(true);
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-header">
          <div className={loading ? "blockchain-status loading" : "blockchain-status"}>
            <p>
              Network: <span className="network-name">AnimeChain</span>
              <span className="environment">L3</span>
              {!connected && <span className="disconnected"> (Disconnected)</span>}
            </p>
          </div>
          <Link to="/update-nft" className="update-nft-button">Update NFT Ownership</Link>
        </div>
        
        <h1>AnimeChain Commission Art</h1>
        
        <Routes>
          <Route path="/" element={<Home loading={loading} connected={connected} />} />
          <Route path="/update-nft" element={<UpdateNFTOwnership />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
