import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let _isConnected = false;

// Export getter untuk status koneksi
export function isConnected(): boolean {
  return _isConnected;
}

export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  try {
    // For TiDB Cloud, disable SSL cert verification in development
    // In production, implement proper SSL certificate handling
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '4000'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false, // Development only - disable cert verification
      },
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    } as any);

    // Test connection
    const conn = await pool.getConnection();
    conn.release();
    _isConnected = true;
    console.log('✅ MySQL connection successful');
    return pool;
  } catch (error) {
    console.error('⚠️ MySQL connection failed:', (error as Error).message);
    _isConnected = false;
    // Don't throw - allow app to run without MySQL for development
    throw error;
  }
}

export async function query(sql: string, values?: any[]) {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, values);
      return rows;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('⚠️ Query failed:', (error as Error).message);
    // Return empty array on error to allow app to function
    return [];
  }
}

export async function initializeDatabase() {
  const pool = await getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Initializing database tables...');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        image LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100),
        price INT NOT NULL,
        costPrice INT NOT NULL,
        stock INT DEFAULT 0,
        minStock INT DEFAULT 10,
        unit VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create sales table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        date VARCHAR(10) NOT NULL,
        productId VARCHAR(36) NOT NULL,
        productName VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price INT NOT NULL,
        total INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_date (date),
        INDEX idx_productId (productId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create activity_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        userName VARCHAR(255),
        action VARCHAR(100),
        details LONGTEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create business_settings table (legacy - keep for compatibility)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) UNIQUE NOT NULL,
        businessName VARCHAR(255),
        businessType VARCHAR(100) DEFAULT 'retail',
        storeName VARCHAR(255),
        storeAddress VARCHAR(500),
        timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
        currency VARCHAR(10) DEFAULT 'IDR',
        emailNotifications BOOLEAN DEFAULT true,
        notificationEmail VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create settings table (main settings table)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) UNIQUE NOT NULL,
        businessName VARCHAR(255),
        storeAddress VARCHAR(500),
        businessType VARCHAR(100) DEFAULT 'retail',
        timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
        currency VARCHAR(10) DEFAULT 'IDR',
        lowStockThreshold INT DEFAULT 10,
        enableNotifications BOOLEAN DEFAULT true,
        enableAutoReports BOOLEAN DEFAULT false,
        reportFrequency VARCHAR(20) DEFAULT 'weekly',
        notificationEmail VARCHAR(255),
        categories TEXT,
        units TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    if ((error as any).code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✅ Database tables already exist');
    } else {
      console.error('❌ Error initializing database:', (error as Error).message);
      // Don't throw - allow app to continue without database
    }
  } finally {
    connection.release();
  }
}
