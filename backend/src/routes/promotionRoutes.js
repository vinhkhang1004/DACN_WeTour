import express from "express";
import { Promotion, PromotionUsage } from "../models/Promotion.js";
import { Booking } from "../models/Booking.js";
import { Op } from "sequelize";

const router = express.Router();

// Get all promotions (public: only active, admin: all)
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 20, showAll } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Public view: only show active and valid promotions
    // Admin view: show all if showAll=true
    if (!showAll) {
      whereClause.is_active = true;
      whereClause.valid_from = { [Op.lte]: new Date() };
      whereClause.valid_to = { [Op.gte]: new Date() };
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const { count, rows } = await Promotion.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["id", "DESC"]]
    });

    res.json({
      promotions: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Get promotions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get promotion by code
router.get("/code/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { totalAmount } = req.query;

    const promotion = await Promotion.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_to: { [Op.gte]: new Date() }
      }
    });

    if (!promotion) {
      return res.status(404).json({ message: "Promotion code not found or expired" });
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return res.status(400).json({ message: "Promotion code usage limit exceeded" });
    }

    // Check minimum amount
    if (totalAmount && promotion.min_amount > parseFloat(totalAmount)) {
      return res.status(400).json({ 
        message: `Minimum amount required: ${promotion.min_amount.toLocaleString()} ₫` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (totalAmount) {
      const amount = parseFloat(totalAmount);
      if (promotion.discount_type === "percentage") {
        discountAmount = (amount * promotion.discount_value) / 100;
        if (promotion.max_discount && discountAmount > promotion.max_discount) {
          discountAmount = promotion.max_discount;
        }
      } else {
        discountAmount = promotion.discount_value;
      }
    }

    res.json({
      promotion,
      discountAmount,
      finalAmount: totalAmount ? parseFloat(totalAmount) - discountAmount : null
    });
  } catch (error) {
    console.error("Get promotion by code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Apply promotion to booking
router.post("/apply", async (req, res) => {
  try {
    const { bookingId, promotionCode } = req.body;

    if (!bookingId || !promotionCode) {
      return res.status(400).json({ message: "Booking ID and promotion code are required" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const promotion = await Promotion.findOne({
      where: {
        code: promotionCode.toUpperCase(),
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_to: { [Op.gte]: new Date() }
      }
    });

    if (!promotion) {
      return res.status(404).json({ message: "Promotion code not found or expired" });
    }

    // Check if already applied
    if (booking.promotion_id) {
      return res.status(400).json({ message: "Promotion already applied to this booking" });
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return res.status(400).json({ message: "Promotion code usage limit exceeded" });
    }

    // Check minimum amount
    if (promotion.min_amount > booking.total_price) {
      return res.status(400).json({ 
        message: `Minimum amount required: ${promotion.min_amount.toLocaleString()} ₫` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.discount_type === "percentage") {
      discountAmount = (booking.total_price * promotion.discount_value) / 100;
      if (promotion.max_discount && discountAmount > promotion.max_discount) {
        discountAmount = promotion.max_discount;
      }
    } else {
      discountAmount = promotion.discount_value;
    }

    // Update booking with promotion
    await booking.update({
      promotion_id: promotion.id,
      discount_amount: discountAmount,
      total_price: booking.total_price - discountAmount
    });

    // Update promotion usage count
    await promotion.update({
      usage_count: promotion.usage_count + 1
    });

    // Record usage
    await PromotionUsage.create({
      promotion_id: promotion.id,
      user_id: booking.user_id,
      booking_id: booking.id,
      discount_amount: discountAmount
    });

    res.json({
      message: "Promotion applied successfully",
      discountAmount,
      finalAmount: booking.total_price - discountAmount
    });
  } catch (error) {
    console.error("Apply promotion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get promotion statistics (admin only)
router.get("/stats", async (req, res) => {
  try {
    const totalPromotions = await Promotion.count();
    const activePromotions = await Promotion.count({
      where: {
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_to: { [Op.gte]: new Date() }
      }
    });

    const totalUsage = await PromotionUsage.sum("discount_amount") || 0;
    const totalSavings = await PromotionUsage.sum("discount_amount") || 0;

    const topPromotions = await Promotion.findAll({
      attributes: [
        "id", "title", "code", "discount_type", "discount_value",
        [Promotion.sequelize.fn("COUNT", Promotion.sequelize.col("PromotionUsages.id")), "usage_count"],
        [Promotion.sequelize.fn("SUM", Promotion.sequelize.col("PromotionUsages.discount_amount")), "total_discount"]
      ],
      include: [{
        model: PromotionUsage,
        attributes: [],
        required: false
      }],
      group: ["Promotion.id"],
      order: [[Promotion.sequelize.fn("COUNT", Promotion.sequelize.col("PromotionUsages.id")), "DESC"]],
      limit: 10
    });

    const categoryStats = await Promotion.findAll({
      attributes: [
        "category",
        [Promotion.sequelize.fn("COUNT", Promotion.sequelize.col("id")), "count"]
      ],
      group: ["category"],
      order: [[Promotion.sequelize.fn("COUNT", Promotion.sequelize.col("id")), "DESC"]]
    });

    res.json({
      totalPromotions,
      activePromotions,
      totalUsage,
      totalSavings,
      topPromotions,
      categoryStats
    });
  } catch (error) {
    console.error("Promotion stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new promotion (admin only)
router.post("/", async (req, res) => {
  try {
    const promotionData = req.body;
    
    const promotion = await Promotion.create(promotionData);
    res.status(201).json({ message: "Promotion created successfully", promotion });
  } catch (error) {
    console.error("Create promotion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update promotion (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    await promotion.update(updateData);
    res.json({ message: "Promotion updated successfully", promotion });
  } catch (error) {
    console.error("Update promotion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete promotion (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    await promotion.destroy();
    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Delete promotion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

