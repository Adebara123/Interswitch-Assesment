# AssetRegistry Interaction Script

This directory contains scripts to interact with the deployed AssetRegistry smart contract.

## Files

- `InteractAssetRegistry.s.sol` - Main interaction script for calling the `registerAsset` function
- `DeployAssetRegistry.s.sol` - Deployment script (already exists)

## Prerequisites

1. **Environment Variables**: Set your private key and RPC URL:
   ```bash
   export PRIVATE_KEY="your_private_key_here"
   export RPC_URL="your_rpc_url_here"
   ```

2. **Contract Address**: Update the `DEPLOYED_CONTRACT` address in `InteractAssetRegistry.s.sol` if you're using a different deployment.

## Usage

### 1. Register Multiple Assets (Default)

Run the main script to register 3 example assets:

```bash
forge script script/InteractAssetRegistry.s.sol:InteractAssetRegistryScript --rpc-url $RPC_URL --broadcast -vvvv
```

This will:
- Register 3 assets with predefined descriptions
- Display the asset ID for each registered asset
- Show detailed information for each asset
- List all assets owned by the caller

### 2. Register a Single Custom Asset

To register a single asset with a custom description, you can call the `registerSingleAsset` function:

```bash
# Example: Register a custom asset
forge script script/InteractAssetRegistry.s.sol:InteractAssetRegistryScript --sig "registerSingleAsset(string)" --rpc-url $RPC_URL --broadcast -vvvv
```

**Note**: The `--sig` approach has limitations with string parameters. For custom descriptions, consider modifying the script directly.

### 3. Customize Asset Descriptions

To register different assets, edit the `descriptions` array in the `run()` function:

```solidity
string[] memory descriptions = new string[](2);
descriptions[0] = "Your Custom Asset Description 1";
descriptions[1] = "Your Custom Asset Description 2";
```

## Function Details

The `registerAsset` function:
- Takes a string description as input
- Returns a unique asset ID
- Automatically sets the caller as the owner
- Records the registration timestamp
- Emits an `AssetRegistered` event

## Validation

The contract validates that:
- Description is not empty
- Description length is ≤ 256 characters

## Output

The script provides detailed logging including:
- Contract and caller addresses
- Asset registration confirmations
- Asset IDs and details
- Ownership verification
- Total assets owned by the caller

## Troubleshooting

1. **Private Key Error**: Ensure `PRIVATE_KEY` environment variable is set correctly
2. **RPC Error**: Verify your RPC URL is accessible
3. **Contract Not Found**: Check that the `DEPLOYED_CONTRACT` address is correct
4. **Insufficient Gas**: Ensure your account has enough ETH for gas fees

## Example Output

```
Interacting with AssetRegistry contract...
Contract address: 0x6A2027682B9ABFe77804a6941137AF04B7d118E2
Caller address: 0x...
Registering asset: Luxury Villa in Beverly Hills
Asset registered with ID: 1
Asset details:
  Description: Luxury Villa in Beverly Hills
  Owner: 0x...
  Timestamp: 1234567890
---
Interaction completed successfully!
``` 