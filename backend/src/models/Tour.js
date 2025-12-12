import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Tour = sequelize.define("Tour", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.STRING, allowNull: false },
  departure_date: { type: DataTypes.DATE, allowNull: true }, // Giữ lại để backward compatibility
  available_dates: { type: DataTypes.TEXT, allowNull: true }, // JSON array of dates
  max_people: { type: DataTypes.INTEGER, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  categories: { type: DataTypes.TEXT, allowNull: true }, // Comma-separated or JSON
  travel_style: { type: DataTypes.STRING, allowNull: true }, // Tiết kiệm, Trung bình, Cao cấp, Luxury
  tour_type: { type: DataTypes.STRING, allowNull: true }, // Tour ghép, Tour riêng, Tour VIP
  includes: { type: DataTypes.TEXT, allowNull: true },
  excludes: { type: DataTypes.TEXT, allowNull: true },
  itinerary: { type: DataTypes.TEXT, allowNull: true }, // JSON array of itinerary days
  highlights: { type: DataTypes.TEXT, allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true }, // Google Maps latitude
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true }, // Google Maps longitude
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: true },
  images: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "active" }
}, {
  tableName: "tours",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});
