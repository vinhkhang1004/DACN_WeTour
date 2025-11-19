import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Newsletter = sequelize.define("Newsletter", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM("active", "unsubscribed"),
    defaultValue: "active",
  },
  subscribed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "newsletter_subscriptions",
  timestamps: false,
});



