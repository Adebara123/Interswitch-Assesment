// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AssetRegistry {
    struct Asset {
        string description;
        address owner;
        uint256 registrationTimestamp;
        bool exists;
    }
    
    mapping(uint256 => Asset) public assets;
    mapping(address => uint256[]) public ownerAssets;
    uint256 public nextAssetId = 1;
    
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
    
    modifier assetExists(uint256 assetId) {
        require(assets[assetId].exists, "Asset does not exist");
        _;
    }
    
    modifier onlyAssetOwner(uint256 assetId) {
        require(assets[assetId].owner == msg.sender, "Not the asset owner");
        _;
    }
    
    function registerAsset(string memory description) external returns (uint256) {
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(description).length <= 256, "Description too long");
        
        uint256 assetId = nextAssetId++;
        
        assets[assetId] = Asset({
            description: description,
            owner: msg.sender,
            registrationTimestamp: block.timestamp,
            exists: true
        });
        
        ownerAssets[msg.sender].push(assetId);
        
        emit AssetRegistered(assetId, msg.sender, description, block.timestamp);
        
        return assetId;
    }
    
    function transferOwnership(uint256 assetId, address newOwner) 
        external 
        assetExists(assetId) 
        onlyAssetOwner(assetId) 
    {
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != msg.sender, "Cannot transfer to yourself");
        
        address previousOwner = assets[assetId].owner;
        assets[assetId].owner = newOwner;
        
        // Update owner mappings
        _removeAssetFromOwner(previousOwner, assetId);
        ownerAssets[newOwner].push(assetId);
        
        emit OwnershipTransferred(assetId, previousOwner, newOwner, block.timestamp);
    }
    
    function getAsset(uint256 assetId) 
        external 
        view 
        assetExists(assetId) 
        returns (
            string memory description,
            address owner,
            uint256 registrationTimestamp
        ) 
    {
        Asset memory asset = assets[assetId];
        return (asset.description, asset.owner, asset.registrationTimestamp);
    }
    
    function getOwnerAssets(address owner) external view returns (uint256[] memory) {
        return ownerAssets[owner];
    }
    
    function _removeAssetFromOwner(address owner, uint256 assetId) private {
        uint256[] storage _assets = ownerAssets[owner];
        for (uint256 i = 0; i < _assets.length; i++) {
            if (_assets[i] == assetId) {
                _assets[i] = _assets[_assets.length - 1];
                _assets.pop();
                break;
            }
        }
    }
}