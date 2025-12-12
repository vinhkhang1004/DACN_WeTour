import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CustomTour = sequelize.define("CustomTour", {
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
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
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
  tour_type: {
    type: DataTypes.STRING(50),
    defaultValue: "Nghỉ dưỡng"
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  total_hours: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
    defaultValue: "pending"
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "custom_tours",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});


