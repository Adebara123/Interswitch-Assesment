# Asset Registry System

A decentralized asset registry system built with Solidity smart contracts and Node.js backend, featuring real-time blockchain event monitoring and comprehensive analytics.

## 🏗️ Architecture

- **Smart Contract**: Solidity-based asset registration and ownership transfer
- **Backend Server**: Node.js API with PostgreSQL database
- **Real-time Monitoring**: Blockchain event listener with continuous sync
- **Analytics**: Comprehensive reporting and data visualization

## 📁 Project Structure

```
interswitchInterview/
├── contract/                 # Smart contract and deployment scripts
│   ├── src/
│   │   └── AssetRegistry.sol
│   ├── script/
│   │   ├── DeployAssetRegistry.s.sol
│   │   └── InteractAssetRegistry.s.sol
│   └── foundry.toml
├── backendServer/            # Node.js backend server
│   ├── scripts/
│   ├── server.js
│   ├── database.js
│   ├── blockchainService.js
│   ├── docker-compose.yml
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Yarn** package manager
- **Foundry** (for smart contract development)
- **Docker** and **Docker Compose**
- **PostgreSQL** (or use Docker)

### 1. Smart Contract Setup

```bash
# Navigate to contract directory
cd contract

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install

# Set environment variables
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY
```

**Environment Variables:**
```bash
RPC_URL=https://sepolia.infura.io/v3/your-project-id
PRIVATE_KEY=your_private_key_here
CHAIN_ID=11155111
```

### 2. Deploy Smart Contract

```bash
# Deploy the contract
forge script script/DeployAssetRegistry.s.sol:DeployAssetRegistryScript --rpc-url $RPC_URL --broadcast -vvvv --verify

# Note the deployed contract address and update InteractAssetRegistry.s.sol
```

### 3. Register Assets

```bash
# Register assets using the interaction script
forge script script/InteractAssetRegistry.s.sol:InteractAssetRegistryScript --rpc-url $RPC_URL --broadcast -vvvv
```

### 4. Backend Server Setup

```bash
# Navigate to backend server
cd ../backendServer

# Install dependencies
yarn install

# Create environment file
cp ../backend/env.example .env

# Update .env with your configuration
DATABASE_URL=postgresql://postgres:password@localhost:5434/asset_registry
RPC_URL=https://sepolia.infura.io/v3/your-project-id
CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_private_key_here
```

### 5. Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Verify database is running
docker ps | grep postgres
```

### 6. Run Backend Server

```bash
# Start the server
yarn start
# or
node server.js
```

## 📊 API Endpoints

### Health Check
```bash
GET /api/health
```

### Asset Management
```bash
GET /api/assets                    # Get all assets
GET /api/assets/:id/transfers     # Get asset transfer history
GET /api/owners/:address/assets   # Get assets by owner
```

### Analytics
```bash
GET /api/analytics                # Get system analytics
GET /api/search                   # Search events with filters
```

### Blockchain Sync
```bash
POST /api/sync                    # Manual blockchain sync
```

## 🔄 Smart Contract Functions

### Asset Registration
```solidity
function registerAsset(string memory description) external returns (uint256)
```

### Ownership Transfer
```solidity
function transferOwnership(uint256 assetId, address newOwner) external
```

### Asset Queries
```solidity
function getAsset(uint256 assetId) external view returns (string, address, uint256)
function getOwnerAssets(address owner) external view returns (uint256[] memory)
```

## 📈 Analytics and Reporting

### Generate Analytics
```bash
cd backendServer
node scripts/generateAnalytics.js
```

**Output Files:**
- `output/analytics.json` - Raw analytics data
- `output/summary.md` - Markdown summary report
- `output/activity-trends.png` - Activity chart (if canvas works)

### Database Management
```bash
# Clear database (keep structure)
node scripts/clearDatabase.js

# Initialize database
node scripts/initDatabase.js
```

## 🐳 Docker Configuration

### PostgreSQL Database
- **Port**: 5434 (to avoid conflicts)
- **Database**: asset_registry
- **Username**: postgres
- **Password**: password

### Customize Ports
Edit `docker-compose.yml` to change ports if needed:
```yaml
ports:
  - "5434:5432"  # Host:Container
```

## 🔧 Troubleshooting

### Canvas Architecture Issues (M1/M2 Macs)
```bash
cd backendServer
yarn remove canvas
yarn add canvas
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :5432 -i :5433 -i :5434

# Stop conflicting services or change ports
```

### Database Connection Issues
```bash
# Verify Docker container is running
docker ps | grep postgres

# Check logs
docker logs backendserver-postgres-1
```

## 📝 Environment Variables Reference

### Backend Server (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5434/asset_registry

# Blockchain
RPC_URL=https://sepolia.infura.io/v3/your-project-id
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key_here
CHAIN_ID=11155111

# Server
PORT=3000
```

### Smart Contract (.env)
```bash
RPC_URL=https://sepolia.infura.io/v3/your-project-id
PRIVATE_KEY=your_private_key_here
CHAIN_ID=11155111
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd contract
forge test
```

### Backend API Tests
```bash
cd backendServer
# Test health endpoint
curl http://localhost:3000/api/health

# Test assets endpoint
curl http://localhost:3000/api/assets

# Test blockchain sync
curl -X POST http://localhost:3000/api/sync
```

