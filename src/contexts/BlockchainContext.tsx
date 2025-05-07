import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import ethersService from './ethers-service';
import { NetworkConfig } from './config';
import config from './config';
import { ethers } from 'ethers';
import { hasProfile } from '../contracts/ProfileHubContract';
import { setNetwork as setGlobalNetwork } from '../config/network';
import { mapLayerToNetwork, BlockchainNetworkType as NetworkType } from '../utils/networkUtils';

// Authentication types
export type AuthMethod = 'web3' | 'email' | 'none';

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

  // Profile status
  hasUserProfile: boolean | null;
  checkUserProfile: () => Promise<boolean>;
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

  // Profile status
  const [hasUserProfile, setHasUserProfile] = useState<boolean | null>(null);

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
    
    // Reset profile status when network changes
    setHasUserProfile(null);
    
    // Update global network state
    // Map the BlockchainContext NetworkType to the global NetworkType
    if (newNetworkType === 'mainnet' || newNetworkType === 'arbitrum_mainnet' || newNetworkType === 'animechain') {
      setGlobalNetwork('mainnet');
    } else {
      setGlobalNetwork('testnet');
    }
  }, [networkType]);

  const switchToLayer = useCallback((layer: 'l1' | 'l2' | 'l3', environment: 'testnet' | 'mainnet') => {
    const targetNetwork = mapLayerToNetwork(layer, environment);
    
    // Skip if already on this network
    if (targetNetwork === networkType) {
      return;
    }
    
    console.log(`Switching to layer ${layer} (${environment}) => network ${targetNetwork}`);
    
    // Update global network state directly
    setGlobalNetwork(environment);
    
    // Then switch the blockchain network
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
        
        // Reset profile status when wallet changes
        setHasUserProfile(null);
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
      setHasUserProfile(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      // Even if revocation fails, reset UI state
      setIsConnected(false);
      setAuthMethod('none');
      setWalletAddress(null);
      setEmailAddress(null);
      setHasUserProfile(null);
    }
  }, [authMethod]);

  // Function to check if the user has a profile
  const checkUserProfile = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !walletAddress) {
      setHasUserProfile(null);
      return false;
    }

    try {
      // Create a provider using the network RPC URL
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Check if the user has a profile
      const profileExists = await hasProfile(walletAddress, provider);
      setHasUserProfile(profileExists);
      return profileExists;
    } catch (error) {
      console.error('Error checking profile status:', error);
      setHasUserProfile(false);
      return false;
    }
  }, [isConnected, walletAddress, network.rpcUrl]);

  // Check for profile when wallet address or network changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      checkUserProfile();
    } else {
      setHasUserProfile(null);
    }
  }, [isConnected, walletAddress, network, checkUserProfile]);

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
    disconnect,

    // Profile status
    hasUserProfile,
    checkUserProfile
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
    disconnect,
    hasUserProfile,
    checkUserProfile
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