import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Message = sequelize.define("Message", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  conversation_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: "conversations",
      key: "id"
    }
  },
  sender_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true, // null for system/auto-reply
    references: {
      model: "users",
      key: "id"
    }
  },
  sender_type: {
    type: DataTypes.ENUM("user", "admin", "system"),
    allowNull: false,
    defaultValue: "user"
  },
  content: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: "messages",
  timestamps: true,
  underscored: false
});

