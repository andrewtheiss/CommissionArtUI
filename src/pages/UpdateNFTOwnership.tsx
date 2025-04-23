import React from 'react';
import { Link } from 'react-router-dom';

const UpdateNFTOwnership: React.FC = () => {
  return (
    <div className="update-nft-page">
      <div className="update-nft-container">
        <h1>Update NFT Ownership</h1>
        <p>This page allows you to update the ownership information for your NFTs.</p>
        
        <div className="form-container">
          <div className="form-group">
            <label>NFT Contract Address</label>
            <input type="text" placeholder="0x..." />
          </div>
          
          <div className="form-group">
            <label>Token ID</label>
            <input type="text" placeholder="Enter token ID" />
          </div>
          
          <div className="form-group">
            <label>New Owner Address</label>
            <input type="text" placeholder="0x..." />
          </div>
          
          <button className="update-button">Update Ownership</button>
        </div>
        
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    </div>
  );
};

export default UpdateNFTOwnership; 