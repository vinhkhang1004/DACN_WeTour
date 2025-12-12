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
    const orderId = `VN${booking.id}${Date.now()}`;
    const amount = Number(booking.total_price);
    // VNPay requires order description to be URL-safe and max 255 chars
    // Remove special characters that might cause encoding issues
    const tourName = (booking.Tour?.name || "Tour").replace(/[^\w\s-]/g, '').substring(0, 100);
    const orderDescription = `Thanh toan tour ${tourName} - Booking #${booking.id}`.substring(0, 255);
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

    if (verifyVNPayCallback(vnp_Params)) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // Extract booking ID from orderId (format: VN{bookingId}{timestamp})
      const bookingIdMatch = orderId.match(/VN(\d+)/);
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

