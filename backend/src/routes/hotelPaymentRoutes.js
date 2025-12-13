import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { HotelBooking, Hotel, User } from "../models/index.js";
import {
  createVNPayPaymentUrl,
  verifyVNPayCallback,
  createMoMoPaymentUrl,
  verifyMoMoCallback,
} from "../utils/paymentService.js";
import { sendHotelPaymentConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

/**
 * Tạo payment URL cho VNPay (Hotel Booking)
 */
router.post("/vnpay/create", verifyToken, async (req, res) => {
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

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Đặt phòng này không thể thanh toán" });
    }

    const amount = parseFloat(booking.total_price || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    // Tạo order ID
    const orderId = `HB${booking.id}_${Date.now()}`;
    // Convert Vietnamese to ASCII for VNPay
    const hotelName = (booking.Hotel?.name || "Hotel")
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[đ]/g, 'd')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/[Đ]/g, 'D')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
    // Use simple English description to avoid encoding issues with VNPay
    const orderDescription = `Payment for hotel ${hotelName} - Booking ${booking.id}`;
    
    // Get real IP address
    let ipAddr = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['x-real-ip'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 "127.0.0.1";
    
    // Convert IPv6 localhost to IPv4
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }

    console.log("\n=== Creating VNPay Payment URL for Hotel Booking ===");
    console.log("Hotel Booking ID:", booking.id);
    console.log("Amount:", amount);
    console.log("Order ID:", orderId);

    // Use hotel-specific return URL
    const hotelReturnUrl = process.env.VNPAY_HOTEL_RETURN_URL || 
                          `${process.env.BACKEND_URL || "http://localhost:5000"}/api/hotels/payment/vnpay-callback`;
    console.log("Return URL:", hotelReturnUrl);

    const paymentUrl = createVNPayPaymentUrl(orderId, amount, orderDescription, ipAddr, hotelReturnUrl);

    console.log("Payment URL created successfully");

    res.json({
      success: true,
      paymentUrl,
      orderId,
      amount
    });
  } catch (error) {
    console.error("Error creating VNPay payment for hotel booking:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * VNPay Callback Handler (Hotel Booking)
 */
router.get("/vnpay-callback", async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    console.log("\n=== VNPay Callback Received (Hotel) ===");
    console.log("Full query string:", req.url);
    console.log("Query params:", JSON.stringify(vnp_Params, null, 2));
    console.log("Order ID (vnp_TxnRef):", vnp_Params["vnp_TxnRef"]);
    console.log("Order ID type:", typeof vnp_Params["vnp_TxnRef"]);
    console.log("Order ID length:", vnp_Params["vnp_TxnRef"]?.length);
    console.log("Response Code:", vnp_Params["vnp_ResponseCode"]);

    // Check signature first
    const signatureValid = verifyVNPayCallback(vnp_Params);
    console.log("Signature verification result:", signatureValid);

    if (signatureValid) {
      console.log("✅ Signature verified");
      const orderId = vnp_Params["vnp_TxnRef"];
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // Validate order ID exists
      if (!orderId) {
        console.error("❌ Order ID is missing!");
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Missing order ID`);
      }

      console.log("Processing order ID:", orderId);
      console.log("Order ID starts with HB?", orderId.startsWith('HB'));
      console.log("Order ID starts with VN?", orderId.startsWith('VN'));
      console.log("Order ID starts with FB?", orderId.startsWith('FB'));
      console.log("Order ID starts with CT?", orderId.startsWith('CT'));

      // Check if order ID has correct prefix for hotel booking
      if (!orderId.startsWith('HB')) {
        console.error("❌ Order ID doesn't start with 'HB' (Hotel Booking)");
        console.error("Order ID:", orderId);
        console.error("This might be a callback for a different booking type (Tour/Flight/Custom Tour)");
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID format`);
      }

      // Extract booking ID from orderId (format: HB{bookingId}_{timestamp})
      // Support both formats: HB{id}_{timestamp} (new) and HB{id}{timestamp} (old)
      let bookingId;
      if (orderId.includes('_')) {
        // New format: HB{bookingId}_{timestamp}
        console.log("Detected new format (with underscore)");
        const parts = orderId.split('_');
        console.log("Parts after split:", parts);
        if (parts[0] && parts[0].startsWith('HB')) {
          const idPart = parts[0].replace('HB', '');
          console.log("ID part after removing 'HB':", idPart);
          bookingId = parseInt(idPart);
          console.log("Parsed booking ID:", bookingId);
          if (isNaN(bookingId)) {
            console.error("❌ Cannot parse booking ID. ID part:", idPart);
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID format`);
          }
        } else {
          console.error("❌ Invalid order ID format (new):", orderId);
          console.error("First part doesn't start with 'HB':", parts[0]);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID format`);
        }
      } else {
        // Old format: HB{bookingId}{timestamp} - need to extract booking ID
        console.log("Detected old format (no underscore)");
        const bookingIdMatch = orderId.match(/^HB(\d+)/);
        if (!bookingIdMatch) {
          console.error("❌ Invalid order ID format (old):", orderId);
          console.error("Regex match failed. Order ID doesn't match pattern /^HB(\\d+)/");
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
        }
        const fullNumber = bookingIdMatch[1];
        console.log("Full number extracted:", fullNumber);
        // Try different booking ID lengths (1-8 digits)
        let found = false;
        for (let len = Math.min(8, fullNumber.length); len >= 1; len--) {
          const testId = parseInt(fullNumber.substring(0, len));
          console.log(`Trying booking ID: ${testId} (length: ${len})`);
          const testBooking = await HotelBooking.findByPk(testId);
          if (testBooking) {
            bookingId = testId;
            found = true;
            console.log(`✅ Found booking ID: ${bookingId} from order ID: ${orderId}`);
            break;
          }
        }
        if (!found) {
          console.error("❌ Booking not found for order ID:", orderId);
          console.error("Tried all possible booking IDs from:", fullNumber);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
        }
      }
      
      console.log("Extracted booking ID:", bookingId, "from order ID:", orderId);
      console.log("Looking for booking in database...");
      
      const booking = await HotelBooking.findByPk(bookingId, {
        include: [{ model: Hotel }, { model: User }]
      });

      if (!booking) {
        console.error("❌ Booking not found in database:", bookingId);
        console.log("Checking recent bookings...");
        try {
          const recentBookings = await HotelBooking.findAll({
            limit: 10,
            order: [['id', 'DESC']],
            attributes: ['id', 'user_id', 'hotel_id', 'status', 'total_price']
          });
          console.log("Recent bookings (last 10):", recentBookings.map(b => ({
            id: b.id,
            user_id: b.user_id,
            hotel_id: b.hotel_id,
            status: b.status,
            total_price: b.total_price
          })));
        } catch (err) {
          console.error("Error fetching recent bookings:", err);
        }
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
      }
      
      console.log("✅ Booking found:", {
        id: booking.id,
        user_id: booking.user_id,
        hotel_id: booking.hotel_id,
        status: booking.status,
        total_price: booking.total_price,
        has_hotel: !!booking.Hotel,
        has_user: !!booking.User
      });

      if (responseCode === "00") {
        // Payment success - giữ status là "pending" để admin xác nhận
        // Không tự động set thành "confirmed"

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
                method: "vnpay",
                amount: booking.total_price,
                transaction_code: vnp_Params["vnp_TransactionNo"] || orderId,
                status: "success"
              }
            );
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=vnpay&type=hotel`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=vnpay&type=hotel&message=${encodeURIComponent(vnp_Params["vnp_ResponseMessage"] || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing VNPay callback for hotel booking:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

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


