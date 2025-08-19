#!/usr/bin/env node

require('dotenv').config();
const Database = require('../database');

async function initDatabase() {
  console.log('Initializing database...');
  
  try {
    const database = new Database(process.env.DATABASE_URL);
    console.log('Database initialized successfully!');
    console.log('Tables created:');
    console.log('- asset_registrations');
    console.log('- ownership_transfers');
    console.log('- Indexes created for optimal performance');
    
    await database.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = initDatabase;