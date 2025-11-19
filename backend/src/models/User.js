import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "phone",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "address",
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
      field: "role",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
      field: "status", // 🟢 ánh xạ đúng tên cột
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "loyalty_points",
    },
    loyaltyTier: {
      type: DataTypes.STRING,
      defaultValue: "Member",
      field: "loyalty_tier",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at", // 🟢 ánh xạ đúng tên cột snake_case
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    tableName: "users", // 🟢 Tên bảng đúng trong DB
    timestamps: true, // để Sequelize hiểu có createdAt/updatedAt
  }
);
