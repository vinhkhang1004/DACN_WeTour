import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Booking = sequelize.define("Booking", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  people_count: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 1 
  },
  total_price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  booking_date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM("pending", "paid", "completed", "cancelled"), 
    defaultValue: "pending" 
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },

  // 👇 Thêm hai khóa ngoại mapping đúng DB
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true, // Cho phép NULL cho khách chưa đăng nhập
    references: {
      model: "users",
      key: "id"
    }
  },
  // Thông tin khách chưa đăng nhập
  guest_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guest_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guest_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tour_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: "tours",
      key: "id"
    }
  },
  promotion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "promotions",
      key: "id"
    }
  },
}, {
  tableName: "bookings",
  timestamps: false
});
