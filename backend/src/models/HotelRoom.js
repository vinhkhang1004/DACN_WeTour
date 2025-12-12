import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const HotelRoom = sequelize.define("HotelRoom", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "hotels",
      key: "id"
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  max_guests: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  max_children: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bed_type: {
    type: DataTypes.STRING,
    allowNull: true // "1 giường đôi", "1 giường King", etc.
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
  features: {
    type: DataTypes.TEXT,
    allowNull: true // JSON array of features
  },
  status: {
    type: DataTypes.ENUM("available", "unavailable"),
    defaultValue: "available"
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: "Số lượng phòng còn lại"
  }
}, {
  tableName: "hotel_rooms",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  hooks: {
    // Tự động chuyển status sang unavailable khi quantity <= 0
    beforeSave: async (room) => {
      // Chỉ xử lý nếu quantity được định nghĩa và là số hợp lệ
      if (room.quantity !== undefined && room.quantity !== null) {
        const qty = parseInt(room.quantity);
        if (isNaN(qty)) {
          // Nếu quantity không phải số, giữ nguyên giá trị hiện tại hoặc dùng default
          if (room.isNewRecord) {
            room.quantity = 1;
          }
        } else {
          // Đảm bảo quantity là số nguyên hợp lệ
          room.quantity = qty;
          
          // Tự động chuyển status dựa trên quantity
          if (qty <= 0) {
            room.status = "unavailable";
          } else if (qty > 0 && room.status === "unavailable" && !room.changed('status')) {
            // Chỉ tự động chuyển về available nếu admin không chỉ định status
            room.status = "available";
          }
        }
      } else if (room.isNewRecord) {
        // Nếu là record mới và không có quantity, dùng default
        room.quantity = 1;
      }
    },
    afterFind: async (rooms) => {
      // Xử lý cả array và single instance
      const roomArray = Array.isArray(rooms) ? rooms : [rooms];
      for (const room of roomArray) {
        if (room && room.quantity !== undefined && room.quantity <= 0 && room.status === "available") {
          await room.update({ status: "unavailable" });
        }
      }
    }
  }
});


