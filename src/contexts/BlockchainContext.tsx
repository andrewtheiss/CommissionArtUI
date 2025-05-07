import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import ethersService from './ethers-service';
import { NetworkConfig } from './config';
import config from './config';
import { ethers } from 'ethers';

type NetworkType = 'animechain' | 'animechain_testnet' | 'dev' | 'prod' | 'local' | 'arbitrum_testnet' | 'arbitrum_mainnet' | 'testnet' | 'mainnet';

// Authentication types
export type AuthMethod = 'web3' | 'email' | 'none';

// Map layer and environment to network type
export const mapLayerToNetwork = (layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet'): NetworkType => {
  // L1 networks: default Ethereum networks
  if (layer === 'l1') {
    return environment === 'testnet' ? 'testnet' : 'mainnet';
  } 
  // L2 networks: Arbitrum networks
  else if (layer === 'l2') {
    return environment === 'testnet' ? 'arbitrum_testnet' : 'arbitrum_mainnet';
  } 
  // L3 networks: AnimeChain networks
  else if (layer === 'l3') {
    return environment === 'testnet' ? 'animechain_testnet' : 'animechain';
  } 
  // Default fallback
  else {
    return environment === 'testnet' ? 'testnet' : 'mainnet';
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
    let isMounted = true;

    const initializeBlockchainConnection = async () => {
      try {
        const connected = await ethersService.isConnected();
        if (!isMounted) return;

        if (connected) {
          setIsConnected(true);
          setAuthMethod('web3');
          const address = await ethersService.getWalletAddress();
          if (!isMounted) return;
          setWalletAddress(address);
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeBlockchainConnection();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const switchNetwork = useCallback(async (newNetworkType: NetworkType) => {
    // Skip if already on this network
    if (newNetworkType === networkType) {
      return;
    }

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
  }, [networkType]);

  const switchToLayer = useCallback((layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => {
    const targetNetwork = mapLayerToNetwork(layer, environment);
    
    // Skip if already on this network
    if (targetNetwork === networkType) {
      return;
    }
    
    console.log(`Switching to layer ${layer} (${environment}) => network ${targetNetwork}`);
    switchNetwork(targetNetwork);
  }, [networkType, switchNetwork]);

  const connectWallet = useCallback(async () => {
    try {
      // Don't set loading state to true, to avoid page transitions
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
    }
  }, []);

  const connectWithEmail = useCallback(async (email: string) => {
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
  }, []);

  const disconnect = useCallback(async () => {
    try {
      // If connected via web3/wallet, use ethersService to revoke permissions
      if (authMethod === 'web3') {
        await ethersService.revokeWalletPermissions();
      }
      
      // Reset context state
      setIsConnected(false);
      setAuthMethod('none');
      setWalletAddress(null);
      setEmailAddress(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      // Even if revocation fails, reset UI state
      setIsConnected(false);
      setAuthMethod('none');
      setWalletAddress(null);
      setEmailAddress(null);
    }
  }, [authMethod]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [
    isConnected, 
    isLoading, 
    authMethod, 
    networkType, 
    network, 
    switchNetwork, 
    switchToLayer, 
    connectWallet, 
    walletAddress, 
    connectWithEmail, 
    emailAddress, 
    disconnect
  ]);

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