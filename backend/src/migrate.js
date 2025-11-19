import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateConfig, migrationOptions } from './config/migrateConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Đang kết nối đến database...');
    connection = await mysql.createConnection(migrateConfig);
    console.log('✅ Kết nối database thành công!');

    // Đọc file migration
    const migrationPath = path.join(__dirname, '../../database/migration_newsletter_promotions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Đang đọc file migration...');
    console.log('🚀 Bắt đầu chạy migration...');

    // Chia SQL thành các câu lệnh riêng biệt
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Thực thi từng câu lệnh
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Đang thực thi câu lệnh ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Câu lệnh ${i + 1} thành công`);
        } catch (error) {
          // Bỏ qua lỗi nếu bảng đã tồn tại
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_KEYNAME' ||
              error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Câu lệnh ${i + 1} đã tồn tại, bỏ qua...`);
          } else {
            console.error(`❌ Lỗi ở câu lệnh ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('🎉 Migration hoàn thành thành công!');
    
    // Kiểm tra kết quả
    console.log('\n📊 Kiểm tra kết quả:');
    
    // Kiểm tra bảng newsletter_subscriptions
    const [newsletterTables] = await connection.execute(
      "SHOW TABLES LIKE 'newsletter_subscriptions'"
    );
    console.log(`📧 Bảng newsletter_subscriptions: ${newsletterTables.length > 0 ? '✅ Đã tạo' : '❌ Chưa tạo'}`);

    // Kiểm tra bảng promotions
    const [promotionTables] = await connection.execute(
      "SHOW TABLES LIKE 'promotions'"
    );
    console.log(`🎁 Bảng promotions: ${promotionTables.length > 0 ? '✅ Đã tạo' : '❌ Chưa tạo'}`);

    // Kiểm tra dữ liệu mẫu
    const [promotionCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM promotions"
    );
    console.log(`📈 Số lượng voucher mẫu: ${promotionCount[0].count}`);

    // Kiểm tra cột mới trong bookings
    const [bookingColumns] = await connection.execute(
      "SHOW COLUMNS FROM bookings LIKE 'promotion_id'"
    );
    console.log(`🔗 Cột promotion_id trong bookings: ${bookingColumns.length > 0 ? '✅ Đã thêm' : '❌ Chưa thêm'}`);

  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Đã đóng kết nối database');
    }
  }
}

// Hàm tạo database nếu chưa tồn tại
async function createDatabaseIfNotExists() {
  let connection;
  
  try {
    console.log('🔄 Đang kiểm tra database...');
    
    // Kết nối không chỉ định database
    const tempConfig = { ...migrateConfig };
    delete tempConfig.database;
    connection = await mysql.createConnection(tempConfig);
    
    // Tạo database nếu chưa tồn tại
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${migrateConfig.database}`);
    console.log(`✅ Database '${migrateConfig.database}' đã sẵn sàng!`);
    
  } catch (error) {
    console.error('❌ Lỗi tạo database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Hàm chính
async function main() {
  console.log('🚀 Bắt đầu Migration Database...\n');
  
  try {
    // Tạo database trước
    await createDatabaseIfNotExists();
    
    // Chạy migration
    await runMigration();
    
    console.log('\n🎉 Hoàn thành! Database đã được cập nhật với các tính năng mới.');
    console.log('📋 Các tính năng đã thêm:');
    console.log('   - Newsletter subscription');
    console.log('   - Promotions/Vouchers');
    console.log('   - Tour comparison');
    
  } catch (error) {
    console.error('\n❌ Migration thất bại:', error.message);
    process.exit(1);
  }
}

// Chạy migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigration, createDatabaseIfNotExists };
