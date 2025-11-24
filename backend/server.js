import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./src/config/db.js";
import { initModels } from "./src/models/index.js";
import userRoutes from "./src/routes/userRoutes.js";
import tourRoutes from "./src/routes/tourRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import statRoutes from "./src/routes/statRoutes.js";
import adminUserRoutes from "./src/routes/adminUserRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import newsletterRoutes from "./src/routes/newsletterRoutes.js";
import promotionRoutes from "./src/routes/promotionRoutes.js";
import loyaltyRoutes from "./src/routes/loyaltyRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import adminChatRoutes from "./src/routes/adminChatRoutes.js";
import { startNotificationScheduler } from "./src/utils/notificationScheduler.js";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/admin/stats", statRoutes);
app.use("/api/admin/analytics", statRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/chat", adminChatRoutes);

// Healthcheck routes
app.get("/api/health/db", async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ ok: true, message: "Database connected" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Database not connected", error: String(error?.message || error) });
  }
});

// DB sync
const start = async () => {
  try {
    await sequelize.authenticate();
    initModels();
    await sequelize.sync(); // for demo; in production use migrations
    console.log("✅ MySQL connected & models synced");
    
    // Start notification scheduler
    startNotificationScheduler();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
};

start();
