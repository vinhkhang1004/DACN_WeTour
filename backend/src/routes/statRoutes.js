import express from "express";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import { Booking, Tour, User, Payment, Promotion } from "../models/index.js";
import { sequelize, Op } from "../config/db.js";

const router = express.Router();

// ✅ Tổng quan
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const totalTours = await Tour.count();
    const totalBookings = await Booking.count({
      where: { booking_date: { [Op.ne]: "0000-00-00" } },
    });
    const totalRevenue =
      (await Booking.sum("total_price", {
        where: {
          status: { [Op.in]: ["paid", "completed"] },
          booking_date: { [Op.ne]: "0000-00-00" },
        },
      })) || 0;

    res.json({
      summary: { totalTours, totalBookings, totalRevenue },
    });
  } catch (error) {
    console.error("❌ Error /api/stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Doanh thu theo tháng
router.get("/monthly", authenticateAdmin, async (req, res) => {
  try {
    const { year, month } = req.query;

    const where = {
      status: { [Op.in]: ["paid", "completed"] },
      booking_date: { [Op.ne]: "0000-00-00" },
    };

    if (year) {
      where[Op.and] = [
        sequelize.where(sequelize.fn("YEAR", sequelize.col("booking_date")), year),
      ];
    }

    if (month) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.where(sequelize.fn("MONTH", sequelize.col("booking_date")), month),
      ];
    }

    const data = await Booking.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("booking_date")), "month"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      where,
      group: ["month"],
      order: [[sequelize.fn("MONTH", sequelize.col("booking_date")), "ASC"]],
    });

    res.json(
      data.map((item) => ({
        month: `Tháng ${item.dataValues.month}`,
        revenue: Number(item.dataValues.revenue),
      }))
    );
  } catch (error) {
    console.error("❌ Error /api/stats/monthly:", error);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
  }
});

// ✅ Top 5 tour đặt nhiều nhất
router.get("/top-tours", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        "tour_id",
        [sequelize.fn("COUNT", sequelize.col("tour_id")), "bookings"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      include: [{ model: Tour, attributes: ["name"] }],
      where: {
        status: { [Op.in]: ["paid", "completed"] },
        booking_date: { [Op.ne]: "0000-00-00" },
      },
      group: ["tour_id", "Tour.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("tour_id")), "DESC"]],
      limit: 5,
    });

    res.json(
      data.map((item) => ({
        id: item.tour_id,
        name: item.Tour?.name || "Không xác định",
        bookings: Number(item.dataValues.bookings),
        revenue: Number(item.dataValues.revenue),
      }))
    );
  } catch (error) {
    console.error("❌ Error /api/stats/top-tours:", error);
    res.status(500).json({ message: "Lỗi khi lấy top tour" });
  }
});

