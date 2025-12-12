-- Create flights table
CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline VARCHAR(100) NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  origin_code VARCHAR(3) NOT NULL,
  origin_airport VARCHAR(200) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  destination_code VARCHAR(3) NOT NULL,
  destination_airport VARCHAR(200) NOT NULL,
  departure_date DATETIME NOT NULL,
  arrival_date DATETIME NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  flight_type ENUM('direct', 'connecting', 'layover') DEFAULT 'direct',
  aircraft_type VARCHAR(50),
  economy_price DECIMAL(10,2) NOT NULL,
  business_price DECIMAL(10,2),
  first_class_price DECIMAL(10,2),
  available_seats_economy INT DEFAULT 0,
  available_seats_business INT DEFAULT 0,
  available_seats_first INT DEFAULT 0,
  baggage_carry_on VARCHAR(20) DEFAULT '7kg',
  baggage_checked VARCHAR(20) DEFAULT '23kg',
  status ENUM('scheduled', 'delayed', 'cancelled', 'completed') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_origin (origin_code),
  INDEX idx_destination (destination_code),
  INDEX idx_departure_date (departure_date),
  INDEX idx_airline (airline),
  INDEX idx_status (status)
);

-- Create flight_bookings table
CREATE TABLE IF NOT EXISTS flight_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(10) NOT NULL UNIQUE,
  user_id INT,
  guest_name VARCHAR(200),
  guest_email VARCHAR(200),
  guest_phone VARCHAR(50),
  flight_id INT NOT NULL,
  return_flight_id INT,
  passenger_count INT DEFAULT 1,
  class_type ENUM('economy', 'business', 'first') DEFAULT 'economy',
  passengers TEXT COMMENT 'JSON array of passenger info',
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  promotion_id INT,
  additional_services TEXT COMMENT 'JSON object',
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE RESTRICT,
  FOREIGN KEY (return_flight_id) REFERENCES flights(id) ON DELETE SET NULL,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_guest_email (guest_email),
  INDEX idx_booking_code (booking_code),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
);

-- Insert sample flights
INSERT INTO flights (airline, flight_number, origin, origin_code, origin_airport, destination, destination_code, destination_airport, departure_date, arrival_date, duration, flight_type, economy_price, business_price, available_seats_economy, available_seats_business) VALUES
('Vietnam Airlines', 'VN-245', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', '2024-12-25 07:00:00', '2024-12-25 09:10:00', 130, 'direct', 1500000, 3500000, 50, 20),
('Vietjet Air', 'VJ-301', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', '2024-12-25 06:00:00', '2024-12-25 08:10:00', 130, 'direct', 1250000, 0, 100, 0),
('Vietnam Airlines', 'VN-215', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', '2024-12-25 10:00:00', '2024-12-25 12:15:00', 135, 'direct', 1620000, 3800000, 45, 15),
('Bamboo Airways', 'QH-201', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', '2024-12-25 08:30:00', '2024-12-25 10:00:00', 90, 'direct', 1200000, 0, 80, 0),
('Vietnam Airlines', 'VN-155', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', '2024-12-25 09:00:00', '2024-12-25 10:30:00', 90, 'direct', 1100000, 2800000, 60, 25);








