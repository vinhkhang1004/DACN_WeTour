import express from "express";
import { User, LoyaltyTransaction } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get current user's loyalty info
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "loyaltyPoints", "loyaltyTier"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await LoyaltyTransaction.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    res.json({ user, transactions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Earn points (admin/staff)
router.post("/earn", verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { userId, points, description } = req.body;
    const target = await User.findByPk(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const newPoints = (target.loyaltyPoints || 0) + Math.max(0, parseInt(points, 10) || 0);
    await target.update({ loyaltyPoints: newPoints });

    await LoyaltyTransaction.create({
      user_id: target.id,
      type: "earn",
      points: Math.max(0, parseInt(points, 10) || 0),
      description: description || "Earned points",
    });

    res.json({ message: "Points added", loyaltyPoints: newPoints });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Spend points (self)
router.post("/spend", verifyToken, async (req, res) => {
  try {
    const { points, description } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const spend = Math.max(0, parseInt(points, 10) || 0);
    if ((user.loyaltyPoints || 0) < spend) {
      return res.status(400).json({ message: "Not enough points" });
    }

    const newPoints = (user.loyaltyPoints || 0) - spend;
    await user.update({ loyaltyPoints: newPoints });

    await LoyaltyTransaction.create({
      user_id: user.id,
      type: "spend",
      points: spend,
      description: description || "Spent points",
    });

    res.json({ message: "Points spent", loyaltyPoints: newPoints });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


