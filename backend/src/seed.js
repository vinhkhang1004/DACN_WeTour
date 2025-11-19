import { sequelize } from "./config/db.js";
import { initModels, Tour } from "./models/index.js";

const seed = async () => {
  await sequelize.authenticate();
  initModels();
  await sequelize.sync({ force: true });

  await Tour.bulkCreate([
    { name: "Phú Quốc 3N2Đ", destination: "Phú Quốc", price: 3990000, duration: "3 ngày 2 đêm", description: "Resort 4*, vé máy bay khứ hồi", image: "https://picsum.photos/seed/pq/600/400" },
    { name: "Đà Lạt 4N3Đ", destination: "Đà Lạt", price: 3290000, duration: "4 ngày 3 đêm", description: "Khách sạn trung tâm, xe đưa đón", image: "https://picsum.photos/seed/dl/600/400" },
    { name: "Nha Trang 3N2Đ", destination: "Nha Trang", price: 2990000, duration: "3 ngày 2 đêm", description: "Tắm biển, VinWonders", image: "https://picsum.photos/seed/nt/600/400" }
  ]);

  console.log("✅ Seed dữ liệu mẫu thành công");
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
