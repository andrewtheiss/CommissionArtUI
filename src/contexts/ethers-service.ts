import { ethers } from 'ethers';
import config, { NetworkConfig } from './config';

type NetworkType = 'animechain' | 'dev' | 'prod' | 'local' | 'arbitrum_testnet' | 'arbitrum_mainnet';

class EthersService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private currentNetwork: NetworkType = config.defaultNetwork as NetworkType;

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback to a read-only provider
      const network = this.getNetwork();
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      const accounts = await this.provider.listAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  async getSigner(): Promise<ethers.JsonRpcSigner | null> {
    if (!this.provider) {
      this.initProvider();
    }

    try {
      if (this.provider instanceof ethers.BrowserProvider) {
        await this.provider.send('eth_requestAccounts', []);
        this.signer = await this.provider.getSigner();
        return this.signer;
      }
    } catch (error) {
      console.error('Error getting signer:', error);
    }

    return null;
  }

  getNetwork(): NetworkConfig {
    return config.networks[this.currentNetwork];
  }

  switchNetwork(networkType: NetworkType): NetworkConfig {
    this.currentNetwork = networkType;
    const network = this.getNetwork();

    // If we have a provider with switching capability, try to switch
    if (this.provider instanceof ethers.BrowserProvider && window.ethereum) {
      this.requestNetworkSwitch(network);
    }

    return network;
  }

  private async requestNetworkSwitch(network: NetworkConfig) {
    if (!window.ethereum) return;

    const chainIdHex = `0x${network.chainId.toString(16)}`;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: network.name,
                nativeCurrency: {
                  name: network.tokenName,
                  symbol: network.tokenSymbol,
                  decimals: network.tokenDecimals,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: network.blockExplorerUrl ? [network.blockExplorerUrl] : undefined,
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding chain:', addError);
        }
      } else {
        console.error('Error switching chain:', switchError);
      }
    }
  }

  async getWalletAddress(): Promise<string | null> {
    try {
      const signer = await this.getSigner();
      if (signer) {
        return await signer.getAddress();
      }
    } catch (error) {
      console.error('Error getting wallet address:', error);
    }
    return null;
  }

  getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider | null {
    return this.provider;
  }
}

// Add the window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

const ethersService = new EthersService();
export default ethersService; 