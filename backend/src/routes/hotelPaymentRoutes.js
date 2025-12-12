import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { HotelBooking, Hotel, User } from "../models/index.js";
import {
  createMoMoPaymentUrl,
  verifyMoMoCallback,
} from "../utils/paymentService.js";
import { sendHotelPaymentConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

/**
 * Tạo payment URL cho MoMo (Hotel Booking)
 */
router.post("/momo/create", verifyToken, async (req, res) => {
  try {
    const { hotel_booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!hotel_booking_id) {
      return res.status(400).json({ message: "Thiếu hotel_booking_id" });
    }

    const booking = await HotelBooking.findByPk(parseInt(hotel_booking_id), {
      include: [{ model: Hotel }, { model: User }]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    // Kiểm tra quyền: nếu booking có user_id thì phải khớp với user hiện tại
    // Nếu booking là guest booking (không có user_id), cho phép thanh toán
    if (booking.user_id) {
      if (parseInt(booking.user_id) !== user_id) {
        return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
      }
    }
    // Guest booking không cần kiểm tra user_id

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Đặt phòng này không thể thanh toán" });
    }

    const amount = parseFloat(booking.total_price || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    const orderId = `MOMOHB${booking.id}${Date.now()}`;
    const orderInfo = `Thanh toan dat phong khach san ${booking.Hotel?.name || "Hotel"} - Booking #${booking.id}`;

    console.log("\n=== Creating MoMo Payment URL for Hotel Booking ===");
    console.log("Hotel Booking ID:", booking.id);
    console.log("Amount:", amount);
    console.log("Order ID:", orderId);

    const momoResponse = await createMoMoPaymentUrl(orderId, amount, orderInfo);

    if (momoResponse.payUrl) {
      console.log("MoMo Payment URL created successfully");
      res.json({
        success: true,
        paymentUrl: momoResponse.payUrl,
        orderId,
        amount
      });
    } else {
      console.error("MoMo payment creation failed:", momoResponse);
      res.status(500).json({ message: "Không thể tạo link thanh toán MoMo" });
    }
  } catch (error) {
    console.error("Error creating MoMo payment for hotel booking:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * MoMo Callback Handler (Hotel Booking)
 */
router.get("/momo-callback", async (req, res) => {
  try {
    const params = req.query;

    if (verifyMoMoCallback(params)) {
      const orderId = params.orderId;
      const resultCode = params.resultCode;

      // Extract booking ID from orderId (format: MOMOHB{bookingId}{timestamp})
      const bookingIdMatch = orderId.match(/MOMOHB(\d+)/);
      if (!bookingIdMatch) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
      }

      const bookingId = parseInt(bookingIdMatch[1]);
      const booking = await HotelBooking.findByPk(bookingId, {
        include: [{ model: Hotel }, { model: User }]
      });

      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
      }

      if (resultCode === 0) {
        // Payment success - giữ status là "pending" để admin xác nhận
        // Không tự động set thành "confirmed"
        // await booking.save(); // Không cần update status

        // Send confirmation email
        try {
          const recipient = booking.User || {
            name: booking.guest_name,
            email: booking.guest_email
          };
          
          if (recipient && recipient.email && booking.Hotel) {
            await sendHotelPaymentConfirmationEmail(
              recipient,
              booking,
              booking.Hotel,
              {
                method: "momo",
                amount: booking.total_price,
                transaction_code: params.transId || orderId,
                status: "success"
              }
            );
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=momo&type=hotel`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=momo&type=hotel&message=${encodeURIComponent(params.message || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing MoMo callback for hotel booking:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * Thanh toán bằng tiền mặt (Hotel Booking)
 */
router.post("/cash", verifyToken, async (req, res) => {
  try {
    const { hotel_booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!hotel_booking_id) {
      return res.status(400).json({ message: "Thiếu hotel_booking_id" });
    }

    const booking = await HotelBooking.findByPk(parseInt(hotel_booking_id), {
      include: [{ model: Hotel }, { model: User }]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    // Kiểm tra quyền: nếu booking có user_id thì phải khớp với user hiện tại
    // Nếu booking là guest booking (không có user_id), cho phép thanh toán
    if (booking.user_id) {
      if (parseInt(booking.user_id) !== user_id) {
        return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
      }
    }
    // Guest booking không cần kiểm tra user_id

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Đặt phòng này không thể thanh toán" });
    }

    // Thanh toán tiền mặt thành công - giữ status là "pending" để admin xác nhận
    // Không tự động set thành "confirmed"
    // await booking.update({ status: "confirmed" }); // Chỉ admin mới có thể xác nhận

    // Gửi email xác nhận
    try {
      const recipient = booking.User || {
        name: booking.guest_name,
        email: booking.guest_email
      };
      
      if (recipient && recipient.email && booking.Hotel) {
        await sendHotelPaymentConfirmationEmail(
          recipient,
          booking,
          booking.Hotel,
          {
            method: "cash",
            amount: booking.total_price,
            transaction_code: null,
            status: "success"
          }
        );
      }
    } catch (emailError) {
      console.error("Error sending payment email:", emailError);
    }

    res.json({ 
      message: "Đã xác nhận thanh toán tiền mặt thành công!", 
      booking 
    });
  } catch (error) {
    console.error("Error processing cash payment for hotel booking:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;


