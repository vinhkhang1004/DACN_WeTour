import express from "express";
import { Tour, Booking, User, Notification, Category } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { sendTourCompletionEmail } from "../utils/emailService.js";
import { sequelize, Op } from "../config/db.js";
import { normalizeSearchTerm, matchesSearch } from "../utils/vietnameseUtils.js";

const router = express.Router();

// ✅ Lấy danh sách tour với thống kê
router.get("/tours", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    
    const { search, sort, order, page, limit } = req.query;
    
    const where = {};
    const orderBy = [];
    if (sort) {
      orderBy.push([sort, order === "asc" ? "ASC" : "DESC"]);
    } else {
      orderBy.push(["created_at", "DESC"]);
    }
    
    const options = {
      where,
      order: orderBy,
      include: [{ model: Category, through: { attributes: [] } }]
    };
    
    if (limit) {
      options.limit = parseInt(limit);
      if (page) {
        options.offset = (parseInt(page) - 1) * parseInt(limit);
      }
    }
    
    let tours = await Tour.findAll(options);
    
    // Filter bằng cách bỏ dấu nếu có search term
    if (search && search.trim()) {
      const searchTerm = search.trim();
      tours = tours.filter(tour => {
        const nameMatch = matchesSearch(tour.name, searchTerm) || 
                          tour.name.toLowerCase().includes(searchTerm.toLowerCase());
        const destMatch = matchesSearch(tour.destination, searchTerm) || 
                         tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || destMatch;
      });
    }
    
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
    
    const { category_ids, ...tourData } = req.body;
    const tour = await Tour.create(tourData);
    
    // Add categories if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      await tour.setCategories(category_ids);
    }
    
    // Reload with categories
    await tour.reload({ include: [{ model: Category }] });
    
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
    
    const { category_ids, ...tourData } = req.body;
    console.log('Updating tour with data:', tourData);
    console.log('Category IDs:', category_ids);
    
    await tour.update(tourData);
    
    // Update categories if provided
    if (category_ids !== undefined) {
      if (Array.isArray(category_ids) && category_ids.length > 0) {
        await tour.setCategories(category_ids);
      } else {
        await tour.setCategories([]);
      }
    }
    
    console.log('Tour updated successfully');
    
    // Reload with categories
    await tour.reload({ include: [{ model: Category }] });
    
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

    // Send email when status changes
    if (oldStatus !== req.body.status) {
      try {
        // Determine recipient
        const recipient = booking.User || {
          name: booking.guest_name,
          email: booking.guest_email
        };

        if (recipient && recipient.email && booking.Tour) {
          if (req.body.status === "paid" || req.body.status === "confirmed") {
            // Send admin confirmation email
            const { sendTourAdminConfirmationEmail } = await import("../utils/emailService.js");
            await sendTourAdminConfirmationEmail(recipient, booking, booking.Tour);
            console.log(`✅ Admin confirmation email sent to ${recipient.email} for booking #${booking.id}`);
          } else if (req.body.status === "completed") {
            // Send completion email
            await sendTourCompletionEmail(recipient, booking, booking.Tour);
            console.log(`✅ Completion email sent to ${recipient.email} for booking #${booking.id}`);
          }
        } else {
          console.warn(`⚠️ Cannot send email: recipient or tour missing for booking #${booking.id}`);
        }
      } catch (emailError) {
        console.error("Error sending status change email:", emailError);
        // Continue even if email fails
      }
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Categories Management
// Get all categories
router.get("/categories", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create category
router.post("/categories", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const category = await Category.create(req.body);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update category
router.put("/categories/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });
    await category.update(req.body);
    res.json({ message: "Cập nhật thành công", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete category
router.delete("/categories/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền" });
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ message: "Đã xóa danh mục" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
