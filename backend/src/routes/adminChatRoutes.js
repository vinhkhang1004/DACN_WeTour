import express from "express";
import { Conversation, Message, User } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

// 📋 Admin: Lấy tất cả conversations
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const { count, rows: conversations } = await Conversation.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ["id", "name", "email"]
      }],
      order: [["last_message_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    // Lấy số tin nhắn chưa đọc cho mỗi conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversation_id: conv.id,
            sender_type: "user",
            is_read: false
          }
        });

        return {
          ...conv.toJSON(),
          unread_count: unreadCount
        };
      })
    );

    res.json({
      conversations: conversationsWithUnread,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: err.message });
  }
});

// 💬 Admin: Lấy messages của một conversation
router.get("/conversations/:id/messages", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const conversation = await Conversation.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ["id", "name", "email"]
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy conversation" });
    }

    const messages = await Message.findAll({
      where: { conversation_id: conversation.id },
      include: [{
        model: User,
        as: "Sender",
        attributes: ["id", "name", "email"],
        required: false
      }],
      order: [["createdAt", "ASC"]]
    });

    // Đánh dấu messages là đã đọc bởi admin
    await Message.update(
      { is_read: true },
      { 
        where: { 
          conversation_id: conversation.id,
          sender_type: "user"
        }
      }
    );

    conversation.is_read_by_admin = true;
    await conversation.save();

    res.json({ 
      conversation,
      messages 
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✉️ Admin: Trả lời tin nhắn
router.post("/reply", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { conversation_id, content } = req.body;

    if (!conversation_id || !content || !content.trim()) {
      return res.status(400).json({ message: "conversation_id và content là bắt buộc" });
    }

    const conversation = await Conversation.findByPk(conversation_id, {
      include: [{
        model: User,
        attributes: ["id", "name", "email"]
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy conversation" });
    }

    // Tạo tin nhắn từ admin
    const adminMessage = await Message.create({
      conversation_id: conversation.id,
      sender_id: req.user.id,
      sender_type: "admin",
      content: content.trim(),
      is_read: false
    });

    // Cập nhật conversation
    conversation.last_message_at = new Date();
    conversation.is_read_by_user = false;
    conversation.is_read_by_admin = true;
    conversation.status = "active";
    await conversation.save();

    // Tạo notification cho user
    try {
      const { Notification } = await import("../models/index.js");
      await Notification.create({
        user_id: conversation.user_id,
        title: "💬 Phản hồi từ hỗ trợ",
        message: `Bạn có tin nhắn mới từ đội ngũ hỗ trợ: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        type: "chat",
        is_read: false
      });
    } catch (notifError) {
      console.error("Error creating user notification:", notifError);
    }

    // Load tin nhắn với sender info
    const adminMessageWithSender = await Message.findByPk(adminMessage.id, {
      include: [{
        model: User,
        as: "Sender",
        attributes: ["id", "name", "email"],
        required: false
      }]
    });

    res.json({ 
      message: "Tin nhắn đã được gửi",
      adminMessage: adminMessageWithSender
    });
  } catch (err) {
    console.error("Error sending admin reply:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin: Cập nhật status conversation
router.put("/conversations/:id/status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { status } = req.body;
    if (!["active", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy conversation" });
    }

    conversation.status = status;
    await conversation.save();

    res.json({ message: "Đã cập nhật status", conversation });
  } catch (err) {
    console.error("Error updating conversation status:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

