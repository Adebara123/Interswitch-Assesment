require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./database');
const BlockchainService = require('./blockchainService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and blockchain service
const database = new Database(process.env.DATABASE_URL);
const blockchainService = new BlockchainService(
  process.env.RPC_URL,
  process.env.CONTRACT_ADDRESS
);

// API Routes

// Get all registered assets
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await database.getAllAssets();
    res.json({
      success: true,
      data: assets,
      count: assets.length
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
});

// Get all transfers for a given asset ID
app.get('/api/assets/:assetId/transfers', async (req, res) => {
  try {
    const { assetId } = req.params;
    const transfers = await database.getAssetTransfers(parseInt(assetId));
    res.json({
      success: true,
      data: transfers,
      count: transfers.length
    });
  } catch (error) {
    console.error('Error fetching asset transfers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset transfers'
    });
  }
});

// Get all assets owned by a given address
app.get('/api/owners/:address/assets', async (req, res) => {
  try {
    const { address } = req.params;
    const assets = await database.getAssetsByOwner(address);
    res.json({
      success: true,
      data: assets,
      count: assets.length
    });
  } catch (error) {
    console.error('Error fetching owner assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch owner assets'
    });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const basicAnalytics = await database.getAnalytics();
    const topOwners = await database.getTopActiveOwners();
    const activityTrends = await database.getActivityTrends();

    res.json({
      success: true,
      data: {
        totalAssets: parseInt(basicAnalytics.total_assets),
        totalTransfers: parseInt(basicAnalytics.total_transfers),
        topActiveOwners: topOwners,
        activityTrends: activityTrends
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Search API endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { assetId, address, fromDate, toDate } = req.query;
    
    const filters = {};
    if (assetId) filters.assetId = parseInt(assetId);
    if (address) filters.address = address;
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    const events = await database.searchEvents(filters);
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search events'
    });
  }
});

// Sync events from blockchain
app.post('/api/sync', async (req, res) => {
  try {
    console.log('Starting blockchain sync...');
    const events = await blockchainService.getEventsFromLast1000Blocks();
    
    // Store registration events
    for (const event of events.registrations) {
      await database.insertAssetRegistration(event);
    }

    // Store transfer events
    for (const event of events.transfers) {
      await database.insertOwnershipTransfer(event);
    }

    res.json({
      success: true,
      message: 'Blockchain sync completed',
      data: {
        registrations: events.registrations.length,
        transfers: events.transfers.length
      }
    });
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync blockchain events'
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const currentBlock = await blockchainService.getCurrentBlockNumber();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        currentBlock,
        database: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service unhealthy'
    });
  }
});

// Start real-time event listener
const startEventListener = async () => {
  try {
    await blockchainService.startEventListener(
      // On asset registered
      async (eventData) => {
        console.log('New asset registered:', eventData.assetId);
        await database.insertAssetRegistration(eventData);
      },
      // On ownership transferred
      async (eventData) => {
        console.log('Asset ownership transferred:', eventData.assetId);
        await database.insertOwnershipTransfer(eventData);
      }
    );
    console.log('Real-time event listener started');
  } catch (error) {
    console.error('Error starting event listener:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  blockchainService.stopEventListener();
  await database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  
  // Start event listener
  await startEventListener();
});

module.exports = app;