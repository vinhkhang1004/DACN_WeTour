import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const HotelBooking = sequelize.define("HotelBooking", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    }
  },
  guest_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guest_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guest_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "hotels",
      key: "id"
    }
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "hotel_rooms",
      key: "id"
    },
    comment: "ID của loại phòng được đặt (nếu có)"
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  adults: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  children: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rooms: {
    type: DataTypes.INTEGER,
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
  promotion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "promotions",
      key: "id"
    }
  },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
    defaultValue: "pending"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "hotel_bookings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});


