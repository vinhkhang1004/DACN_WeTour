import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Hotel = sequelize.define("Hotel", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  star_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  user_score: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    defaultValue: 0
  },
  price_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true // JSON array of image URLs
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amenities: {
    type: DataTypes.TEXT,
    allowNull: true // JSON array of amenities
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  total_rooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active"
  }
}, {
  tableName: "hotels",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});


