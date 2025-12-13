import express from "express";
import { Booking, Payment, Tour, User } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createVNPayPaymentUrl,
  verifyVNPayCallback,
  createMoMoPaymentUrl,
  verifyMoMoCallback,
} from "../utils/paymentService.js";
import { sendPaymentConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

/**
 * Tạo payment URL cho VNPay
 */
router.post("/vnpay/create", verifyToken, async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!booking_id) {
      return res.status(400).json({ message: "Thiếu booking_id" });
    }

    const booking = await Booking.findByPk(parseInt(booking_id), {
      include: [{ model: Tour }, { model: User }],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // Compare as integers to avoid type mismatch
    if (parseInt(booking.user_id) !== user_id) {
      console.error(`Access denied: booking.user_id=${booking.user_id} (${typeof booking.user_id}), user_id=${user_id} (${typeof user_id})`);
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    if (booking.status === "paid") {
      return res.status(400).json({ message: "Đơn hàng đã được thanh toán" });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ where: { booking_id: booking.id } });
    if (!payment) {
      payment = await Payment.create({
        booking_id: booking.id,
        method: "vnpay",
        amount: booking.total_price,
        status: "pending",
      });
    } else {
      payment.method = "vnpay";
      payment.status = "pending";
      await payment.save();
    }

    // VNPay requires unique order ID (max 100 chars)
    // Format: VN{bookingId}_{timestamp} - use underscore to separate for easy extraction
    const orderId = `VN${booking.id}_${Date.now()}`;
    const amount = Number(booking.total_price);
    // VNPay requires order description to be ASCII only (no Vietnamese characters)
    // Convert Vietnamese to ASCII or use simple English
    const tourName = (booking.Tour?.name || "Tour")
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
      .replace(/[^\w\s-]/g, '') // Remove any remaining special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces
      .trim()
      .substring(0, 100);
    // Use simple English description to avoid encoding issues with VNPay
    const orderDescription = `Payment for tour ${tourName} - Booking ${booking.id}`.substring(0, 255);
    // Get real IP address (consider X-Forwarded-For for production)
    // VNPay requires IPv4 format, not IPv6
    let ipAddr = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['x-real-ip'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 "127.0.0.1";
    
    // Convert IPv6 localhost (::1) to IPv4 (127.0.0.1)
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    
    // Remove IPv6 prefix if present
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }

    console.log("\n=== Creating VNPay Payment URL ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount, "VND");
    console.log("Amount in cents:", Math.round(amount * 100));
    console.log("IP Address:", ipAddr);
    console.log("Order Description:", orderDescription);
    
    const paymentUrl = createVNPayPaymentUrl(orderId, amount, orderDescription, ipAddr);

    // Update transaction code
    payment.transaction_code = orderId;
    await payment.save();

    console.log("Payment URL created successfully");
    console.log("URL Length:", paymentUrl.length);
    console.log("===================================\n");

    res.json({
      paymentUrl,
      orderId,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error("Error creating VNPay payment:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Tạo payment URL cho MoMo
 */
router.post("/momo/create", verifyToken, async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!booking_id) {
      return res.status(400).json({ message: "Thiếu booking_id" });
    }

    const booking = await Booking.findByPk(parseInt(booking_id), {
      include: [{ model: Tour }, { model: User }],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // Compare as integers to avoid type mismatch
    if (parseInt(booking.user_id) !== user_id) {
      console.error(`Access denied: booking.user_id=${booking.user_id} (${typeof booking.user_id}), user_id=${user_id} (${typeof user_id})`);
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    if (booking.status === "paid") {
      return res.status(400).json({ message: "Đơn hàng đã được thanh toán" });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ where: { booking_id: booking.id } });
    if (!payment) {
      payment = await Payment.create({
        booking_id: booking.id,
        method: "momo",
        amount: booking.total_price,
        status: "pending",
      });
    } else {
      payment.method = "momo";
      payment.status = "pending";
      await payment.save();
    }

    const orderId = `MOMO${booking.id}${Date.now()}`;
    const amount = Number(booking.total_price);
    const orderInfo = `Thanh toan tour ${booking.Tour?.name || "Tour"} - Booking #${booking.id}`;

    const momoResponse = await createMoMoPaymentUrl(orderId, amount, orderInfo);

    if (momoResponse.payUrl) {
      // Update transaction code
      payment.transaction_code = orderId;
      await payment.save();

      res.json({
        paymentUrl: momoResponse.payUrl,
        orderId,
        bookingId: booking.id,
      });
    } else {
      res.status(400).json({
        message: momoResponse.message || "Không thể tạo link thanh toán MoMo",
      });
    }
  } catch (error) {
    console.error("Error creating MoMo payment:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * VNPay Callback Handler
 */
router.get("/vnpay-callback", async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    console.log("\n=== VNPay Callback Received ===");
    console.log("Query params:", JSON.stringify(vnp_Params, null, 2));
    console.log("Order ID (vnp_TxnRef):", vnp_Params["vnp_TxnRef"]);
    console.log("Response Code:", vnp_Params["vnp_ResponseCode"]);

    if (verifyVNPayCallback(vnp_Params)) {
      console.log("✅ Signature verified");
      const orderId = vnp_Params["vnp_TxnRef"];
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // Extract booking ID from orderId (format: VN{bookingId}_{timestamp})
      // Support both formats: VN{id}_{timestamp} (new) and VN{id}{timestamp} (old)
      let bookingId;
      if (orderId.includes('_')) {
        // New format: VN{bookingId}_{timestamp}
        const parts = orderId.split('_');
        if (parts[0].startsWith('VN')) {
          bookingId = parseInt(parts[0].replace('VN', ''));
        } else {
          console.error("Invalid order ID format (new):", orderId);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID format`);
        }
      } else {
        // Old format: VN{bookingId}{timestamp} - need to extract booking ID
        // Try to find booking by checking database
        const bookingIdMatch = orderId.match(/^VN(\d+)/);
        if (!bookingIdMatch) {
          console.error("Invalid order ID format (old):", orderId);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
        }
        const fullNumber = bookingIdMatch[1];
        // Try different booking ID lengths (1-8 digits)
        let found = false;
        for (let len = Math.min(8, fullNumber.length); len >= 1; len--) {
          const testId = parseInt(fullNumber.substring(0, len));
          const testBooking = await Booking.findByPk(testId);
          if (testBooking) {
            bookingId = testId;
            found = true;
            console.log(`Found booking ID: ${bookingId} from order ID: ${orderId}`);
            break;
          }
        }
        if (!found) {
          console.error("Booking not found for order ID:", orderId);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
        }
      }
      
      console.log("Extracted booking ID:", bookingId, "from order ID:", orderId);
      console.log("Looking for booking in database...");
      
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Tour }, { model: User }, { model: Payment }],
      });

      if (!booking) {
        console.error("❌ Booking not found in database:", bookingId);
        console.log("Checking recent bookings...");
        try {
          const recentBookings = await Booking.findAll({
            limit: 10,
            order: [['id', 'DESC']],
            attributes: ['id', 'user_id', 'tour_id', 'status', 'total_price']
          });
          console.log("Recent bookings (last 10):", recentBookings.map(b => ({
            id: b.id,
            user_id: b.user_id,
            tour_id: b.tour_id,
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
        tour_id: booking.tour_id,
        status: booking.status,
        total_price: booking.total_price,
        has_tour: !!booking.Tour,
        has_user: !!booking.User
      });

      if (responseCode === "00") {
        // Payment success
        booking.status = "paid";
        await booking.save();

        const payment = await Payment.findOne({ where: { booking_id: booking.id } });
        if (payment) {
          payment.status = "success";
          payment.transaction_code = vnp_Params["vnp_TransactionNo"] || orderId;
          await payment.save();
        }

        // Send confirmation email
        try {
          if (booking.User && booking.Tour) {
            await sendPaymentConfirmationEmail(booking.User, booking, booking.Tour, payment);
          } else {
            console.warn("⚠️ Cannot send payment email: user or tour missing");
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=vnpay&type=tour`
        );
      } else {
        // Payment failed
        const payment = await Payment.findOne({ where: { booking_id: booking.id } });
        if (payment) {
          payment.status = "failed";
          await payment.save();
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=vnpay&message=${encodeURIComponent(vnp_Params["vnp_ResponseMessage"] || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing VNPay callback:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * MoMo Callback Handler
 */
router.get("/momo-callback", async (req, res) => {
  try {
    const params = req.query;

    if (verifyMoMoCallback(params)) {
      const orderId = params.orderId;
      const resultCode = params.resultCode;

      // Extract booking ID from orderId (format: MOMO{bookingId}{timestamp})
      const bookingIdMatch = orderId.match(/MOMO(\d+)/);
      if (!bookingIdMatch) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
      }

      const bookingId = parseInt(bookingIdMatch[1]);
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Tour }, { model: User }, { model: Payment }],
      });

      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
      }

      if (resultCode === 0) {
        // Payment success
        booking.status = "paid";
        await booking.save();

        const payment = await Payment.findOne({ where: { booking_id: booking.id } });
        if (payment) {
          payment.status = "success";
          payment.transaction_code = params.transId || orderId;
          await payment.save();
        }

        // Send confirmation email
        try {
          if (booking.User && booking.Tour) {
            await sendPaymentConfirmationEmail(booking.User, booking, booking.Tour, payment);
          } else {
            console.warn("⚠️ Cannot send payment email: user or tour missing");
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=momo&type=tour`
        );
      } else {
        // Payment failed
        const payment = await Payment.findOne({ where: { booking_id: booking.id } });
        if (payment) {
          payment.status = "failed";
          await payment.save();
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=momo&message=${encodeURIComponent(params.message || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing MoMo callback:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * MoMo IPN (Instant Payment Notification) Handler
 */
router.post("/momo-notify", async (req, res) => {
  try {
    const params = req.body;

    if (verifyMoMoCallback(params)) {
      const orderId = params.orderId;
      const resultCode = params.resultCode;

      const bookingIdMatch = orderId.match(/MOMO(\d+)/);
      if (!bookingIdMatch) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const bookingId = parseInt(bookingIdMatch[1]);
      const booking = await Booking.findByPk(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (resultCode === 0 && booking.status !== "paid") {
        booking.status = "paid";
        await booking.save();

        const payment = await Payment.findOne({ where: { booking_id: booking.id } });
        if (payment) {
          payment.status = "success";
          payment.transaction_code = params.transId || orderId;
          await payment.save();
        }
      }

      return res.status(200).json({ message: "OK" });
    } else {
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error processing MoMo IPN:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * VNPay IPN (Instant Payment Notification) Handler
 * Server-to-server notification from VNPay
 */
router.post("/vnpay-ipn", async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    console.log("\n=== VNPay IPN Notification ===");
    console.log("Received params:", JSON.stringify(vnp_Params, null, 2));

    // Verify signature
    if (!verifyVNPayCallback(vnp_Params)) {
      console.error("Invalid VNPay IPN signature");
      return res.status(400).json({ 
        RspCode: "97", 
        Message: "Invalid signature" 
      });
    }

    const orderId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionNo = vnp_Params["vnp_TransactionNo"];

    // Extract booking ID from orderId (format: VN{bookingId}_{timestamp} or VN{bookingId}{timestamp})
    let bookingId;
    if (orderId.includes('_')) {
      // New format: VN{bookingId}_{timestamp}
      const parts = orderId.split('_');
      if (parts[0].startsWith('VN')) {
        bookingId = parseInt(parts[0].replace('VN', ''));
      } else {
        console.error("Invalid order ID format (new):", orderId);
        return res.status(400).json({ 
          RspCode: "01", 
          Message: "Invalid order ID" 
        });
      }
    } else {
      // Old format: VN{bookingId}{timestamp}
      const bookingIdMatch = orderId.match(/^VN(\d+)/);
      if (!bookingIdMatch) {
        console.error("Invalid order ID format (old):", orderId);
        return res.status(400).json({ 
          RspCode: "01", 
          Message: "Invalid order ID" 
        });
      }
      const fullNumber = bookingIdMatch[1];
      // Try different booking ID lengths
      let found = false;
      for (let len = Math.min(8, fullNumber.length); len >= 1; len--) {
        const testId = parseInt(fullNumber.substring(0, len));
        const testBooking = await Booking.findByPk(testId);
        if (testBooking) {
          bookingId = testId;
          found = true;
          break;
        }
      }
      if (!found) {
        console.error("Booking not found for order ID:", orderId);
        return res.status(404).json({ 
          RspCode: "01", 
          Message: "Booking not found" 
        });
      }
    }
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Tour }, { model: User }],
    });

    if (!booking) {
      console.error("Booking not found:", bookingId);
      return res.status(404).json({ 
        RspCode: "01", 
        Message: "Booking not found" 
      });
    }

    // Only process if payment is successful and booking is not already paid
    if (responseCode === "00" && booking.status !== "paid") {
      booking.status = "paid";
      await booking.save();

      const payment = await Payment.findOne({ where: { booking_id: booking.id } });
      if (payment) {
        payment.status = "success";
        payment.transaction_code = transactionNo || orderId;
        await payment.save();
      } else {
        // Create payment record if it doesn't exist
        await Payment.create({
          booking_id: booking.id,
          method: "vnpay",
          amount: booking.total_price,
          status: "success",
          transaction_code: transactionNo || orderId,
        });
      }

      // Send confirmation email
      try {
        if (booking.User && booking.Tour) {
          const payment = await Payment.findOne({ where: { booking_id: booking.id } });
          await sendPaymentConfirmationEmail(booking.User, booking, booking.Tour, payment);
        }
      } catch (emailError) {
        console.error("Error sending payment email:", emailError);
      }

      console.log("Payment processed successfully for booking:", bookingId);
      return res.status(200).json({ 
        RspCode: "00", 
        Message: "Success" 
      });
    } else if (responseCode !== "00") {
      // Payment failed
      const payment = await Payment.findOne({ where: { booking_id: booking.id } });
      if (payment && payment.status === "pending") {
        payment.status = "failed";
        await payment.save();
      }
      
      console.log("Payment failed for booking:", bookingId, "Response code:", responseCode);
      return res.status(200).json({ 
        RspCode: "00", 
        Message: "Payment failed notification received" 
      });
    } else {
      // Already processed
      console.log("Payment already processed for booking:", bookingId);
      return res.status(200).json({ 
        RspCode: "00", 
        Message: "Already processed" 
      });
    }
  } catch (error) {
    console.error("Error processing VNPay IPN:", error);
    return res.status(500).json({ 
      RspCode: "99", 
      Message: "Server error" 
    });
  }
});

/**
 * Check payment status
 */
router.get("/status/:bookingId", verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Tour },
        { model: User },
        { model: Payment, required: false },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.user_id !== user_id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    res.json({
      booking: {
        id: booking.id,
        status: booking.status,
        total_price: booking.total_price,
      },
      payment: booking.Payment
        ? {
            id: booking.Payment.id,
            method: booking.Payment.method,
            status: booking.Payment.status,
            transaction_code: booking.Payment.transaction_code,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

