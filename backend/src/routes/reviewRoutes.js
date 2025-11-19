import express from "express";
import { Review, Tour, User, Booking } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET reviews for a tour
router.get("/tour/:tourId", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { tour_id: req.params.tourId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create review (only if user has completed booking)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { tour_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // Check if user has completed booking for this tour
    const completedBooking = await Booking.findOne({
      where: {
        user_id,
        tour_id,
        status: "completed",
      },
    });

    if (!completedBooking) {
      return res.status(403).json({
        message: "Bạn chỉ có thể đánh giá tour đã hoàn thành",
      });
    }

    // Check if user already reviewed this tour
    const existingReview = await Review.findOne({
      where: { user_id, tour_id },
    });

    if (existingReview) {
      return res.status(400).json({
        message: "Bạn đã đánh giá tour này rồi",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Đánh giá phải từ 1 đến 5 sao",
      });
    }

    const review = await Review.create({
      user_id,
      tour_id,
      rating,
      comment: comment || "",
    });

    const reviewWithUser = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.status(201).json(reviewWithUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update review
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    if (review.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa đánh giá này",
      });
    }

    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Đánh giá phải từ 1 đến 5 sao",
      });
    }

    await review.update({
      rating: rating || review.rating,
      comment: comment !== undefined ? comment : review.comment,
    });

    const updatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE review
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    if (review.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    await review.destroy();
    res.json({ message: "Đã xóa đánh giá" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET average rating for a tour
router.get("/tour/:tourId/rating", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { tour_id: req.params.tourId },
      attributes: ["rating"],
    });

    if (reviews.length === 0) {
      return res.json({ average: 0, count: 0 });
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / reviews.length;

    res.json({
      average: Math.round(average * 10) / 10,
      count: reviews.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;




