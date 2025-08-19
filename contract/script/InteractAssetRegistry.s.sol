// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {AssetRegistry} from "../src/AssetRegistry.sol";

contract InteractAssetRegistryScript is Script {
    AssetRegistry public assetRegistry;
    
    // Replace this with your deployed contract address
    address constant DEPLOYED_CONTRACT = 0x661323fEA336CD5222D836AD77623cD5227831ed;

    function setUp() public {
        // Connect to the deployed contract
        assetRegistry = AssetRegistry(DEPLOYED_CONTRACT);
    }

    function run() public {
        uint256 callerPrivateKey = vm.envUint("PRIVATE_KEY");
        address caller = vm.addr(callerPrivateKey);
        
        console.log("Interacting with AssetRegistry contract...");
        console.log("Contract address:", address(assetRegistry));
        console.log("Caller address:", caller);
        
        string[] memory descriptions = new string[](3);
        descriptions[0] = "My Ikoyi Apartment";
        descriptions[1] = "Tesla Model S Electric Vehicle";
        descriptions[2] = "Rare Diamond";
        
        vm.startBroadcast(callerPrivateKey);
        
        for (uint256 i = 0; i < descriptions.length; i++) {
            console.log("Registering asset:", descriptions[i]);
            
            uint256 assetId = assetRegistry.registerAsset(descriptions[i]);
            
            console.log("Asset registered with ID:", assetId);
            
            // Get the registered asset details
            (string memory description, address owner, uint256 timestamp) = assetRegistry.getAsset(assetId);
            console.log("Asset details:");
            console.log("  Description:", description);
            console.log("  Owner:", owner);
            console.log("  Timestamp:", timestamp);
            console.log("---");
        }


        //////////////////////////////////////// Asset Transfer ////////////////////////////////////////
        
        // Get all assets owned by the caller
        uint256[] memory ownedAssets = assetRegistry.getOwnerAssets(caller);
        console.log("Total assets owned by caller:", ownedAssets.length);
        for (uint256 i = 0; i < ownedAssets.length; i++) {
            console.log("  Asset ID:", ownedAssets[i]);
        }

        
        // Transfer the first asset
        if (ownedAssets.length > 0) {
            console.log("--- Transferring Asset ---");
            console.log("Caller address:", caller);
            
            uint256 assetToTransfer = ownedAssets[0];
            address recipient = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
            
            console.log("Transferring asset ID:", assetToTransfer, "to:", recipient);
            
            vm.startBroadcast(callerPrivateKey);
            assetRegistry.transferOwnership(assetToTransfer, recipient);
            vm.stopBroadcast();
            
            console.log("Asset transferred successfully!");
            
            // Verify the transfer
            (string memory description, address newOwner, uint256 timestamp) = assetRegistry.getAsset(assetToTransfer);
            console.log("Asset ownership updated:");
            console.log("  Description:", description);
            console.log("  New Owner:", newOwner);
            console.log("  Timestamp:", timestamp);
            
            console.log("Transfer completed!");
        }
        
       
        
        console.log("Interaction completed successfully!");
    }
    
}

 // forge script script/InteractAssetRegistry.s.sol:InteractAssetRegistryScript --rpc-url $RPC_URL --broadcast  -vvvv --verify