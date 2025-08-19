require('dotenv').config();
const Database = require('../database');

async function clearDatabase() {
  const database = new Database(process.env.DATABASE_URL);
  
  try {
    console.log('🗑️  Clearing database...');
    
    // Clear all data from tables
    await database.pool.query('DELETE FROM ownership_transfers');
    await database.pool.query('DELETE FROM asset_registrations');
    
    // Reset auto-increment counters
    await database.pool.query('ALTER SEQUENCE asset_registrations_id_seq RESTART WITH 1');
    await database.pool.query('ALTER SEQUENCE ownership_transfers_id_seq RESTART WITH 1');
    
    console.log('✅ Database cleared successfully!');
    console.log('📊 Tables are now empty but structure is preserved');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await database.close();
  }
}

// Run if called directly
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase; 