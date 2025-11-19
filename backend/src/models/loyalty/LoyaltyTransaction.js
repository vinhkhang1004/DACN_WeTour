import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

export const LoyaltyTransaction = sequelize.define(
  "LoyaltyTransaction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("earn", "spend"), allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "loyalty_transactions",
    timestamps: false,
  }
);


