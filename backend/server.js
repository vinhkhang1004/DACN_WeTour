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
import hotelRoutes from "./src/routes/hotelRoutes.js";
import flightRoutes from "./src/routes/flightRoutes.js";
import customTourRoutes from "./src/routes/customTourRoutes.js";
import adminHotelRoutes from "./src/routes/adminHotelRoutes.js";
import adminFlightRoutes from "./src/routes/adminFlightRoutes.js";
import hotelPaymentRoutes from "./src/routes/hotelPaymentRoutes.js";
import flightPaymentRoutes from "./src/routes/flightPaymentRoutes.js";
import customTourPaymentRoutes from "./src/routes/customTourPaymentRoutes.js";
import hotelReviewRoutes from "./src/routes/hotelReviewRoutes.js";
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
app.use("/api/hotels", hotelRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/custom-tours", customTourRoutes);
app.use("/api/admin/hotels", adminHotelRoutes);
app.use("/api/admin/flights", adminFlightRoutes);
app.use("/api/hotels/payment", hotelPaymentRoutes); // Mount hotel payment routes under /api/hotels/payment
app.use("/api/flight-payments", flightPaymentRoutes);
app.use("/api/custom-tour-payments", customTourPaymentRoutes);
app.use("/api/hotel-reviews", hotelReviewRoutes);

// Healthcheck routes
app.get("/api/health/db", async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ ok: true, message: "Database connected" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Database not connected", error: String(error?.message || error) });
  }
});

// Cron endpoint for Vercel Cron Jobs (serverless)
// This endpoint will be called by Vercel Cron Jobs instead of using node-cron
app.get("/api/cron/notifications", async (req, res) => {
  try {
    // Import and run the notification logic
    const { runNotificationJob } = await import("./src/utils/notificationScheduler.js");
    await runNotificationJob();
    return res.status(200).json({ ok: true, message: "Notification job completed" });
  } catch (error) {
    console.error("Error in cron endpoint:", error);
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});

// Initialize database connection
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    initModels();
    await sequelize.sync(); // for demo; in production use migrations
    console.log("✅ MySQL connected & models synced");
    return true;
  } catch (err) {
    console.error("DB error:", err);
    return false;
  }
};

// DB sync and server startup
const start = async () => {
  const dbConnected = await initDatabase();
  if (!dbConnected) {
    process.exit(1);
  }
  
  // Only start cron scheduler in traditional server mode (not serverless)
  // In Vercel, cron jobs are handled via /api/cron/notifications endpoint
  if (process.env.VERCEL !== "1") {
    startNotificationScheduler();
  }
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
};

// Only start server if not running as Vercel serverless function
// Vercel will import this file and use the app export
if (process.env.VERCEL !== "1") {
  start();
}

// Export app for Vercel serverless functions
export default app;
