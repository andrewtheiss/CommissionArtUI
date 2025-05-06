export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  isTestnet: boolean;
}

interface NetworkConfigs {
  animechain: NetworkConfig;
  dev: NetworkConfig;
  prod: NetworkConfig;
  local: NetworkConfig;
  arbitrum_testnet: NetworkConfig;
  arbitrum_mainnet: NetworkConfig;
}

const networks: NetworkConfigs = {
  animechain: {
    name: 'AnimeChain',
    chainId: 17608,
    rpcUrl: 'https://rpc.animechain.network',
    blockExplorerUrl: 'https://explorer.animechain.network',
    tokenName: 'Anime',
    tokenSymbol: 'ANIME',
    tokenDecimals: 18,
    isTestnet: false
  },
  dev: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/your-api-key',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    tokenName: 'Sepolia Ether',
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    isTestnet: true
  },
  prod: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    blockExplorerUrl: 'https://etherscan.io',
    tokenName: 'Ether',
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    isTestnet: false
  },
  local: {
    name: 'Localhost',
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    blockExplorerUrl: '',
    tokenName: 'Ether',
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    isTestnet: true
  },
  arbitrum_testnet: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorerUrl: 'https://sepolia-explorer.arbitrum.io',
    tokenName: 'Ether',
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    isTestnet: true
  },
  arbitrum_mainnet: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://explorer.arbitrum.io',
    tokenName: 'Ether',
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    isTestnet: false
  }
};

const config = {
  defaultNetwork: 'animechain',
  networks
};

export default config; 