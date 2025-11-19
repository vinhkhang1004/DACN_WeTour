import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Promotion = sequelize.define("Promotion", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  discount_type: {
    type: DataTypes.ENUM("percentage", "fixed"),
    allowNull: false,
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  min_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  valid_from: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  valid_to: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM("domestic", "international", "combo", "early", "special", "flash", "all"),
    defaultValue: "all",
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Số lần sử dụng tối đa (NULL = không giới hạn)",
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Số lần đã sử dụng",
  },
}, {
  tableName: "promotions",
  timestamps: true,
});

export const PromotionUsage = sequelize.define("PromotionUsage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  promotion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "promotions",
      key: "id",
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id",
    },
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "bookings",
      key: "id",
    },
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  used_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "promotion_usage",
  timestamps: false,
});



