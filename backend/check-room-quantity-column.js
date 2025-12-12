import { sequelize } from "./src/config/db.js";

async function checkQuantityColumn() {
  try {
    console.log("========================================");
    console.log("Checking quantity column in hotel_rooms table");
    console.log("========================================\n");

    // Kiểm tra xem column quantity có tồn tại không
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hotel_rooms'
      AND COLUMN_NAME = 'quantity'
    `);

    if (results.length === 0) {
      console.log("❌ Column 'quantity' does NOT exist in hotel_rooms table!");
      console.log("\n⚠️  You need to run the migration SQL file:");
      console.log("   database/migration_add_room_quantity.sql");
      console.log("   OR");
      console.log("   database/migration_add_room_quantity_safe.sql");
    } else {
      console.log("✅ Column 'quantity' exists!");
      console.log("\nColumn details:");
      console.log(JSON.stringify(results[0], null, 2));
    }

    // Kiểm tra dữ liệu hiện tại
    console.log("\n========================================");
    console.log("Current room data:");
    console.log("========================================\n");

    const [rooms] = await sequelize.query(`
      SELECT id, name, quantity, status
      FROM hotel_rooms
      LIMIT 10
    `);

    if (rooms.length === 0) {
      console.log("No rooms found in database.");
    } else {
      console.log(`Found ${rooms.length} rooms (showing first 10):`);
      rooms.forEach(room => {
        console.log(`  Room ID ${room.id}: ${room.name} - Quantity: ${room.quantity} - Status: ${room.status}`);
      });
    }

    // Kiểm tra rooms có quantity = 1 hoặc NULL
    const [roomsWithDefault] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM hotel_rooms
      WHERE quantity IS NULL OR quantity = 1
    `);

    console.log(`\n⚠️  Rooms with quantity = 1 or NULL: ${roomsWithDefault[0].count}`);

  } catch (error) {
    console.error("Error checking quantity column:", error);
  } finally {
    await sequelize.close();
  }
}

checkQuantityColumn();




