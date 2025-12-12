// Database configuration for migration
// Convert 'localhost' to '127.0.0.1' to avoid MariaDB connection issues
const dbHost = process.env.DB_HOST || '127.0.0.1';
const normalizedHost = dbHost === 'localhost' ? '127.0.0.1' : dbHost;

export const migrateConfig = {
  host: normalizedHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Thay đổi password của bạn
  database: process.env.DB_NAME || 'travel_db',
  multipleStatements: true,
  charset: 'utf8mb4'
};

// Migration options
export const migrationOptions = {
  // Có tạo database mới không nếu chưa tồn tại
  createDatabase: true,
  
  // Có chạy dữ liệu mẫu không
  runSampleData: true,
  
  // Có bỏ qua lỗi nếu bảng đã tồn tại không
  skipExistingTables: true,
  
  // Có backup database cũ không (chưa implement)
  backupBeforeMigration: false
};



