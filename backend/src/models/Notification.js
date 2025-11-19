import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true }, // null = broadcast
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: "info" },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_read" },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "notifications",
    timestamps: false,
  }
);


