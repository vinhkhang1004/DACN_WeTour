-- Script kiểm tra schema database
USE travel_db;

-- Kiểm tra các cột trong bảng tours
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'travel_db' 
  AND TABLE_NAME = 'tours'
ORDER BY ORDINAL_POSITION;

-- Kiểm tra xem các cột mới đã có chưa
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'available_dates'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'available_dates',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'departure_date'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'departure_date',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'status'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'status',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'images'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'images',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'max_people'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'max_people',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'category'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'category',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'categories'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'categories',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'difficulty'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'difficulty',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'includes'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'includes',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'excludes'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'excludes',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'itinerary'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'itinerary',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'travel_db' 
            AND TABLE_NAME = 'tours' 
            AND COLUMN_NAME = 'highlights'
        ) THEN '✅ Có' ELSE '❌ Thiếu'
    END AS 'highlights';

