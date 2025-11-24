import express from "express";
import { Tour, Booking, User, Notification } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { sendTourCompletionEmail } from "../utils/emailService.js";
import { sequelize, Op } from "../config/db.js";

const router = express.Router();

// ✅ Lấy danh sách tour với thống kê
router.get("/tours", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    
    const { search, sort, order, page, limit } = req.query;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const orderBy = [];
    if (sort) {
      orderBy.push([sort, order === "asc" ? "ASC" : "DESC"]);
    } else {
      orderBy.push(["created_at", "DESC"]);
    }
    
    const options = {
      where,
      order: orderBy
    };
    
    if (limit) {
      options.limit = parseInt(limit);
      if (page) {
        options.offset = (parseInt(page) - 1) * parseInt(limit);
      }
    }
    
    const tours = await Tour.findAll(options);
    
    // Tính thống kê cho mỗi tour
    const toursWithStats = await Promise.all(
      tours.map(async (tour) => {
        const bookingsCount = await Booking.count({
          where: { tour_id: tour.id }
        });
        
        const tourData = tour.toJSON();
        return {
          ...tourData,
          bookings_count: bookingsCount,
          views: tourData.views || 0
        };
      })
    );
    
    res.json(toursWithStats);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách tour" });
  }
});

// ✅ Thêm tour mới
router.post("/tours", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const tour = await Tour.create(req.body);
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Cập nhật tour
router.put("/tours/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const tour = await Tour.findByPk(req.params.id);
    if (!tour) return res.status(404).json({ message: "Không tìm thấy tour" });
    
    console.log('Updating tour with data:', req.body);
    await tour.update(req.body);
    console.log('Tour updated successfully');
    
    res.json({ message: "Cập nhật thành công", tour });
  } catch (err) {
    console.error('Error updating tour:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Cập nhật trạng thái tour
router.put("/tours/:id/status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const tour = await Tour.findByPk(req.params.id);
    if (!tour) return res.status(404).json({ message: "Không tìm thấy tour" });
    await tour.update({ status: req.body.status });
    res.json({ message: "Cập nhật trạng thái thành công", tour });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Xóa tour
router.delete("/tours/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    await Tour.destroy({ where: { id: req.params.id } });
    res.json({ message: "Đã xóa tour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Danh sách đặt tour
router.get("/bookings", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
  const { limit, sort } = req.query;
  const options = {
    include: [
      { model: Tour },
      { 
        model: User,
        required: false // Cho phép NULL user_id (guest bookings)
      }
    ],
    order: [["id", "DESC"]]
    // Sequelize sẽ tự động trả về tất cả các fields của Booking model, bao gồm notes, guest_name, guest_phone, guest_email
  };
  if (limit) options.limit = parseInt(limit);
  const list = await Booking.findAll(options);
  res.json(list);
});

// ✅ Cập nhật trạng thái booking
router.put("/bookings/status/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Tour }, { model: User }]
    });
    if (!booking) return res.status(404).json({ message: "Không tìm thấy" });
    
    const oldStatus = booking.status;
    booking.status = req.body.status;
    await booking.save();

    // Send notification to user when booking status changes
    try {
      if (oldStatus !== req.body.status) {
        let notificationTitle = "";
        let notificationMessage = "";
        
        if (req.body.status === "paid") {
          notificationTitle = "✅ Tour đã được duyệt!";
          notificationMessage = `Đặt tour "${booking.Tour?.name || 'Tour'}" (Mã: #${booking.id}) đã được duyệt thành công. Chúc bạn có chuyến đi vui vẻ!`;
        } else if (req.body.status === "completed") {
          notificationTitle = "🌟 Tour đã hoàn thành!";
          notificationMessage = `Tour "${booking.Tour?.name || 'Tour'}" (Mã: #${booking.id}) đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!`;
        } else if (req.body.status === "cancelled") {
          notificationTitle = "❌ Tour đã bị hủy";
          notificationMessage = `Đặt tour "${booking.Tour?.name || 'Tour'}" (Mã: #${booking.id}) đã bị hủy. Vui lòng liên hệ để được hỗ trợ.`;
        }
        
        if (notificationTitle && booking.User) {
          await Notification.create({
            user_id: booking.User.id,
            title: notificationTitle,
            message: notificationMessage,
            type: "status_change",
            is_read: false
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating status change notification:", notifError);
    }

    // Send tour completion email if status changed to "completed"
    if (oldStatus !== "completed" && req.body.status === "completed") {
      try {
        if (booking.User && booking.Tour) {
          await sendTourCompletionEmail(booking.User, booking, booking.Tour);
        } else {
          console.warn("⚠️ Cannot send completion email: user or tour missing");
        }
      } catch (emailError) {
        console.error("Error sending completion email:", emailError);
        // Continue even if email fails
      }
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
