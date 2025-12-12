-- Migration: Update service_type ENUM to include combo options
-- This migration updates the service_type column to include combo options:
-- tour_hotel, tour_flight, hotel_flight

-- Step 1: Add temporary column with new ENUM values
ALTER TABLE promotions 
ADD COLUMN service_type_new ENUM('all', 'tour', 'hotel', 'flight', 'tour_hotel', 'tour_flight', 'hotel_flight') DEFAULT 'all' 
AFTER category;

-- Step 2: Copy data from old column to new column (if old column exists)
-- If service_type column exists, copy its values
UPDATE promotions 
SET service_type_new = COALESCE(service_type, 'all')
WHERE EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'promotions' 
  AND COLUMN_NAME = 'service_type'
);

-- Step 3: Drop old column if it exists
SET @sql = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'promotions' 
      AND COLUMN_NAME = 'service_type'
    ),
    'ALTER TABLE promotions DROP COLUMN service_type',
    'SELECT 1'
  )
);

SET @sql = CONCAT('ALTER TABLE promotions DROP COLUMN service_type');
-- Note: Only run DROP if column exists - check manually or use a stored procedure

-- Step 4: Rename new column to original name
ALTER TABLE promotions 
CHANGE COLUMN service_type_new service_type ENUM('all', 'tour', 'hotel', 'flight', 'tour_hotel', 'tour_flight', 'hotel_flight') DEFAULT 'all';

-- Update existing promotions to have 'all' as default if NULL
UPDATE promotions SET service_type = 'all' WHERE service_type IS NULL;

