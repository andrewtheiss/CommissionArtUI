# Contract ABIs

This directory contains the ABI (Application Binary Interface) files for the smart contracts used in the CommissionArtUI application.

## Available Contracts

The following contract ABIs should be placed in this directory:

- `ArrayManager.json`
- `ArtPiece.json`
- `ArtPieceOffChain.json`
- `CommissionHub.json`
- `L1QueryOwner.json`
- `L2Relay.json`
- `OwnerRegistry.json`
- `Profile.json`
- `ProfileHub.json`
- `SimpleERC721.json`

## How to Add an ABI

1. Obtain the ABI from the smart contract's compilation output
2. Save it as a JSON file in this directory with the appropriate name
3. Uncomment the corresponding import in `src/utils/abi.ts`
4. Replace the placeholder in the `abiMap` with the actual import

## Network Configuration

The application supports both testnet and mainnet environments. The contract addresses for each network are configured in `src/config/contracts.json`. The default network is set to `testnet` and can be changed using the network configuration utilities. 