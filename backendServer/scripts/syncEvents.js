#!/usr/bin/env node

require('dotenv').config();
const Database = require('../database');
const BlockchainService = require('../blockchainService');

async function syncEvents() {
  const database = new Database(process.env.DATABASE_URL);
  const blockchainService = new BlockchainService(
    process.env.RPC_URL,
    process.env.CONTRACT_ADDRESS
  );

  try {
    console.log('Starting blockchain event sync...');
    console.log('Fetching events from last 1000 blocks...');
    
    const events = await blockchainService.getEventsFromLast1000Blocks();
    
    console.log(`Found ${events.registrations.length} registration events`);
    console.log(`Found ${events.transfers.length} transfer events`);

    // Store registration events
    let registrationCount = 0;
    for (const event of events.registrations) {
      try {
        await database.insertAssetRegistration(event);
        registrationCount++;
        console.log(`Stored registration for asset ${event.assetId}`);
      } catch (error) {
        console.error(`Error storing registration for asset ${event.assetId}:`, error.message);
      }
    }

    // Store transfer events
    let transferCount = 0;
    for (const event of events.transfers) {
      try {
        await database.insertOwnershipTransfer(event);
        transferCount++;
        console.log(`Stored transfer for asset ${event.assetId}`);
      } catch (error) {
        console.error(`Error storing transfer for asset ${event.assetId}:`, error.message);
      }
    }

    console.log('\n=== Sync Summary ===');
    console.log(`Successfully stored ${registrationCount} registration events`);
    console.log(`Successfully stored ${transferCount} transfer events`);
    console.log('Sync completed successfully!');

  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run if called directly
if (require.main === module) {
  syncEvents().catch(console.error);
}

module.exports = syncEvents;