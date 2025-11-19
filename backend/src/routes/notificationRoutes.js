import express from "express";
import { Notification } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// List current user's notifications (include broadcasts)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await Notification.findAll({
      where: { },
      order: [["created_at", "DESC"]],
    });
    // Filter: either assigned to user or broadcast (null)
    const filtered = list.filter(n => n.user_id === null || n.user_id === userId);
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Mark as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif) return res.status(404).json({ message: "Not found" });
    if (notif.user_id && notif.user_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await notif.update({ is_read: true });
    res.json({ message: "OK" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Mark all as read
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await Notification.findAll();
    const filtered = list.filter(n => n.user_id === null || n.user_id === userId);
    await Promise.all(filtered.map(n => n.update({ is_read: true })));
    res.json({ message: "OK" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create notification (admin or system) — simplified: trust token role
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { user_id = null, title, message, type = "info" } = req.body;
    if (!title || !message) return res.status(400).json({ message: "title and message required" });
    const notif = await Notification.create({ user_id, title, message, type, is_read: false, created_at: new Date() });
    res.status(201).json(notif);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


