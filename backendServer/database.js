const { Pool } = require('pg');

class Database {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
    });

    // Test connection and initialize tables
    this.initDatabase();
  }

  async initDatabase() {
    try {
      // Test connection
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL database');
      client.release();

      // Initialize tables
      await this.initTables();
    } catch (err) {
      console.error('Error connecting to database:', err);
      throw err;
    }
  }

  async initTables() {
    const createTables = `
      CREATE TABLE IF NOT EXISTS asset_registrations (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL UNIQUE,
        owner TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        block_number INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ownership_transfers (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        previous_owner TEXT NOT NULL,
        new_owner TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        block_number INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_asset_id ON asset_registrations(asset_id);
      CREATE INDEX IF NOT EXISTS idx_owner ON asset_registrations(owner);
      CREATE INDEX IF NOT EXISTS idx_transfer_asset_id ON ownership_transfers(asset_id);
      CREATE INDEX IF NOT EXISTS idx_previous_owner ON ownership_transfers(previous_owner);
      CREATE INDEX IF NOT EXISTS idx_new_owner ON ownership_transfers(new_owner);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON asset_registrations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_transfer_timestamp ON ownership_transfers(timestamp);
    `;

    try {
      await this.pool.query(createTables);
      console.log('Database tables initialized');
    } catch (err) {
      console.error('Error creating tables:', err);
      throw err;
    }
  }

  async insertAssetRegistration(data) {
    const sql = `
      INSERT INTO asset_registrations 
      (asset_id, owner, description, timestamp, block_number, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (asset_id) DO UPDATE SET
        owner = EXCLUDED.owner,
        description = EXCLUDED.description,
        timestamp = EXCLUDED.timestamp,
        block_number = EXCLUDED.block_number,
        transaction_hash = EXCLUDED.transaction_hash
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(sql, [
        data.assetId,
        data.owner,
        data.description,
        data.timestamp,
        data.blockNumber,
        data.transactionHash
      ]);
      return result.rows[0].id;
    } catch (err) {
      console.error('Error inserting asset registration:', err);
      throw err;
    }
  }

  async insertOwnershipTransfer(data) {
    const sql = `
      INSERT INTO ownership_transfers 
      (asset_id, previous_owner, new_owner, timestamp, block_number, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(sql, [
        data.assetId,
        data.previousOwner,
        data.newOwner,
        data.timestamp,
        data.blockNumber,
        data.transactionHash
      ]);
      return result.rows[0].id;
    } catch (err) {
      console.error('Error inserting ownership transfer:', err);
      throw err;
    }
  }

  async getAllAssets() {
    const sql = `
      SELECT ar.*, 
             COALESCE(ot.new_owner, ar.owner) as current_owner
      FROM asset_registrations ar
      LEFT JOIN (
        SELECT DISTINCT ON (asset_id) asset_id, new_owner
        FROM ownership_transfers
        ORDER BY asset_id, timestamp DESC
      ) ot ON ar.asset_id = ot.asset_id
      ORDER BY ar.asset_id
    `;
    
    try {
      const result = await this.pool.query(sql);
      return result.rows;
    } catch (err) {
      console.error('Error getting all assets:', err);
      throw err;
    }
  }

  async getAssetTransfers(assetId) {
    const sql = `
      SELECT * FROM ownership_transfers 
      WHERE asset_id = $1 
      ORDER BY timestamp DESC
    `;
    
    try {
      const result = await this.pool.query(sql, [assetId]);
      return result.rows;
    } catch (err) {
      console.error('Error getting asset transfers:', err);
      throw err;
    }
  }

  async getAssetsByOwner(ownerAddress) {
    const sql = `
      SELECT ar.*, 
             COALESCE(ot.new_owner, ar.owner) as current_owner
      FROM asset_registrations ar
      LEFT JOIN (
        SELECT DISTINCT ON (asset_id) asset_id, new_owner
        FROM ownership_transfers
        ORDER BY asset_id, timestamp DESC
      ) ot ON ar.asset_id = ot.asset_id
      WHERE COALESCE(ot.new_owner, ar.owner) = $1
      ORDER BY ar.asset_id
    `;
    
    try {
      const result = await this.pool.query(sql, [ownerAddress.toLowerCase()]);
      return result.rows;
    } catch (err) {
      console.error('Error getting assets by owner:', err);
      throw err;
    }
  }

  async getAnalytics() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM asset_registrations) as total_assets,
        (SELECT COUNT(*) FROM ownership_transfers) as total_transfers
    `;
    
    try {
      const result = await this.pool.query(sql);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting analytics:', err);
      throw err;
    }
  }

  async getTopActiveOwners(limit = 3) {
    const sql = `
      SELECT 
        previous_owner as owner,
        COUNT(*) as transfer_count
      FROM ownership_transfers
      GROUP BY previous_owner
      ORDER BY transfer_count DESC
      LIMIT $1
    `;
    
    try {
      const result = await this.pool.query(sql, [limit]);
      return result.rows;
    } catch (err) {
      console.error('Error getting top active owners:', err);
      throw err;
    }
  }

  async getActivityTrends() {
    const sql = `
      SELECT 
        DATE_TRUNC('day', TO_TIMESTAMP(timestamp)) as date,
        COUNT(*) as registrations
      FROM asset_registrations
      GROUP BY DATE_TRUNC('day', TO_TIMESTAMP(timestamp))
      ORDER BY date DESC
      LIMIT 30
    `;
    
    try {
      const result = await this.pool.query(sql);
      return result.rows;
    } catch (err) {
      console.error('Error getting activity trends:', err);
      throw err;
    }
  }

  async searchEvents(filters) {
    let sql = `
      SELECT 'registration' as event_type, asset_id, owner as address, 
             description, timestamp, block_number, transaction_hash, created_at
      FROM asset_registrations
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.assetId) {
      paramCount++;
      sql += ` AND asset_id = $${paramCount}`;
      params.push(filters.assetId);
    }

    if (filters.address) {
      paramCount++;
      sql += ` AND owner = $${paramCount}`;
      params.push(filters.address.toLowerCase());
    }

    if (filters.fromDate) {
      paramCount++;
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(Math.floor(new Date(filters.fromDate).getTime() / 1000));
    }

    if (filters.toDate) {
      paramCount++;
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(Math.floor(new Date(filters.toDate).getTime() / 1000));
    }

    sql += `
      UNION ALL
      SELECT 'transfer' as event_type, asset_id, new_owner as address,
             'Ownership Transfer' as description, timestamp, block_number, transaction_hash, created_at
      FROM ownership_transfers
      WHERE 1=1
    `;

    if (filters.assetId) {
      paramCount++;
      sql += ` AND asset_id = $${paramCount}`;
      params.push(filters.assetId);
    }

    if (filters.address) {
      paramCount++;
      sql += ` AND (previous_owner = $${paramCount} OR new_owner = $${paramCount + 1})`;
      params.push(filters.address.toLowerCase(), filters.address.toLowerCase());
      paramCount++;
    }

    if (filters.fromDate) {
      paramCount++;
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(Math.floor(new Date(filters.fromDate).getTime() / 1000));
    }

    if (filters.toDate) {
      paramCount++;
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(Math.floor(new Date(filters.toDate).getTime() / 1000));
    }

    sql += ` ORDER BY timestamp DESC`;

    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('Error searching events:', err);
      throw err;
    }
  }

  async close() {
    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }
  }
}

module.exports = Database;