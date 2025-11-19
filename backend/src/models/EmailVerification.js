import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const EmailVerification = sequelize.define("EmailVerification", {
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
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "is_verified"
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "expires_at"
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "verified_at"
  }
}, {
  tableName: "email_verifications",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default EmailVerification;

