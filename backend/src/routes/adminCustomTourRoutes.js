import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { CustomTour, CustomTourActivity, Activity, User } from "../models/index.js";
import { sendEmailNotification } from "../utils/emailService.js";

const router = express.Router();

// Tất cả routes đều cần admin
router.use(verifyToken);

// ✅ Lấy danh sách custom tours (admin)
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await CustomTour.findAndCountAll({
      where,
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        },
        { model: User, required: false }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      tours: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching custom tours:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xác nhận custom tour (approve)
router.put("/:id/approve", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const { admin_notes } = req.body;
    const customTour = await CustomTour.findByPk(req.params.id, {
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        },
        { model: User, required: false }
      ]
    });
    
    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    
    await customTour.update({
      status: "approved",
      admin_notes: admin_notes || null
    });
    
    // Gửi email thông báo cho user
    try {
      const recipientEmail = customTour.User ? customTour.User.email : customTour.guest_email;
      const recipientName = customTour.User ? customTour.User.name : customTour.guest_name;
      
      if (recipientEmail) {
        const activitiesList = (customTour.Activities || [])
          .map((item, idx) => {
            const act = item.Activity;
            if (!act) return null;
            return `${idx + 1}. ${act.name} - ${act.duration_hours} giờ${act.price_per_person > 0 ? ` (${Number(act.price_per_person).toLocaleString()}₫/người)` : ''}`;
          })
          .filter(Boolean)
          .join('<br>');
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0E7490; margin-bottom: 20px;">🎉 Tour Tự Thiết Kế Của Bạn Đã Được Xác Nhận!</h2>
            
            <p>Xin chào <strong>${recipientName}</strong>,</p>
            
            <p>Chúng tôi rất vui thông báo rằng tour tự thiết kế của bạn đã được xác nhận và sẵn sàng để thực hiện!</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">📋 Thông tin tour:</h3>
              <p><strong>Điểm đến:</strong> ${customTour.destination}</p>
              <p><strong>Ngày đi:</strong> ${new Date(customTour.start_date).toLocaleDateString('vi-VN')}</p>
              <p><strong>Ngày về:</strong> ${new Date(customTour.end_date).toLocaleDateString('vi-VN')}</p>
              <p><strong>Số người:</strong> ${customTour.adults} người lớn, ${customTour.children} trẻ em</p>
              <p><strong>Loại hình:</strong> ${customTour.tour_type}</p>
              <p><strong>Chi phí ước tính:</strong> ${Number(customTour.estimated_cost).toLocaleString()}₫</p>
              <p><strong>Tổng thời gian:</strong> ${Number(customTour.total_hours).toFixed(1)} giờ</p>
            </div>
            
            ${activitiesList ? `
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">🎯 Lịch trình tour:</h3>
              ${activitiesList}
            </div>
            ` : ''}
            
            ${customTour.admin_notes ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📝 Ghi chú từ admin:</strong></p>
              <p style="margin: 5px 0 0;">${customTour.admin_notes}</p>
            </div>
            ` : ''}
            
            <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận chi tiết và hướng dẫn thanh toán.</p>
            
            <p>Bạn có thể xem chi tiết tour trong phần <strong>"Lịch sử đặt tour"</strong> trên website.</p>
            
            <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ WeTour</strong></p>
          </div>
        `;
        
        await sendEmailNotification(
          recipientEmail,
          "🎉 Tour Tự Thiết Kế Của Bạn Đã Được Xác Nhận - WeTour",
          emailHtml
        );
        
        console.log(`✅ Email sent to ${recipientEmail} for approved custom tour #${customTour.id}`);
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Không fail request nếu email lỗi
    }
    
    res.json({ message: "Đã xác nhận tour thành công", tour: customTour });
  } catch (error) {
    console.error("Error approving custom tour:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Từ chối custom tour (reject)
router.put("/:id/reject", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const { admin_notes } = req.body;
    const customTour = await CustomTour.findByPk(req.params.id, {
      include: [{ model: User, required: false }]
    });
    
    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    
    await customTour.update({
      status: "rejected",
      admin_notes: admin_notes || null
    });
    
    // Gửi email thông báo cho user
    try {
      const recipientEmail = customTour.User ? customTour.User.email : customTour.guest_email;
      const recipientName = customTour.User ? customTour.User.name : customTour.guest_name;
      
      if (recipientEmail) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">Thông báo về tour tự thiết kế</h2>
            
            <p>Xin chào <strong>${recipientName}</strong>,</p>
            
            <p>Chúng tôi rất tiếc thông báo rằng tour tự thiết kế của bạn tại <strong>${customTour.destination}</strong> đã không được chấp nhận.</p>
            
            ${customTour.admin_notes ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📝 Lý do:</strong></p>
              <p style="margin: 5px 0 0;">${customTour.admin_notes}</p>
            </div>
            ` : ''}
            
            <p>Bạn có thể thiết kế lại tour mới hoặc liên hệ với chúng tôi để được tư vấn thêm.</p>
            
            <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ WeTour</strong></p>
          </div>
        `;
        
        await sendEmailNotification(
          recipientEmail,
          "Thông báo về tour tự thiết kế - WeTour",
          emailHtml
        );
        
        console.log(`✅ Rejection email sent to ${recipientEmail} for custom tour #${customTour.id}`);
      }
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Không fail request nếu email lỗi
    }
    
    res.json({ message: "Đã từ chối tour", tour: customTour });
  } catch (error) {
    console.error("Error rejecting custom tour:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết custom tour (admin)
router.get("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const customTour = await CustomTour.findByPk(req.params.id, {
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        },
        { model: User, required: false }
      ]
    });
    
    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    
    res.json(customTour);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

