import express from "express";
import { Promotion, PromotionUsage } from "../models/Promotion.js";
import { Booking } from "../models/Booking.js";
import { Op } from "sequelize";

const router = express.Router();

// Get all promotions (public: only active, admin: all)
router.get("/", async (req, res) => {
  try {
    const { category, service_type, page = 1, limit = 20, showAll, active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Public view: only show active and valid promotions
    // Admin view: show all if showAll=true
    if (!showAll && active !== "false") {
      whereClause.is_active = true;
      whereClause.valid_from = { [Op.lte]: new Date() };
      whereClause.valid_to = { [Op.gte]: new Date() };
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    // Filter by service_type if provided
    if (service_type && service_type !== "all") {
      // Build array of valid service_types including combos
      const validServiceTypes = [service_type, "all", null];
      
      // Add combo options based on service_type
      if (service_type === "tour") {
        validServiceTypes.push("tour_hotel", "tour_flight");
      } else if (service_type === "hotel") {
        validServiceTypes.push("tour_hotel", "hotel_flight");
      } else if (service_type === "flight") {
        validServiceTypes.push("tour_flight", "hotel_flight");
      } else if (service_type === "tour_hotel") {
        validServiceTypes.push("tour", "hotel", "all");
      } else if (service_type === "tour_flight") {
        validServiceTypes.push("tour", "flight", "all");
      } else if (service_type === "hotel_flight") {
        validServiceTypes.push("hotel", "flight", "all");
      }
      
      whereClause[Op.or] = validServiceTypes.map(st => ({ service_type: st }));
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

// Check promotion code validity
router.post("/check", async (req, res) => {
  try {
    const { code, amount, category, service_type } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Promotion code is required" });
    }

    // Build where conditions
    const whereConditions = {
      code: code.toUpperCase(),
      is_active: true,
      valid_from: { [Op.lte]: new Date() },
      valid_to: { [Op.gte]: new Date() }
    };

    // Check service_type if provided (priority over category)
    if (service_type) {
      // Build array of valid service_types including combos
      const validServiceTypes = [service_type, "all", null];
      
      // Add combo options based on service_type
      if (service_type === "tour") {
        validServiceTypes.push("tour_hotel", "tour_flight");
      } else if (service_type === "hotel") {
        validServiceTypes.push("tour_hotel", "hotel_flight");
      } else if (service_type === "flight") {
        validServiceTypes.push("tour_flight", "hotel_flight");
      }
      
      whereConditions[Op.or] = validServiceTypes.map(st => ({ service_type: st }));
    } else if (category) {
      // Fallback to category for backward compatibility
      whereConditions[Op.or] = [
        { category: category },
        { category: "all" },
        { category: null }
      ];
    }

    const promotion = await Promotion.findOne({
      where: whereConditions
    });

    if (!promotion) {
      return res.json({
        valid: false,
        message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn"
      });
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return res.json({
        valid: false,
        message: "Mã khuyến mãi đã hết lượt sử dụng"
      });
    }

    // Check minimum amount if amount provided
    if (amount && promotion.min_amount > parseFloat(amount)) {
      return res.json({
        valid: false,
        message: `Đơn hàng tối thiểu ${promotion.min_amount.toLocaleString()} ₫ để sử dụng mã này`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (amount) {
      const totalAmount = parseFloat(amount);
      if (promotion.discount_type === "percentage") {
        discountAmount = (totalAmount * promotion.discount_value) / 100;
        if (promotion.max_discount && discountAmount > promotion.max_discount) {
          discountAmount = promotion.max_discount;
        }
      } else {
        discountAmount = promotion.discount_value;
      }
    }

    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        title: promotion.title,
        code: promotion.code,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value
      },
      discount_amount: discountAmount
    });
  } catch (error) {
    console.error("Check promotion error:", error);
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

    // Build where conditions
    const whereConditions = {
      code: promotionCode.toUpperCase(),
      is_active: true,
      valid_from: { [Op.lte]: new Date() },
      valid_to: { [Op.gte]: new Date() }
    };

    // Check service_type if provided (for tour bookings, service_type should be "tour" or "all" or combo)
    // If not provided, we'll check all promotions (backward compatibility)
    const { service_type } = req.body;
    if (service_type) {
      // Build array of valid service_types including combos
      const validServiceTypes = [service_type, "all", null];
      
      // Add combo options based on service_type
      if (service_type === "tour") {
        validServiceTypes.push("tour_hotel", "tour_flight");
      } else if (service_type === "hotel") {
        validServiceTypes.push("tour_hotel", "hotel_flight");
      } else if (service_type === "flight") {
        validServiceTypes.push("tour_flight", "hotel_flight");
      }
      
      whereConditions[Op.or] = validServiceTypes.map(st => ({ service_type: st }));
    }

    const promotion = await Promotion.findOne({
      where: whereConditions
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
    const {
      title,
      description,
      code,
      discount_type,
      discount_value,
      min_amount,
      max_discount,
      valid_from,
      valid_to,
      category,
      service_type,
      image,
      is_active,
      usage_limit
    } = req.body;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    // Update only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = parseFloat(discount_value);
    if (min_amount !== undefined) updateData.min_amount = parseFloat(min_amount || 0);
    if (max_discount !== undefined) updateData.max_discount = max_discount ? parseFloat(max_discount) : null;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_to !== undefined) updateData.valid_to = valid_to;
    if (category !== undefined) updateData.category = category;
    if (service_type !== undefined) updateData.service_type = service_type;
    if (image !== undefined) updateData.image = image;
    if (is_active !== undefined) updateData.is_active = is_active === "true" || is_active === true;
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit ? parseInt(usage_limit) : null;

    console.log("Updating promotion with data:", updateData);

    await promotion.update(updateData);
    
    // Reload to get updated data
    await promotion.reload();
    
    res.json({ message: "Promotion updated successfully", promotion });
  } catch (error) {
    console.error("Update promotion error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: error.errors || null
    });
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

