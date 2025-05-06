import { useBlockchain } from '../contexts/BlockchainContext';

const Footer = () => {
  const { isConnected, isLoading, networkType, network } = useBlockchain();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="network-info">
          <h2>Network Information</h2>
          <div className="info-item">
            <span className="label">Chain ID:</span>
            <span className="value">{network?.chainId ?? 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">RPC URL:</span>
            <span className="value">{network?.rpcUrl ?? 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Currency:</span>
            <span className="value">{network?.tokenName ?? 'N/A'} ({network?.tokenSymbol ?? 'N/A'})</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 