import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Activity = sequelize.define("Activity", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  price_per_person: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "activities",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});


