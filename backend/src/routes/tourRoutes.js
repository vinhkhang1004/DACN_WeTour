import express from "express";
import { Tour, Review, User, Booking } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { sequelize, Op } from "../config/db.js";

const router = express.Router();

// GET all tours with search and filters
router.get("/", async (req, res) => {
  try {
    const { q, suggest, destination, minPrice, maxPrice } = req.query;
    const where = {};
    
    // Tìm kiếm: ưu tiên tên tour, sau đó mới đến destination
    if (q || suggest) {
      const searchTerm = (q || suggest).trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { destination: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    if (destination) where.destination = destination;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = +minPrice;
      if (maxPrice) where.price[Op.lte] = +maxPrice;
    }
    
    const tours = await Tour.findAll({ 
      where,
      order: [["id", "DESC"]],
    });
    res.json(tours);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET one with reviews
router.get("/:id", async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: Review,
          include: [
            {
              model: User,
              attributes: ["id", "name", "email"],
            },
          ],
          order: [["created_at", "DESC"]],
        },
      ],
    });
    if (!tour) return res.status(404).json({ message: "Không tìm thấy tour" });
    
    // Calculate average rating
    const reviews = tour.Reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    res.json({
      ...tour.toJSON(),
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// CREATE (Admin only)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });

    const { name, destination, price, duration, description, image } = req.body;
    const newTour = await Tour.create({ name, destination, price, duration, description, image });
    res.status(201).json(newTour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE (Admin only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour không tồn tại" });

    await tour.update(req.body);
    res.json({ message: "Cập nhật thành công", tour });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour không tồn tại" });

    await tour.destroy();
    res.json({ message: "Đã xóa tour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

// Extra stats: recent bookings per tour (last 24h)
router.get("/stats/recent-bookings", async (req, res) => {
  try {
    // Because booking_date is DATEONLY, approximate last 24h as booking_date >= yesterday
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
    const dd = String(yesterday.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const rows = await Booking.findAll({
      attributes: [
        "tour_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        booking_date: { [Op.gte]: dateStr },
      },
      group: ["tour_id"],
    });

    const counts = {};
    rows.forEach((r) => {
      counts[r.tour_id] = Number(r.get("count"));
    });
    res.json(counts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
