import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Post = sequelize.define(
  "Post",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT, allowNull: false },
    image: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING, defaultValue: "travel" },
    author_id: { type: DataTypes.INTEGER },
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_published" },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "posts",
    timestamps: false,
  }
);

export const Category = sequelize.define(
  "Category",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    tableName: "categories",
    timestamps: false,
  }
);

