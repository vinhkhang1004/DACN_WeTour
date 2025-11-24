import express from "express";
import { Conversation, Message, User } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

// Auto-reply message for first message
const AUTO_REPLY_MESSAGE = `Xin chào! Cảm ơn bạn đã liên hệ với WeTour. 😊

Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất. 

Trong thời gian chờ đợi, bạn có thể:
• Xem thông tin tour tại: /tours
• Gọi hotline: 1900 1234
• Email: support@wetour.vn

Chúng tôi luôn sẵn sàng hỗ trợ bạn! 🌴`;

// 📨 User: Gửi tin nhắn
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
    }


    // Tìm hoặc tạo conversation
    let conversation = null;
    try {
      conversation = await Conversation.findOne({
        where: { user_id, status: { [Op.in]: ["active", "resolved"] } },
        order: [["createdAt", "DESC"]]
      });
    } catch (dbError) {
      console.error("❌ Database error - tables may not exist:", dbError);
      return res.status(500).json({ 
        message: "Chat service chưa được cấu hình. Vui lòng chạy migration: database/migration_add_chat.sql" 
      });
    }

    if (!conversation) {
      // Tạo conversation mới
      conversation = await Conversation.create({
        user_id,
        status: "active",
        is_read_by_admin: false,
        is_read_by_user: true
      });
    } else {
      // Cập nhật status về active nếu đã resolved
      if (conversation.status === "resolved") {
        conversation.status = "active";
        conversation.is_read_by_admin = false;
        await conversation.save();
      }
    }

    // Lưu tin nhắn của user
    const userMessage = await Message.create({
      conversation_id: conversation.id,
      sender_id: user_id,
      sender_type: "user",
      content: content.trim(),
      is_read: false
    });

    // Kiểm tra xem đây có phải tin nhắn đầu tiên không
    const messageCount = await Message.count({
      where: { 
        conversation_id: conversation.id,
        sender_type: "user"
      }
    });

    let autoReplyMessage = null;
    
    // Nếu là tin nhắn đầu tiên, gửi auto-reply
    if (messageCount === 1) {
      autoReplyMessage = await Message.create({
        conversation_id: conversation.id,
        sender_id: null,
        sender_type: "system",
        content: AUTO_REPLY_MESSAGE,
        is_read: true
      });

      // Tạo notification cho admin
      try {
        const { Notification } = await import("../models/index.js");
        const admins = await User.findAll({ 
          where: { role: "admin" },
          attributes: ["id"]
        });
        
        for (const admin of admins) {
          await Notification.create({
            user_id: admin.id,
            title: "💬 Tin nhắn mới từ khách hàng",
            message: `Khách hàng ${req.user.name} vừa gửi tin nhắn: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: "chat",
            is_read: false
          });
        }
      } catch (notifError) {
        console.error("Error creating admin notifications:", notifError);
      }
    } else {
      // Tạo notification cho admin về tin nhắn mới
      try {
        const { Notification } = await import("../models/index.js");
        const admins = await User.findAll({ 
          where: { role: "admin" },
          attributes: ["id"]
        });
        
        for (const admin of admins) {
          await Notification.create({
            user_id: admin.id,
            title: "💬 Tin nhắn mới",
            message: `${req.user.name} đã gửi tin nhắn mới`,
            type: "chat",
            is_read: false
          });
        }
      } catch (notifError) {
        console.error("Error creating admin notifications:", notifError);
      }
    }

    // Cập nhật last_message_at và is_read_by_admin
    conversation.last_message_at = new Date();
    conversation.is_read_by_admin = false;
    conversation.is_read_by_user = true;
    await conversation.save();

    // Load tin nhắn với sender info
    const userMessageWithSender = await Message.findByPk(userMessage.id, {
      include: [{
        model: User,
        as: "Sender",
        attributes: ["id", "name", "email"],
        required: false
      }]
    });

    res.json({ 
      message: "Tin nhắn đã được gửi",
      userMessage: userMessageWithSender,
      autoReply: autoReplyMessage
    });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Check if it's a table not found error
    if (err.message && err.message.includes("doesn't exist")) {
      return res.status(500).json({ 
        message: "Database chưa được cấu hình. Vui lòng chạy migration: database/migration_add_chat.sql" 
      });
    }
    
    res.status(500).json({ 
      message: err.message || "Có lỗi xảy ra khi gửi tin nhắn",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 📥 User: Lấy conversation và messages
router.get("/conversation", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Tìm conversation
    let conversation = null;
    try {
      conversation = await Conversation.findOne({
        where: { user_id },
        order: [["createdAt", "DESC"]],
        include: [{
          model: User,
          attributes: ["id", "name", "email"]
        }]
      });
    } catch (dbError) {
      console.error("❌ Database error - tables may not exist:", dbError);
      return res.status(500).json({ 
        message: "Chat service chưa được cấu hình. Vui lòng chạy migration: database/migration_add_chat.sql",
        error: dbError.message 
      });
    }

    if (!conversation) {
      return res.json({ 
        conversation: null, 
        messages: [] 
      });
    }

    // Lấy tất cả messages
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

    // Đánh dấu messages là đã đọc
    await Message.update(
      { is_read: true },
      { 
        where: { 
          conversation_id: conversation.id,
          sender_type: { [Op.ne]: "user" }
        }
      }
    );

    conversation.is_read_by_user = true;
    await conversation.save();

    res.json({ 
      conversation,
      messages 
    });
  } catch (err) {
    console.error("❌ Error fetching conversation:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Check if it's a table not found error
    if (err.message && err.message.includes("doesn't exist")) {
      return res.status(500).json({ 
        message: "Database chưa được cấu hình. Vui lòng chạy migration: database/migration_add_chat.sql" 
      });
    }
    
    res.status(500).json({ 
      message: err.message || "Có lỗi xảy ra khi tải tin nhắn",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;

