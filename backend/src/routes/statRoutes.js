import express from "express";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import { Booking, Tour, User, Payment, Promotion, HotelBooking, FlightBooking } from "../models/index.js";
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
    // Get tours with bookings (all statuses, but prioritize paid/completed for revenue)
    let data = await Booking.findAll({
      attributes: [
        "tour_id",
        [sequelize.fn("COUNT", sequelize.col("tour_id")), "bookings"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      include: [
        {
          model: Tour,
          // Không dùng cột "views" vì có thể không tồn tại trong DB
          attributes: ["id", "name", "destination", "price", "image"],
          required: true,
        },
      ],
      where: {
        tour_id: { [Op.ne]: null }
      },
      group: ["tour_id", "Tour.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("tour_id")), "DESC"]],
      limit: 5,
    });

    // If no tours with bookings, get popular tours by views
    if (data.length === 0) {
      const popularTours = await Tour.findAll({
        // Không select cột "views" để tránh lỗi khi DB chưa có
        attributes: ["id", "name", "destination", "price", "image"],
        order: [["id", "DESC"]],
        limit: 5,
      });

      return res.json(
        popularTours.map((tour) => ({
          id: tour.id,
          name: tour.name || "Không xác định",
          destination: tour.destination || "",
          price: tour.price ? Number(tour.price) : 0,
          image: tour.image || null,
          views: 0,
          bookings: 0,
          revenue: 0,
        }))
      );
    }

    res.json(
      data.map((item) => {
        const tourPrice = item.Tour?.price;
        return {
          id: item.tour_id,
          name: item.Tour?.name || "Không xác định",
          destination: item.Tour?.destination || "",
          price: tourPrice ? Number(tourPrice) : 0,
          image: item.Tour?.image || null,
          views: 0,
          bookings: Number(item.dataValues.bookings || 0),
          revenue: Number(item.dataValues.revenue || 0),
        };
      })
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
    
    // Count tour bookings
    const tourBookingsCount = await Booking.count();
    
    // Count hotel bookings
    const hotelBookingsCount = await HotelBooking.count();
    const totalBookings = tourBookingsCount + hotelBookingsCount;
    
    // Calculate tour revenue
    const tourRevenue = await Booking.sum("total_price", {
      where: {
        status: { [Op.in]: ["paid", "completed"] },
      }
    }) || 0;
    
    // Calculate hotel revenue (confirmed and completed bookings)
    const hotelRevenue = await HotelBooking.sum("total_price", {
      where: {
        status: { [Op.in]: ["confirmed", "completed"] },
      }
    }) || 0;
    
    const monthlyRevenue = tourRevenue + hotelRevenue;
    
    // Calculate new users (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      totalTours,
      totalUsers,
      totalBookings,
      monthlyRevenue,
      newUsers
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

    // Tour bookings & revenue
    const totalTourBookings = await Booking.count();
    const tourRevenue =
      (await Booking.sum("total_price", {
        where: { status: { [Op.in]: ["paid", "completed"] } },
      })) || 0;

    // Hotel bookings & revenue
    const totalHotelBookings = await HotelBooking.count();
    const hotelRevenue =
      (await HotelBooking.sum("total_price", {
        where: { status: { [Op.in]: ["confirmed", "completed"] } },
      })) || 0;

    // Flight bookings & revenue
    const totalFlightBookings = await FlightBooking.count();
    const flightRevenue =
      (await FlightBooking.sum("total_price", {
        where: {
          [Op.or]: [
            { status: { [Op.in]: ["confirmed", "completed"] } },
            { payment_status: "paid" },
          ],
        },
      })) || 0;

    const totalBookings = totalTourBookings + totalHotelBookings + totalFlightBookings;
    const totalRevenue = tourRevenue + hotelRevenue + flightRevenue;

    res.json({
      totalTours,
      totalUsers,
      totalBookings,
      totalTourBookings,
      totalHotelBookings,
      totalFlightBookings,
      totalRevenue,
      tourRevenue,
      hotelRevenue,
      flightRevenue,
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

// ✅ Hotel bookings stats (by date)
router.get("/hotel-bookings", authenticateAdmin, async (req, res) => {
  try {
    const data = await HotelBooking.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("check_in_date")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      where: {
        status: { [Op.in]: ["confirmed", "completed"] },
      },
      group: [sequelize.fn("DATE", sequelize.col("check_in_date"))],
      order: [[sequelize.fn("DATE", sequelize.col("check_in_date")), "ASC"]],
      limit: 30,
    });

    res.json(
      data.map((item) => ({
        date: item.dataValues.date,
        bookings: Number(item.dataValues.count || 0),
        revenue: Number(item.dataValues.revenue || 0),
      }))
    );
  } catch (error) {
    console.error("❌ Error /api/stats/hotel-bookings:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Flight bookings stats (by date)
router.get("/flight-bookings", authenticateAdmin, async (req, res) => {
  try {
    const data = await FlightBooking.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      where: {
        [Op.or]: [
          { status: { [Op.in]: ["confirmed", "completed"] } },
          { payment_status: "paid" },
        ],
      },
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      limit: 30,
    });

    res.json(
      data.map((item) => ({
        date: item.dataValues.date,
        bookings: Number(item.dataValues.count || 0),
        revenue: Number(item.dataValues.revenue || 0),
      }))
    );
  } catch (error) {
    console.error("❌ Error /api/stats/flight-bookings:", error);
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
