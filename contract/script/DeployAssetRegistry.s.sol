// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {AssetRegistry} from "../src/AssetRegistry.sol";

contract DeployAssetRegistryScript is Script {
    AssetRegistry public assetRegistry;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying AssetRegistry contract...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        assetRegistry = new AssetRegistry();
        
        console.log("AssetRegistry deployed at:", address(assetRegistry));

        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
    }
} 

// Deployed contract: 0x6A2027682B9ABFe77804a6941137AF04B7d118E2


//  forge script script/DeployAssetRegistry.s.sol:DeployAssetRegistryScript --rpc-url $RPC_URL --broadcast  -vvvv --verify 