import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CustomTourActivity = sequelize.define("CustomTourActivity", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  custom_tour_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "custom_tours",
      key: "id"
    }
  },
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "activities",
      key: "id"
    }
  },
  day_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "custom_tour_activities",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});


