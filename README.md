# CommissionArtUI
Front end for decentralized art commissions

## Network Configuration

This application supports both testnet and mainnet environments. By default, the application runs on the `testnet` network.

### Network Settings

The network configuration is managed in `src/config/network.ts`. You can:

- Get the current network using `getNetwork()`
- Switch between networks using `setNetwork('testnet' | 'mainnet')`
- The default network is set to `'testnet'`

### Contract Addresses

Contract addresses for both testnet and mainnet are configured in `src/config/contracts.json`. The application automatically uses the correct addresses based on the selected network.

### ABIs

Contract ABIs should be placed in the `src/assets/abis/` directory. See the README in that directory for more details on managing ABIs.

## Development

To start development:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

By default, the application will use the testnet configuration.
