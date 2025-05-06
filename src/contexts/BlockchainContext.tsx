import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ethersService from './ethers-service';
import { NetworkConfig } from './config';
import config from './config';
import { ethers } from 'ethers';

type NetworkType = 'animechain' | 'dev' | 'prod' | 'local' | 'arbitrum_testnet' | 'arbitrum_mainnet';

// Authentication types
export type AuthMethod = 'web3' | 'email' | 'none';

// Map layer and environment to network type
export const mapLayerToNetwork = (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet'): NetworkType => {
  if (layer === 'l1') {
    return environment === 'testnet' ? 'dev' : 'prod';
  } else if (layer === 'l2') {
    return environment === 'testnet' ? 'arbitrum_testnet' : 'arbitrum_mainnet';
  } else if (layer === 'l3') {
    // L3 is Arbitrum in testnet but AnimeChain in mainnet
    return environment === 'testnet' ? 'arbitrum_testnet' : 'animechain';
  } else {
    return 'animechain';
  }
};

interface BlockchainContextType {
  // Authentication state
  isConnected: boolean;
  isLoading: boolean;
  authMethod: AuthMethod;
  
  // Web3 specific
  networkType: NetworkType;
  network: NetworkConfig;
  switchNetwork: (network: NetworkType) => void;
  switchToLayer: (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => void;
  connectWallet: () => Promise<void>;
  walletAddress: string | null;
  
  // Email authentication
  connectWithEmail: (email: string) => Promise<void>;
  emailAddress: string | null;
  
  // General methods
  disconnect: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider = ({ children }: { children: ReactNode }) => {
  // Authentication state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('none');
  
  // Web3 state
  const [networkType, setNetworkType] = useState<NetworkType>(config.defaultNetwork as NetworkType);
  const [network, setNetwork] = useState<NetworkConfig>(ethersService.getNetwork());
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
  
  // Email authentication state
  const [emailAddress, setEmailAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check connection status on mount
    const checkConnection = async () => {
      const connected = await ethersService.isConnected();
      if (connected) {
        setIsConnected(true);
        setAuthMethod('web3');
        const address = await ethersService.getWalletAddress();
        setWalletAddress(address);
      }
      setIsLoading(false);
    };
    
    checkConnection();
  }, []);

  const switchNetwork = async (newNetworkType: NetworkType) => {
    const newNetwork = ethersService.switchNetwork(newNetworkType);
    setNetworkType(newNetworkType);
    setNetwork(newNetwork);
    
    // Check connection after switching
    ethersService.isConnected().then(connected => {
      setIsConnected(connected);
      if (connected) {
        setAuthMethod('web3');
      }
    });
  };

  const switchToLayer = (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => {
    const targetNetwork = mapLayerToNetwork(layer, environment);
    console.log(`Switching to layer ${layer} (${environment}) => network ${targetNetwork}`);
    switchNetwork(targetNetwork);
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const signer = await ethersService.getSigner();
      if (signer) {
        const address = await signer.getAddress();
        setWalletAddress(address);
        setIsConnected(true);
        setAuthMethod('web3');
        return;
      }
      throw new Error('No wallet connected');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithEmail = async (email: string) => {
    try {
      setIsLoading(true);
      
      // Email authentication is not currently available (greyed out)
      // This method will be implemented later
      
      // For now, we'll just simulate the process
      console.log(`Email authentication requested with: ${email}`);
      console.log('Email authentication is not currently available (greyed out)');
      
      // Keep this commented out until the feature is ready
      /*
      setEmailAddress(email);
      setIsConnected(true);
      setAuthMethod('email');
      */
      
      return;
    } catch (error) {
      console.error('Failed to connect with email:', error);
      setEmailAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAuthMethod('none');
    setWalletAddress(null);
    setEmailAddress(null);
  };

  const value = {
    // Authentication state
    isConnected,
    isLoading,
    authMethod,
    
    // Web3 specific
    networkType,
    network,
    switchNetwork,
    switchToLayer,
    connectWallet,
    walletAddress,
    
    // Email authentication
    connectWithEmail,
    emailAddress,
    
    // General methods
    disconnect
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
}; 