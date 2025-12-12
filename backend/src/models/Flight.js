import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Flight = sequelize.define("Flight", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flight_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  origin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  origin_code: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  origin_airport: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destination_code: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  destination_airport: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departure_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  arrival_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // minutes
    allowNull: false
  },
  flight_type: {
    type: DataTypes.ENUM("direct", "connecting", "layover"),
    defaultValue: "direct"
  },
  aircraft_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  economy_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  business_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  first_class_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  available_seats_economy: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  available_seats_business: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  available_seats_first: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  baggage_carry_on: {
    type: DataTypes.STRING,
    defaultValue: "7kg"
  },
  baggage_checked: {
    type: DataTypes.STRING,
    defaultValue: "23kg"
  },
  status: {
    type: DataTypes.ENUM("scheduled", "delayed", "cancelled", "completed"),
    defaultValue: "scheduled"
  }
}, {
  tableName: "flights",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});








