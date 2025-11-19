import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "bookings",
      key: "id"
    }
  },
  method: { type: DataTypes.ENUM("cash","momo","vnpay"), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  status: { type: DataTypes.ENUM("success","failed","pending"), defaultValue: "pending" },
  transaction_code: { type: DataTypes.STRING(100), allowNull: true }
}, {
  tableName: "payments",
  timestamps: false
});
