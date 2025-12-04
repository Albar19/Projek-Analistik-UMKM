// Database connection menggunakan TiDB Cloud (MySQL-compatible)
// Lihat lib/mysql.ts untuk implementasi koneksi database

export { getPool, query, initializeDatabase, isConnected } from './mysql';
