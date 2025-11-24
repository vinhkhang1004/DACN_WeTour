-- Migration: Add notes column to bookings table
-- This migration adds a notes field to allow customers to add notes when booking tours

-- Check if column exists before adding
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'travel_db' 
               AND TABLE_NAME = 'bookings' 
               AND COLUMN_NAME = 'notes');

SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE bookings ADD COLUMN notes TEXT NULL AFTER status',
  'SELECT "Column notes already exists" AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

