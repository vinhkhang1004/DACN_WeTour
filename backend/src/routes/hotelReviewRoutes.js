import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { HotelReview, Hotel, User, HotelBooking } from "../models/index.js";
import { Op, Sequelize } from "sequelize";

const router = express.Router();

// ✅ Lấy danh sách đánh giá của khách sạn
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await HotelReview.findAndCountAll({
      where: { hotel_id: req.params.hotelId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    // Tính điểm trung bình
    const avgRating = await HotelReview.findOne({
      where: { hotel_id: req.params.hotelId },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("rating")), "avgRating"]
      ],
      raw: true
    });

    res.json({
      reviews: rows,
      total: count,
      averageRating: avgRating ? parseFloat(avgRating.avgRating || 0) : 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching hotel reviews:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Tạo đánh giá mới (cần đăng nhập)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { hotel_id, rating, comment, booking_id } = req.body;
    const user_id = req.user.id || req.user.userId;

    if (!hotel_id || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Đánh giá phải từ 1 đến 5 sao" });
    }

    // Kiểm tra khách sạn tồn tại
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Kiểm tra đã đánh giá chưa (nếu có booking_id thì check theo booking, không thì check theo user+hotel)
    let existingReview;
    if (booking_id) {
      existingReview = await HotelReview.findOne({
        where: {
          user_id,
          hotel_id,
          booking_id
        }
      });
    } else {
      existingReview = await HotelReview.findOne({
        where: {
          user_id,
          hotel_id
        }
      });
    }

    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá khách sạn này rồi" });
    }

    // Tạo đánh giá
    const review = await HotelReview.create({
      user_id,
      hotel_id,
      rating: parseInt(rating),
      comment: comment || null,
      booking_id: booking_id || null
    });

    // Cập nhật điểm trung bình của khách sạn
    await updateHotelRating(hotel_id);

    // Reload với user info
    const reviewWithUser = await HotelReview.findByPk(review.id, {
      include: [{ model: User, attributes: ["id", "name", "email"] }]
    });

    res.status(201).json({
      message: "Đánh giá thành công",
      review: reviewWithUser
    });
  } catch (error) {
    console.error("Error creating hotel review:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật đánh giá
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user_id = req.user.id || req.user.userId;

    const review = await HotelReview.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Chỉ cho phép user sở hữu đánh giá sửa
    if (parseInt(review.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    await review.update({
      rating: rating !== undefined ? parseInt(rating) : review.rating,
      comment: comment !== undefined ? comment : review.comment
    });

    // Cập nhật điểm trung bình của khách sạn
    await updateHotelRating(review.hotel_id);

    res.json({ message: "Cập nhật đánh giá thành công", review });
  } catch (error) {
    console.error("Error updating hotel review:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa đánh giá
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id || req.user.userId;

    const review = await HotelReview.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Chỉ cho phép user sở hữu đánh giá xóa
    if (parseInt(review.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này" });
    }

    const hotel_id = review.hotel_id;
    await review.destroy();

    // Cập nhật điểm trung bình của khách sạn
    await updateHotelRating(hotel_id);

    res.json({ message: "Xóa đánh giá thành công" });
  } catch (error) {
    console.error("Error deleting hotel review:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy đánh giá của user cho khách sạn
router.get("/user/:hotelId", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id || req.user.userId;
    const review = await HotelReview.findOne({
      where: {
        user_id,
        hotel_id: req.params.hotelId
      },
      include: [{ model: User, attributes: ["id", "name", "email"] }]
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function: Cập nhật điểm trung bình của khách sạn
async function updateHotelRating(hotelId) {
  try {
    const result = await HotelReview.findOne({
      where: { hotel_id: hotelId },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("rating")), "avgRating"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "reviewCount"]
      ],
      raw: true
    });

    const avgRating = result ? parseFloat(result.avgRating || 0) : 0;
    const reviewCount = result ? parseInt(result.reviewCount || 0) : 0;

    await Hotel.update(
      {
        user_score: avgRating
      },
      {
        where: { id: hotelId }
      }
    );

    console.log(`Updated hotel ${hotelId} rating: ${avgRating} (${reviewCount} reviews)`);
  } catch (error) {
    console.error("Error updating hotel rating:", error);
  }
}

export default router;

