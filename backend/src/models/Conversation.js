import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Conversation = sequelize.define("Conversation", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  status: { 
    type: DataTypes.ENUM("active", "resolved", "closed"), 
    defaultValue: "active" 
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_read_by_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_read_by_user: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: "createdAt"
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: "updatedAt"
  }
}, {
  tableName: "conversations",
  timestamps: true,
  underscored: false
});

