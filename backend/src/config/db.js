import { Sequelize, Op } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Force 'localhost' to '127.0.0.1' to avoid MariaDB connection issues
// MariaDB treats 'localhost' and '127.0.0.1' differently
let dbHost = process.env.DB_HOST || "127.0.0.1";
if (dbHost === "localhost" || dbHost.toLowerCase() === "localhost") {
  dbHost = "127.0.0.1";
}

// Debug: Log the host being used
console.log(`🔍 DB Configuration:`);
console.log(`   Host: ${dbHost}`);
console.log(`   Database: ${process.env.DB_NAME || "travel_db"}`);
console.log(`   User: ${process.env.DB_USER || "root"}`);

// Build connection configuration
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || "travel_db";
const dbUser = process.env.DB_USER || "root";
const dbPass = process.env.DB_PASS || "";

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  dialectOptions: {
    // Force TCP/IP connection - prevent mysql2 from using socket
    // Remove socketPath completely to force TCP
    // socketPath: undefined, // Don't set this at all
    // Additional options to ensure TCP/IP connection
    connectTimeout: 60000,
    // Explicitly set local address to force TCP
    localAddress: undefined,
  },
  // Additional Sequelize options
  define: {
    timestamps: true,
    underscored: true,
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export { Op }; // ✅ chữ hoa — đúng cú pháp Sequelize
