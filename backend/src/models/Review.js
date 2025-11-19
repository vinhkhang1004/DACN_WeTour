import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Review = sequelize.define("Review", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: "reviews",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});