// Revenue by destination
router.get("/revenue-by-destination", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      include: [{ model: Tour, attributes: ["destination"] }],
      where: {
        status: { [Op.in]: ["paid", "completed"] },
        booking_date: { [Op.ne]: "0000-00-00" },
      },
      group: [sequelize.col("Tour.destination")],
      order: [[sequelize.fn("SUM", sequelize.col("total_price")), "DESC"]],
    });

    res.json(
      data.map((item) => ({
        destination: item.Tour?.destination || "N/A",
        revenue: Number(item.dataValues.revenue),
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Booking status breakdown
router.get("/booking-status", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      group: ["status"],
    });

    res.json(
      data.map((item) => ({
        status: item.status,
        count: Number(item.dataValues.count),
        revenue: Number(item.dataValues.revenue),
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Users stats
router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: "active" } });
    const usersWithBookings = await User.count({ include: [{ model: Booking }] });

    res.json({ totalUsers, activeUsers, usersWithBookings });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Promotions stats
router.get("/promotions-stats", authenticateAdmin, async (req, res) => {
  try {
    const totalPromos = await Promotion.count();
    const activePromos = await Promotion.count({
      where: {
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_to: { [Op.gte]: new Date() },
      },
    });
    const totalDiscountUsed = await Booking.sum("discount_amount") || 0;

    res.json({ totalPromos, activePromos, totalDiscountUsed });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Public endpoint for homepage (no authentication required)
router.get("/public", async (req, res) => {
  try {
    const totalTours = await Tour.count();
    const totalUsers = await User.count();
    const totalBookings = await Booking.count({
      where: { booking_date: { [Op.ne]: "0000-00-00" } },
    });

    res.json({
      totalTours,
      totalUsers,
      totalBookings
    });
  } catch (error) {
    console.error("❌ Error /api/stats/public:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Additional endpoints for AdminAnalyticsPro
router.get("/summary", authenticateAdmin, async (req, res) => {
  try {
    const totalTours = await Tour.count();
    const totalUsers = await User.count();
    const totalBookings = await Booking.count();
    const monthlyRevenue = await Booking.sum("total_price", {
      where: {
        status: { [Op.in]: ["paid", "completed"] },
      }
    }) || 0;

    res.json({
      totalTours,
      totalUsers,
      totalBookings,
      monthlyRevenue
    });
  } catch (error) {
    console.error("❌ Error /api/stats/summary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/overview", authenticateAdmin, async (req, res) => {
  try {
    const totalTours = await Tour.count();
    const totalUsers = await User.count();
    const totalBookings = await Booking.count();
    const totalRevenue = await Booking.sum("total_price", {
      where: { status: { [Op.in]: ["paid", "completed"] } }
    }) || 0;

    res.json({
      totalTours,
      totalUsers,
      totalBookings,
      totalRevenue
    });
  } catch (error) {
    console.error("❌ Error /api/stats/overview:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/revenue", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("booking_date")), "date"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"]
      ],
      where: {
        status: { [Op.in]: ["paid", "completed"] }
      },
      group: [sequelize.fn("DATE", sequelize.col("booking_date"))],
      order: [[sequelize.fn("DATE", sequelize.col("booking_date")), "ASC"]],
      limit: 30
    });

    res.json(data.map(item => ({
      date: item.dataValues.date,
      revenue: Number(item.dataValues.revenue || 0)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/bookings", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("booking_date")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: [sequelize.fn("DATE", sequelize.col("booking_date"))],
      order: [[sequelize.fn("DATE", sequelize.col("booking_date")), "ASC"]],
      limit: 30
    });

    res.json(data.map(item => ({
      date: item.dataValues.date,
      bookings: Number(item.dataValues.count || 0)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/tours", authenticateAdmin, async (req, res) => {
  try {
    const totalTours = await Tour.count();
    const toursWithBookings = await Tour.count({
      include: [{ model: Booking }]
    });

    res.json({
      totalTours,
      toursWithBookings,
      topTours: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/geographic", authenticateAdmin, async (req, res) => {
  try {
    const data = await Booking.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"]
      ],
      include: [{ model: Tour, attributes: ["destination"] }],
      where: {
        status: { [Op.in]: ["paid", "completed"] }
      },
      group: [sequelize.col("Tour.destination")],
      order: [[sequelize.fn("SUM", sequelize.col("total_price")), "DESC"]],
      limit: 10
    });

    res.json(data.map(item => ({
      destination: item.Tour?.destination || "N/A",
      revenue: Number(item.dataValues.revenue || 0)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/devices", authenticateAdmin, async (req, res) => {
  // Mock data for now
  res.json([
    { device: "Desktop", users: 45 },
    { device: "Mobile", users: 32 },
    { device: "Tablet", users: 8 }
  ]);
});

router.get("/conversion", authenticateAdmin, async (req, res) => {
  // Mock data for now
  res.json([
    { date: "2025-01-01", rate: 2.5 },
    { date: "2025-01-02", rate: 3.2 },
    { date: "2025-01-03", rate: 2.8 }
  ]);
});

export default router;
