import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCategoriesMigration() {
  let connection;
  
  try {
    console.log('🔄 Đang kết nối đến database...');
    
    // Convert 'localhost' to '127.0.0.1' to avoid MariaDB connection issues
    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const normalizedHost = dbHost === 'localhost' ? '127.0.0.1' : dbHost;
    
    // Create connection
    connection = await mysql.createConnection({
      host: normalizedHost,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'travel_db',
      multipleStatements: true
    });

    console.log('✅ Kết nối database thành công!');

    // Read SQL file - try multiple paths
    let sqlFile = path.join(__dirname, '../../database/migration_add_categories.sql');
    if (!fs.existsSync(sqlFile)) {
      // Try from root
      sqlFile = path.join(process.cwd(), 'database', 'migration_add_categories.sql');
    }
    if (!fs.existsSync(sqlFile)) {
      // Try absolute path from backend
      const backendDir = path.dirname(__dirname);
      sqlFile = path.join(backendDir, '..', 'database', 'migration_add_categories.sql');
    }
    
    console.log('📄 Đang đọc file migration...');
    console.log('   Đường dẫn:', sqlFile);
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ File migration không tồn tại!');
      console.error('   Vui lòng đảm bảo file database/migration_add_categories.sql tồn tại');
      throw new Error(`File migration không tồn tại: ${sqlFile}`);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🚀 Bắt đầu chạy migration...\n');

    // Split SQL into statements and execute
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.toLowerCase().startsWith('use '));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Câu lệnh ${i + 1}/${statements.length} thành công`);
        } catch (error) {
          // Skip if table/column already exists
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_KEYNAME' ||
              error.code === 'ER_DUP_ENTRY' ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Câu lệnh ${i + 1} đã tồn tại, bỏ qua...`);
          } else {
            console.error(`❌ Lỗi ở câu lệnh ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n🎉 Migration hoàn thành thành công!');
    
    // Verify tables
    console.log('\n📊 Kiểm tra kết quả:');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('categories', 'tour_categories')
    `, [process.env.DB_NAME || 'travel_db']);

    console.log('\n📋 Bảng đã tạo:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });

    // Check travel_style column
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'tours' 
      AND COLUMN_NAME = 'travel_style'
    `, [process.env.DB_NAME || 'travel_db']);

    if (columns.length > 0) {
      console.log('  ✅ travel_style column trong bảng tours');
    } else {
      console.log('  ⚠️  travel_style column chưa được thêm');
    }

    // Count categories
    const [categoryCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n📦 Tổng số danh mục: ${categoryCount[0].count}`);

    // List categories
    const [categories] = await connection.query('SELECT id, name, icon FROM categories ORDER BY id');
    console.log('\n📝 Danh sách danh mục:');
    categories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (ID: ${cat.id})`);
    });

  } catch (error) {
    console.error('\n❌ Migration thất bại:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Đã đóng kết nối database');
    }
  }
}

runCategoriesMigration();

