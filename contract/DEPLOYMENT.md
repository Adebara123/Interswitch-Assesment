# AssetRegistry Deployment Guide

## Prerequisites

1. **Foundry installed** - Make sure you have Foundry installed on your system
2. **Environment variables set up** - Create a `.env` file with the following variables:

```bash
# Your private key for deployment (keep this secret!)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL for the network you want to deploy to
RPC_URL=http://localhost:8545

# Chain ID for the network
CHAIN_ID=31337
```

## Deployment Steps

### 1. Set up environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 2. Deploy to local network (Anvil)

```bash
# Start local Anvil node
anvil

# In another terminal, deploy the contract
forge script script/DeployAssetRegistry.s.sol --rpc-url http://localhost:8545 --broadcast
```

### 3. Deploy to testnet (e.g., Goerli)

```bash
# Make sure your .env has the correct RPC_URL and CHAIN_ID for Goerli
forge script script/DeployAssetRegistry.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### 4. Deploy to mainnet

```bash
# Make sure your .env has the correct RPC_URL and CHAIN_ID for mainnet
forge script script/DeployAssetRegistry.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## Verification

After deployment, you can verify the contract on Etherscan (if deploying to a public network) or interact with it directly.

## Security Notes

- **Never commit your `.env` file** - it contains sensitive information
- **Use a dedicated deployment wallet** - don't use your main wallet for deployments
- **Test thoroughly on testnets** before deploying to mainnet
- **Verify your contract** on Etherscan after deployment

## Troubleshooting

### Common Issues

1. **Insufficient funds** - Make sure your deployment wallet has enough ETH for gas
2. **Wrong network** - Verify your RPC_URL and CHAIN_ID match your target network
3. **Private key format** - Ensure your private key starts with `0x` and is 64 characters long

### Getting Help

If you encounter issues:
1. Check the Foundry documentation
2. Verify your environment variables
3. Ensure you have sufficient funds on the target network 