import express from "express";
import { Booking, Tour, Payment, Promotion, Notification, User } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";
import { sendBookingConfirmationEmail, sendPaymentConfirmationEmail, sendTourCompletionEmail, sendBookingCancellationEmail } from "../utils/emailService.js";

const router = express.Router();

// Helper function để tạo booking (dùng chung cho cả user và guest)
const createBookingHandler = async (req, res, isGuest = false) => {
  try {
    const { 
      tour_id, 
      people_count, 
      booking_date, 
      payment_method, 
      promotion_code, 
      notes,
      // Guest fields
      guest_name,
      guest_phone,
      guest_email
    } = req.body;

    // Validate guest fields nếu là guest
    if (isGuest) {
      if (!guest_name || !guest_phone) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ Họ tên và Số điện thoại" });
      }
      if (!guest_email) {
        return res.status(400).json({ message: "Vui lòng điền Email để nhận thông báo" });
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guest_email)) {
        return res.status(400).json({ message: "Email không hợp lệ" });
      }
    }

    const user_id = isGuest ? null : req.user.id;
    const customerName = isGuest ? guest_name : req.user.name;
    const customerEmail = isGuest ? guest_email : (req.user.email || null);

    const tour = await Tour.findByPk(tour_id);
    if (!tour) return res.status(404).json({ message: "Tour không tồn tại" });

    // Validate people count
    if (people_count <= 0) {
      return res.status(400).json({ message: "Số người phải lớn hơn 0" });
    }
    
    // Check max_people limit if set
    if (tour.max_people && people_count > tour.max_people) {
      return res.status(400).json({ 
        message: `Số người tối đa cho tour này là ${tour.max_people} người` 
      });
    }

    // Validate booking_date with available_dates or departure_date
    let availableDates = [];
    if (tour.available_dates) {
      try {
        availableDates = JSON.parse(tour.available_dates);
        if (!Array.isArray(availableDates)) availableDates = [];
      } catch {
        availableDates = [];
      }
    }
    
    // Lọc bỏ các ngày đã qua
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    availableDates = availableDates.filter(d => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    });
    
    if (availableDates.length > 0) {
      // Check if booking_date is in available_dates
      const bookingDateStr = booking_date.split('T')[0]; // Get YYYY-MM-DD format
      if (!availableDates.includes(bookingDateStr)) {
        const formattedDates = availableDates.map(d => new Date(d).toLocaleDateString('vi-VN')).join(', ');
        return res.status(400).json({ 
          message: `Ngày đi phải là một trong các ngày: ${formattedDates}` 
        });
      }
    } else if (tour.departure_date) {
      // Fallback validation for backward compatibility
      const departureDate = new Date(tour.departure_date);
      const bookingDate = new Date(booking_date);
      
      // Set time to 00:00:00 for comparison
      departureDate.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        return res.status(400).json({ 
          message: "Ngày khởi hành đã qua" 
        });
      }
      
      if (bookingDate.getTime() !== departureDate.getTime()) {
        return res.status(400).json({ 
          message: `Ngày đi phải là ${departureDate.toLocaleDateString('vi-VN')}` 
        });
      }
    }

    let total_price = tour.price * people_count;
    let discount_amount = 0;
    let promotion_id = null;

    // Apply promotion if code provided
    if (promotion_code) {
      const promotion = await Promotion.findOne({
        where: {
          code: promotion_code.toUpperCase(),
          is_active: true,
          valid_from: { [Op.lte]: new Date() },
          valid_to: { [Op.gte]: new Date() }
        }
      });

      if (promotion) {
        // Check usage limit
        if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
          return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
        }

        // Check minimum amount
        if (promotion.min_amount > total_price) {
          return res.status(400).json({ 
            message: `Đơn hàng tối thiểu ${promotion.min_amount.toLocaleString()} ₫ để sử dụng mã này` 
          });
        }

        // Calculate discount
        if (promotion.discount_type === "percentage") {
          discount_amount = (total_price * promotion.discount_value) / 100;
          if (promotion.max_discount && discount_amount > promotion.max_discount) {
            discount_amount = promotion.max_discount;
          }
        } else {
          discount_amount = promotion.discount_value;
        }

        total_price = total_price - discount_amount;
        promotion_id = promotion.id;

        // Update promotion usage count
        await promotion.update({
          usage_count: promotion.usage_count + 1
        });
      } else {
        return res.status(400).json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn" });
      }
    }

    const booking = await Booking.create({
      user_id,
      tour_id,
      people_count,
      total_price,
      discount_amount,
      booking_date,
      status: "pending",
      promotion_id,
      notes: notes || null,
      guest_name: isGuest ? guest_name : null,
      guest_phone: isGuest ? guest_phone : null,
      guest_email: isGuest ? guest_email : null,
    });

    // Create payment record if payment method is provided
    if (payment_method) {
      await Payment.create({
        booking_id: booking.id,
        method: payment_method,
        amount: total_price,
        status: "pending",
      });
    }

    // Create notification for customer (chỉ nếu có user_id)
    if (user_id) {
      try {
        await Notification.create({
          user_id: user_id,
          title: "🎉 Đặt tour thành công!",
          message: `Bạn đã đặt tour "${tour.name}" thành công. Vui lòng chờ xác nhận từ chúng tôi.`,
          type: "booking",
          is_read: false
        });
      } catch (notifError) {
        console.error("Error creating user notification:", notifError);
      }
    }

    // Create notification for all admins
    try {
      const admins = await User.findAll({ 
        where: { role: "admin" },
        attributes: ["id"]
      });
      for (const admin of admins) {
        await Notification.create({
          user_id: admin.id,
          title: "📋 Có đơn đặt tour mới",
          message: `${isGuest ? 'Khách chưa đăng nhập' : customerName} vừa đặt tour "${tour.name}" - ${people_count} người`,
          type: "booking",
          is_read: false
        });
      }
    } catch (notifError) {
      console.error("Error creating admin notifications:", notifError);
    }

    // Send booking confirmation email
    try {
      if (customerEmail) {
        console.log(`📧 Attempting to send booking confirmation email to: ${customerEmail}`);
        
        // Tạo object user tạm cho guest
        const emailUser = isGuest ? {
          id: null,
          name: guest_name,
          email: guest_email
        } : await User.findByPk(req.user.id, {
          attributes: ['id', 'name', 'email']
        });
        
        if (emailUser) {
          const emailResult = await sendBookingConfirmationEmail(emailUser, booking, tour);
          
          if (emailResult.success) {
            console.log(`✅ Booking confirmation email sent successfully to ${customerEmail}`);
          } else {
            console.error(`❌ Failed to send booking confirmation email: ${emailResult.error}`);
          }
        }
      } else {
        console.warn(`⚠️ Cannot send booking email: email missing`);
      }
    } catch (emailError) {
      console.error("❌ Error sending booking email:", emailError);
    }

    res.json({ 
      message: "Đặt tour thành công!", 
      booking: {
        ...booking.toJSON(),
        original_price: tour.price * people_count,
        discount_amount,
        final_price: total_price
      }
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🧾 API tạo booking mới (User đã đăng nhập)
router.post("/", verifyToken, async (req, res) => {
  await createBookingHandler(req, res, false);
});

// 🧾 API tạo booking mới (Guest chưa đăng nhập)
router.post("/guest", async (req, res) => {
  await createBookingHandler(req, res, true);
});

// 📋 API xem danh sách booking của user
router.get("/my", verifyToken, async (req, res) => {
  try {
    const list = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Tour },
        { 
          model: Promotion, 
          required: false,
          attributes: ["id", "title", "code", "discount_type", "discount_value"]
        }
      ],
      order: [["id", "DESC"]],
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ❌ API hủy booking (nếu còn pending)
router.put("/cancel/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Tour }, { model: User }]
    });
    
    if (!booking) return res.status(404).json({ message: "Không tìm thấy booking" });

    if (booking.user_id && booking.user_id !== req.user.id)
      return res.status(403).json({ message: "Không thể hủy booking của người khác" });

    if (booking.status !== "pending")
      return res.status(400).json({ message: "Chỉ có thể hủy tour đang chờ xác nhận" });

    booking.status = "cancelled";
    await booking.save();

    // Send notification to user when booking is cancelled (chỉ nếu có user_id)
    if (booking.user_id) {
      try {
        await Notification.create({
          user_id: booking.user_id,
          title: "❌ Đã hủy đặt tour",
          message: `Đặt tour "${booking.Tour?.name || 'Tour'}" (Mã: #${booking.id}) đã được hủy thành công.`,
          type: "cancellation",
          is_read: false
        });
      } catch (notifError) {
        console.error("Error creating cancellation notification:", notifError);
      }
    }

    // Send cancellation email
    try {
      const emailUser = booking.user_id ? booking.User : {
        id: null,
        name: booking.guest_name,
        email: booking.guest_email
      };
      
      if (emailUser && emailUser.email && booking.Tour) {
        await sendBookingCancellationEmail(emailUser, booking, booking.Tour);
      }
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
    }

    res.json({ message: "Đã hủy tour thành công", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 💳 API cập nhật trạng thái thanh toán (sẽ dùng cho MoMo / VNPay)
router.put("/payment/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Tour }, { model: User }]
    });
    if (!booking) return res.status(404).json({ message: "Không tìm thấy booking" });

    if (booking.user_id && booking.user_id !== req.user.id)
      return res.status(403).json({ message: "Không thể thanh toán tour của người khác" });

    booking.status = "paid";
    await booking.save();

    // Update payment status if exists
    const payment = await Payment.findOne({ where: { booking_id: booking.id } });
    if (payment) {
      payment.status = "success";
      await payment.save();
    }

    // Send payment confirmation email
    try {
      const emailUser = booking.user_id ? booking.User : {
        id: null,
        name: booking.guest_name,
        email: booking.guest_email
      };
      
      if (emailUser && emailUser.email && booking.Tour) {
        await sendPaymentConfirmationEmail(
          emailUser, 
          booking, 
          booking.Tour, 
          payment || { method: 'cash', amount: booking.total_price, transaction_code: null }
        );
      }
    } catch (emailError) {
      console.error("Error sending payment email:", emailError);
    }

    res.json({ message: "Đã thanh toán thành công!", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
