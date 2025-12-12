-- Migration: Add service_type column to promotions table
-- This column specifies which service type the promotion applies to: all, tour, hotel, flight, or combo options

-- Check if column already exists, if not add it
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'promotions' 
  AND COLUMN_NAME = 'service_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE promotions ADD COLUMN service_type ENUM(\'all\', \'tour\', \'hotel\', \'flight\', \'tour_hotel\', \'tour_flight\', \'hotel_flight\') DEFAULT \'all\' AFTER category',
  'ALTER TABLE promotions MODIFY COLUMN service_type ENUM(\'all\', \'tour\', \'hotel\', \'flight\', \'tour_hotel\', \'tour_flight\', \'hotel_flight\') DEFAULT \'all\''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing promotions to have 'all' as default if NULL
UPDATE promotions SET service_type = 'all' WHERE service_type IS NULL;

