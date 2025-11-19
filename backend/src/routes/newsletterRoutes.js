import express from "express";
import { Newsletter } from "../models/Newsletter.js";
import { Op } from "sequelize";

const router = express.Router();

// Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingSubscription) {
      if (existingSubscription.status === "active") {
        return res.status(400).json({ message: "Email already subscribed" });
      } else {
        // Reactivate subscription
        await existingSubscription.update({
          status: "active",
          name,
          subscribed_at: new Date(),
          unsubscribed_at: null
        });
        return res.json({ message: "Successfully resubscribed to newsletter" });
      }
    }

    // Create new subscription
    await Newsletter.create({
      name,
      email: email.toLowerCase(),
      status: "active"
    });

    res.json({ message: "Successfully subscribed to newsletter" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unsubscribe from newsletter
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const subscription = await Newsletter.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!subscription) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (subscription.status === "unsubscribed") {
      return res.status(400).json({ message: "Email already unsubscribed" });
    }

    await subscription.update({
      status: "unsubscribed",
      unsubscribed_at: new Date()
    });

    res.json({ message: "Successfully unsubscribed from newsletter" });
  } catch (error) {
    console.error("Newsletter unsubscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get newsletter statistics (admin only)
router.get("/stats", async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.count({
      where: { status: "active" }
    });

    const totalUnsubscribed = await Newsletter.count({
      where: { status: "unsubscribed" }
    });

    const recentSubscriptions = await Newsletter.findAll({
      where: { status: "active" },
      order: [["subscribed_at", "DESC"]],
      limit: 10,
      attributes: ["name", "email", "subscribed_at"]
    });

    const monthlyStats = await Newsletter.findAll({
      attributes: [
        [Newsletter.sequelize.fn("DATE_FORMAT", Newsletter.sequelize.col("subscribed_at"), "%Y-%m"), "month"],
        [Newsletter.sequelize.fn("COUNT", Newsletter.sequelize.col("id")), "count"]
      ],
      where: {
        status: "active",
        subscribed_at: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // Current year
        }
      },
      group: [Newsletter.sequelize.fn("DATE_FORMAT", Newsletter.sequelize.col("subscribed_at"), "%Y-%m")],
      order: [["month", "ASC"]]
    });

    res.json({
      totalSubscribers,
      totalUnsubscribed,
      recentSubscriptions,
      monthlyStats
    });
  } catch (error) {
    console.error("Newsletter stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all subscribers (admin only)
router.get("/subscribers", async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "active" } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Newsletter.findAndCountAll({
      where: { status },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["subscribed_at", "DESC"]]
    });

    res.json({
      subscribers: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;



