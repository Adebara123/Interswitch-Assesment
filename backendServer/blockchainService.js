const { ethers } = require('ethers');

class BlockchainService {
  constructor(rpcUrl, contractAddress) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress;
    
    // Contract ABI for the events we need
    this.contractAbi = [
      "event AssetRegistered(uint256 indexed assetId, address indexed owner, string description, uint256 timestamp)",
      "event OwnershipTransferred(uint256 indexed assetId, address indexed previousOwner, address indexed newOwner, uint256 timestamp)"
    ];
    
    this.contract = new ethers.Contract(contractAddress, this.contractAbi, this.provider);
  }

  async getCurrentBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  async getEventsByBlockRange(fromBlock, toBlock = 'latest') {
    console.log(`Fetching events from block ${fromBlock} to ${toBlock}`);
    
    try {
      // Get AssetRegistered events
      const registrationFilter = this.contract.filters.AssetRegistered();
      const registrationEvents = await this.contract.queryFilter(
        registrationFilter,
        fromBlock,
        toBlock
      );

      // Get OwnershipTransferred events
      const transferFilter = this.contract.filters.OwnershipTransferred();
      const transferEvents = await this.contract.queryFilter(
        transferFilter,
        fromBlock,
        toBlock
      );

      return {
        registrations: await this.parseRegistrationEvents(registrationEvents),
        transfers: await this.parseTransferEvents(transferEvents)
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async parseRegistrationEvents(events) {
    const parsedEvents = [];
    
    for (const event of events) {
      try {
        const block = await this.provider.getBlock(event.blockNumber);
        
        parsedEvents.push({
          assetId: Number(event.args.assetId),
          owner: event.args.owner.toLowerCase(),
          description: event.args.description,
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          blockTimestamp: block.timestamp
        });
      } catch (error) {
        console.error(`Error parsing registration event:`, error);
      }
    }
    
    return parsedEvents;
  }

  async parseTransferEvents(events) {
    const parsedEvents = [];
    
    for (const event of events) {
      try {
        const block = await this.provider.getBlock(event.blockNumber);
        
        parsedEvents.push({
          assetId: Number(event.args.assetId),
          previousOwner: event.args.previousOwner.toLowerCase(),
          newOwner: event.args.newOwner.toLowerCase(),
          timestamp: Number(event.args.timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          blockTimestamp: block.timestamp
        });
      } catch (error) {
        console.error(`Error parsing transfer event:`, error);
      }
    }
    
    return parsedEvents;
  }

  async getEventsFromLast1000Blocks() {
    const currentBlock = await this.getCurrentBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    console.log(`Current block: ${currentBlock}, fetching from block: ${fromBlock}`);
    
    return await this.getEventsByBlockRange(fromBlock, currentBlock);
  }

  // Method to listen for new events in real-time with continuous monitoring
  startEventListener(onAssetRegistered, onOwnershipTransferred) {
    console.log('Starting continuous event monitoring...');
    
    let lastProcessedBlock = 0;
    let isMonitoring = true;
    
    // Initialize last processed block
    this.getCurrentBlockNumber().then(blockNum => {
      lastProcessedBlock = blockNum - 1;
      console.log(`Starting monitoring from block ${lastProcessedBlock + 1}`);
    });
    
    // Continuous monitoring function
    const monitorBlocks = async () => {
      if (!isMonitoring) return;
      
      try {
        const currentBlock = await this.getCurrentBlockNumber();
        
        if (currentBlock > lastProcessedBlock) {
          console.log(`Checking blocks ${lastProcessedBlock + 1} to ${currentBlock} for new events...`);
          
          // Get events from new blocks
          const events = await this.getEventsByBlockRange(lastProcessedBlock + 1, currentBlock);
          
          // Process new registrations
          for (const event of events.registrations) {
            console.log(`🆕 New asset registered: ID ${event.assetId} by ${event.owner}`);
            if (onAssetRegistered) {
              await onAssetRegistered(event);
            }
          }
          
          // Process new transfers
          for (const event of events.transfers) {
            console.log(`🔄 New ownership transfer: Asset ${event.assetId} from ${event.previousOwner} to ${event.newOwner}`);
            if (onOwnershipTransferred) {
              await onOwnershipTransferred(event);
            }
          }
          
          lastProcessedBlock = currentBlock;
          console.log(`✅ Processed up to block ${lastProcessedBlock}`);
        }
      } catch (error) {
        console.error('❌ Error in continuous monitoring:', error);
        // Continue monitoring even if there's an error
      }
      
      // Schedule next check in 5 seconds
      setTimeout(monitorBlocks, 5000);
    };
    
    // Start the continuous monitoring
    monitorBlocks();
    
    // Also keep the real-time event listeners as backup
    this.contract.on('AssetRegistered', async (assetId, owner, description, timestamp, event) => {
      try {
        const block = await this.provider.getBlock(event.blockNumber);
        const eventData = {
          assetId: Number(assetId),
          owner: owner.toLowerCase(),
          description,
          timestamp: Number(timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          blockTimestamp: block.timestamp
        };
        
        console.log(`🎯 Real-time event caught: Asset ${eventData.assetId} registered`);
        if (onAssetRegistered) {
          await onAssetRegistered(eventData);
        }
      } catch (error) {
        console.error('Error handling AssetRegistered event:', error);
      }
    });

    this.contract.on('OwnershipTransferred', async (assetId, previousOwner, newOwner, timestamp, event) => {
      try {
        const block = await this.provider.getBlock(event.blockNumber);
        const eventData = {
          assetId: Number(assetId),
          previousOwner: previousOwner.toLowerCase(),
          newOwner: newOwner.toLowerCase(),
          timestamp: Number(timestamp),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          blockTimestamp: block.timestamp
        };
        
        console.log(`🎯 Real-time event caught: Asset ${eventData.assetId} transferred`);
        if (onOwnershipTransferred) {
          await onOwnershipTransferred(eventData);
        }
      } catch (error) {
        console.error('Error handling OwnershipTransferred event:', error);
      }
    });
    
    // Store monitoring state for stopping
    this.monitoringInterval = monitorBlocks;
    this.isMonitoring = isMonitoring;
  }

  stopEventListener() {
    console.log('Stopping event listener and continuous monitoring...');
    this.isMonitoring = false;
    this.contract.removeAllListeners();
    console.log('✅ Event monitoring stopped');
  }
}

module.exports = BlockchainService;