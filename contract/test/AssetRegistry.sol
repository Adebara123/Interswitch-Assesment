// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/AssetRegistry.sol";

contract AssetRegistryTest is Test {
    AssetRegistry public registry;
    address public owner1 = address(0x1);
    address public owner2 = address(0x2);
    
    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        string description,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        uint256 indexed assetId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );
    
    function setUp() public {
        registry = new AssetRegistry();
        vm.deal(owner1, 1 ether);
        vm.deal(owner2, 1 ether);
    }
    
    function testRegisterAsset() public {
        vm.prank(owner1);
        uint256 assetId = registry.registerAsset("Test Asset");
        
        assertEq(assetId, 1);
        (string memory desc, address owner, uint256 timestamp) = registry.getAsset(assetId);
        assertEq(desc, "Test Asset");
        assertEq(owner, owner1);
        assertGt(timestamp, 0);
    }
    
    function testEmptyDescriptionReverts() public {
        vm.prank(owner1);
        vm.expectRevert("Description cannot be empty");
        registry.registerAsset("");
    }
    
    function testTransferOwnership() public {
        vm.prank(owner1);
        uint256 assetId = registry.registerAsset("Transferable Asset");
        
        vm.prank(owner1);
        registry.transferOwnership(assetId, owner2);
        
        (, address newOwner,) = registry.getAsset(assetId);
        assertEq(newOwner, owner2);
    }
    
    function testNonOwnerCannotTransfer() public {
        vm.prank(owner1);
        uint256 assetId = registry.registerAsset("Protected Asset");
        
        vm.prank(owner2);
        vm.expectRevert("Not the asset owner");
        registry.transferOwnership(assetId, address(0x3));
    }
    
    function testEventEmission() public {
        vm.prank(owner1);
        vm.expectEmit(true, true, false, true);
        emit AssetRegistered(1, owner1, "Event Test Asset", block.timestamp);
        registry.registerAsset("Event Test Asset");
    }
    
    function testMultipleAssetsPerOwner() public {
        vm.startPrank(owner1);
        registry.registerAsset("Asset 1");
        registry.registerAsset("Asset 2");
        registry.registerAsset("Asset 3");
        vm.stopPrank();
        
        uint256[] memory assets = registry.getOwnerAssets(owner1);
        assertEq(assets.length, 3);
    }
}