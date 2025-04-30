import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { L1ToL2MessageGasEstimator } from '@arbitrum/sdk';

interface GasEstimate {
  network: string;
  estimatedGas: string;
  estimatedCost: string;
  isLoading: boolean;
  error: string | null;
}

const UpdateNFTOwnership: React.FC = () => {
  // Form state
  const [nftContract, setNftContract] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
  
  // Gas estimation state
  const [l1Provider, setL1Provider] = useState<ethers.JsonRpcProvider | null>(null);
  const [l2Provider, setL2Provider] = useState<ethers.JsonRpcProvider | null>(null);
  const [gasEstimates, setGasEstimates] = useState<Record<string, GasEstimate>>({
    ethereum: {
      network: 'Ethereum (L1)',
      estimatedGas: '0',
      estimatedCost: '0',
      isLoading: false,
      error: null
    },
    arbitrum: {
      network: 'Arbitrum (L2)',
      estimatedGas: '0',
      estimatedCost: '0',
      isLoading: false,
      error: null
    }
  });
  const [totalEstimatedCost, setTotalEstimatedCost] = useState<string>('0');
  const [isBelowThreshold, setIsBelowThreshold] = useState<boolean>(true);
  
  // Network initialization
  useEffect(() => {
    // Initialize providers
    const initProviders = async () => {
      try {
        // Ethereum provider
        const ethereum = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
        setL1Provider(ethereum);
        
        // Arbitrum provider
        const arbitrum = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
        setL2Provider(arbitrum);
      } catch (error) {
        console.error('Failed to initialize providers:', error);
      }
    };
    
    initProviders();
  }, []);
  
  // Handle gas estimation
  const estimateGas = async () => {
    if (!l1Provider || !l2Provider || !nftContract || !tokenId || !newOwnerAddress) {
      return;
    }
    
    // Update loading state
    setGasEstimates(prev => ({
      ethereum: { ...prev.ethereum, isLoading: true, error: null },
      arbitrum: { ...prev.arbitrum, isLoading: true, error: null }
    }));
    
    try {
      // Mock L2 receiver address (in a real app, this would be the contract address on L2)
      const l2ReceiverAddress = '0x1234567890123456789012345678901234567890';
      
      // Step 1: Estimate L1 gas (queryNFTAndSendBack call)
      const l1GasPrice = await l1Provider.getFeeData();
      
      // Mock the L1 gas estimation (in a real app, this would be estimated using the contract)
      const l1GasEstimate = ethers.toBigInt('150000'); // Typical gas for a cross-chain call
      const l1GasCost = l1GasEstimate * (l1GasPrice.gasPrice || ethers.toBigInt('3000000000')); // 3 Gwei fallback
      
      // Step 2: Estimate L2 gas using Arbitrum SDK
      // Note: This is a simplified version. In a real app, use the SDK properly
      
      // Mock the Arbitrum SDK estimation results
      const maxSubmissionCost = ethers.parseEther('0.0002'); // Typical max submission cost
      const gasLimit = ethers.toBigInt('1000000'); // 1M gas limit for L2
      const maxFeePerGas = ethers.toBigInt('100000000'); // 0.1 Gwei for L2
      
      const l2GasCost = gasLimit * maxFeePerGas;
      
      // Total cost for the retryable ticket
      const retryableTicketCost = maxSubmissionCost + l2GasCost;
      
      // Total estimated cost (L1 + L2)
      const totalCost = l1GasCost + retryableTicketCost;
      
      // Format results
      setGasEstimates({
        ethereum: {
          network: 'Ethereum (L1)',
          estimatedGas: l1GasEstimate.toString(),
          estimatedCost: ethers.formatEther(l1GasCost),
          isLoading: false,
          error: null
        },
        arbitrum: {
          network: 'Arbitrum (L2)',
          estimatedGas: gasLimit.toString(),
          estimatedCost: ethers.formatEther(retryableTicketCost),
          isLoading: false,
          error: null
        }
      });
      
      // Set total cost and check if it's below threshold (0.001 ETH)
      const formattedTotalCost = ethers.formatEther(totalCost);
      setTotalEstimatedCost(formattedTotalCost);
      setIsBelowThreshold(totalCost < ethers.parseEther('0.001'));
      
    } catch (error) {
      console.error('Gas estimation error:', error);
      setGasEstimates({
        ethereum: {
          ...gasEstimates.ethereum,
          isLoading: false,
          error: 'Failed to estimate Ethereum gas'
        },
        arbitrum: {
          ...gasEstimates.arbitrum,
          isLoading: false,
          error: 'Failed to estimate Arbitrum gas'
        }
      });
    }
  };
  
  // Handle update ownership
  const updateOwnership = async () => {
    if (!l1Provider || !nftContract || !tokenId || !newOwnerAddress) {
      return;
    }
    
    alert('This would trigger the actual NFT ownership update transaction');
    // In a real app, implement the transaction here
  };
  
  return (
    <div className="update-nft-page">
      <div className="update-nft-container">
        <h1>Update NFT Ownership</h1>
        <p>This page allows you to update the ownership information for your NFTs across chains.</p>
        
        <div className="form-container">
          <div className="form-group">
            <label>NFT Contract Address</label>
            <input 
              type="text" 
              placeholder="0x..." 
              value={nftContract}
              onChange={(e) => setNftContract(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Token ID</label>
            <input 
              type="text" 
              placeholder="Enter token ID" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>New Owner Address</label>
            <input 
              type="text" 
              placeholder="0x..." 
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
            />
          </div>
          
          <button 
            className="estimate-button"
            onClick={estimateGas}
            disabled={!nftContract || !tokenId || !newOwnerAddress}
          >
            Estimate Gas
          </button>
          
          {/* Gas estimation results */}
          {(gasEstimates.ethereum.estimatedGas !== '0' || gasEstimates.arbitrum.estimatedGas !== '0') && (
            <div className="gas-estimates">
              <h3>Gas Estimation Results</h3>
              
              {Object.values(gasEstimates).map((estimate) => (
                <div key={estimate.network} className="estimate-item">
                  <div className="network-name">{estimate.network}</div>
                  {estimate.isLoading ? (
                    <div className="loading-spinner">Estimating...</div>
                  ) : estimate.error ? (
                    <div className="error-message">{estimate.error}</div>
                  ) : (
                    <div className="estimate-details">
                      <div>Estimated Gas: <span>{estimate.estimatedGas}</span></div>
                      <div>Estimated Cost: <span>{estimate.estimatedCost} ETH</span></div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="total-cost">
                <div>Total Estimated Cost: <span>{totalEstimatedCost} ETH</span></div>
                <div className={isBelowThreshold ? 'cost-threshold-ok' : 'cost-threshold-exceed'}>
                  {isBelowThreshold 
                    ? '✓ Below 0.001 ETH threshold' 
                    : '⚠️ Exceeds 0.001 ETH threshold'}
                </div>
              </div>
            </div>
          )}
          
          <button 
            className="update-button"
            onClick={updateOwnership}
            disabled={!nftContract || !tokenId || !newOwnerAddress}
          >
            Update Ownership
          </button>
        </div>
        
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    </div>
  );
};

export default UpdateNFTOwnership; 