import express from "express";
import { Tour, Review, User, Booking, Category } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { sequelize, Op } from "../config/db.js";
import { normalizeSearchTerm, matchesSearch } from "../utils/vietnameseUtils.js";

const router = express.Router();

// GET all tours with search and filters
router.get("/", async (req, res) => {
  try {
    const { q, suggest, search, destination, minPrice, maxPrice } = req.query;
    const where = {};
    
    // Lấy search term từ các query params khác nhau
    const searchTerm = (q || suggest || search || "").trim();
    
    // Filter theo destination
    if (destination) where.destination = destination;
    
    // Filter theo price
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = +minPrice;
      if (maxPrice) where.price[Op.lte] = +maxPrice;
    }
    
    // Lấy tất cả tours (hoặc đã filter theo destination/price)
    let tours = await Tour.findAll({ 
      where,
      include: [
        {
          model: Review,
          attributes: ["rating"],
          required: false,
        },
        {
          model: Category,
          attributes: ["id", "name"],
          through: { attributes: [] },
          required: false,
        }
      ],
      order: [["id", "DESC"]],
    });
    
    // Nếu có search term, filter bằng cách bỏ dấu
    if (searchTerm) {
      tours = tours.filter(tour => {
        // Tìm trong name và destination (có dấu và không dấu)
        const nameMatch = matchesSearch(tour.name, searchTerm);
        const destMatch = matchesSearch(tour.destination, searchTerm);
        
        // Cũng tìm trong description nếu có
        const descMatch = tour.description ? matchesSearch(tour.description, searchTerm) : false;
        
        return nameMatch || destMatch || descMatch;
      });
    }
    
    // Tính averageRating cho mỗi tour
    const toursWithRating = tours.map(tour => {
      const tourData = tour.toJSON();
      const reviews = tour.Reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      return {
        ...tourData,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });
    
    res.json(toursWithRating);
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
    // Tính số khách đặt trong 24h gần nhất (dựa vào booking_date hoặc id nếu không có created_at)
    // Vì Booking model không có created_at, ta sẽ dùng booking_date >= hôm nay làm xấp xỉ
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    // Lấy tất cả booking từ hôm nay trở đi (xấp xỉ 24h gần nhất)
    // Tính tổng số người (people_count) thay vì chỉ đếm số booking
    const rows = await Booking.findAll({
      attributes: [
        "tour_id",
        [sequelize.fn("SUM", sequelize.col("people_count")), "total_people"],
        [sequelize.fn("COUNT", sequelize.col("id")), "booking_count"],
      ],
      where: {
        booking_date: { [Op.gte]: todayStr },
        status: { [Op.ne]: "cancelled" }, // Không tính các booking đã hủy
      },
      group: ["tour_id"],
      raw: true,
    });

    const counts = {};
    rows.forEach((r) => {
      // Sử dụng total_people (tổng số người) thay vì booking_count
      const totalPeople = Number(r.total_people || 0);
      counts[r.tour_id] = totalPeople;
    });
    
    res.json(counts);
  } catch (e) {
    console.error("Error in /stats/recent-bookings:", e);
    res.status(500).json({ message: e.message });
  }
});
