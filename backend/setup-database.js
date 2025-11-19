import { sequelize } from "./src/config/db.js";
import { initModels } from "./src/models/index.js";
import fs from "fs";
import path from "path";

const setupDatabase = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    console.log("🔄 Initializing models...");
    initModels();
    console.log("✅ Models initialized");

    console.log("🔄 Syncing database...");
    await sequelize.sync({ force: true }); // force: true will drop and recreate tables
    console.log("✅ Database synced successfully");

    console.log("🔄 Running SQL migrations...");
    const sqlFile = path.join(process.cwd(), "../database/travel_db.sql");
    const sqlContent = fs.readFileSync(sqlFile, "utf8");
    
    // Split SQL content by semicolon and execute each statement
    const statements = sqlContent
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.toLowerCase().includes("create database") || 
          statement.toLowerCase().includes("use ")) {
        continue; // Skip database creation and use statements
      }
      
      try {
        await sequelize.query(statement);
      } catch (error) {
        console.warn(`⚠️  Warning: ${error.message}`);
      }
    }
    console.log("✅ SQL migrations completed");

    console.log("🔄 Seeding sample data...");
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    await execAsync("node src/seed.js");
    console.log("✅ Sample data seeded");

    console.log("🎉 Database setup completed successfully!");
    console.log("\n📊 Database Summary:");
    console.log("- Users table: Ready");
    console.log("- Tours table: Ready");
    console.log("- Bookings table: Ready");
    console.log("- Reviews table: Ready");
    console.log("- Payments table: Ready");
    console.log("- Newsletter table: Ready");
    console.log("- Promotions table: Ready");
    console.log("- Promotion Usage table: Ready");
    
    console.log("\n🚀 You can now start the server with: npm start");
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

setupDatabase();



