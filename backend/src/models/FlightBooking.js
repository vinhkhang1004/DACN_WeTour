import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const FlightBooking = sequelize.define("FlightBooking", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  booking_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
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
  flight_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "flights",
      key: "id"
    }
  },
  return_flight_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "flights",
      key: "id"
    }
  },
  passenger_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  class_type: {
    type: DataTypes.ENUM("economy", "business", "first"),
    defaultValue: "economy"
  },
  passengers: {
    type: DataTypes.TEXT, // JSON array of passenger info
    allowNull: true
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
  additional_services: {
    type: DataTypes.TEXT, // JSON object
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
    defaultValue: "pending"
  },
  payment_status: {
    type: DataTypes.ENUM("pending", "paid", "refunded"),
    defaultValue: "pending"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "flight_bookings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});








