import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const PasswordReset = sequelize.define("PasswordReset", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "email"
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: "code"
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "is_used"
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "expires_at"
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "used_at"
  }
}, {
  tableName: "password_resets",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default PasswordReset;

