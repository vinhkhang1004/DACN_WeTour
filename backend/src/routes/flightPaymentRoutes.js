import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { FlightBooking, Flight, User } from "../models/index.js";
import {
  createVNPayPaymentUrl,
  verifyVNPayCallback,
  createMoMoPaymentUrl,
  verifyMoMoCallback,
} from "../utils/paymentService.js";
import { sendFlightPaymentConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

/**
 * Tạo payment URL cho VNPay (Flight Booking)
 */
router.post("/vnpay/create", verifyToken, async (req, res) => {
  try {
    const { flight_booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!flight_booking_id) {
      return res.status(400).json({ message: "Thiếu flight_booking_id" });
    }

    const booking = await FlightBooking.findByPk(parseInt(flight_booking_id), {
      include: [
        { model: Flight, as: "OutboundFlight", required: false },
        { model: Flight, as: "ReturnFlight", required: false },
        { model: User, required: false }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    // Kiểm tra quyền
    if (booking.user_id && parseInt(booking.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.payment_status !== "pending") {
      return res.status(400).json({ message: "Đặt vé này không thể thanh toán" });
    }

    const amount = parseFloat(booking.total_price || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    // Tạo order ID
    const orderId = `FB${booking.id}_${Date.now()}`;
    const flightInfo = booking.OutboundFlight 
      ? `${booking.OutboundFlight.airline} ${booking.OutboundFlight.flight_number}`
      : "Flight";
    // Use simple English description to avoid encoding issues with VNPay
    const orderDescription = `Payment for flight ${flightInfo}`;
    let ipAddr = req.ip || req.connection.remoteAddress || "127.0.0.1";

    // Convert IPv6 localhost to IPv4
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }

    console.log("\n=== Creating VNPay Payment URL for Flight Booking ===");
    console.log("Flight Booking ID:", booking.id);
    console.log("Amount:", amount);
    console.log("Order ID:", orderId);

    // Use flight-specific return URL
    const flightReturnUrl = process.env.VNPAY_FLIGHT_RETURN_URL || 
                          `${process.env.BACKEND_URL || "http://localhost:5000"}/api/flight-payments/vnpay-callback`;
    console.log("Return URL:", flightReturnUrl);

    const paymentUrl = createVNPayPaymentUrl(orderId, amount, orderDescription, ipAddr, flightReturnUrl);

    console.log("Payment URL created successfully");

    res.json({
      success: true,
      paymentUrl,
      orderId,
      amount
    });
  } catch (error) {
    console.error("Error creating VNPay payment for flight booking:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * Tạo payment URL cho MoMo (Flight Booking)
 */
router.post("/momo/create", verifyToken, async (req, res) => {
  try {
    const { flight_booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!flight_booking_id) {
      return res.status(400).json({ message: "Thiếu flight_booking_id" });
    }

    const booking = await FlightBooking.findByPk(parseInt(flight_booking_id), {
      include: [
        { model: Flight, as: "OutboundFlight", required: false },
        { model: Flight, as: "ReturnFlight", required: false },
        { model: User, required: false }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    // Kiểm tra quyền
    if (booking.user_id && parseInt(booking.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.payment_status !== "pending") {
      return res.status(400).json({ message: "Đặt vé này không thể thanh toán" });
    }

    const amount = parseFloat(booking.total_price || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    const orderId = `MOMOFB${booking.id}${Date.now()}`;
    const flightInfo = booking.OutboundFlight 
      ? `${booking.OutboundFlight.airline} ${booking.OutboundFlight.flight_number}`
      : "Flight";
    const orderInfo = `Thanh toan dat ve may bay ${flightInfo} - Booking #${booking.id}`;

    console.log("\n=== Creating MoMo Payment URL for Flight Booking ===");
    console.log("Flight Booking ID:", booking.id);
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
    console.error("Error creating MoMo payment for flight booking:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * VNPay Callback Handler (Flight Booking)
 */
router.get("/vnpay-callback", async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    console.log("\n=== VNPay Callback Received (Flight) ===");
    console.log("Query params:", JSON.stringify(vnp_Params, null, 2));
    console.log("Order ID (vnp_TxnRef):", vnp_Params["vnp_TxnRef"]);
    console.log("Response Code:", vnp_Params["vnp_ResponseCode"]);

    if (verifyVNPayCallback(vnp_Params)) {
      console.log("✅ Signature verified");
      const orderId = vnp_Params["vnp_TxnRef"];
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // Extract booking ID from orderId (format: FB{bookingId}_{timestamp})
      // Support both formats: FB{id}_{timestamp} (new) and FB{id}{timestamp} (old)
      let bookingId;
      if (orderId.includes('_')) {
        // New format: FB{bookingId}_{timestamp}
        const parts = orderId.split('_');
        if (parts[0].startsWith('FB')) {
          bookingId = parseInt(parts[0].replace('FB', ''));
        } else {
          console.error("Invalid order ID format (new):", orderId);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID format`);
        }
      } else {
        // Old format: FB{bookingId}{timestamp} - need to extract booking ID
        const bookingIdMatch = orderId.match(/^FB(\d+)/);
        if (!bookingIdMatch) {
          console.error("Invalid order ID format (old):", orderId);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
        }
        const fullNumber = bookingIdMatch[1];
        // Try different booking ID lengths (1-8 digits)
        let found = false;
        for (let len = Math.min(8, fullNumber.length); len >= 1; len--) {
          const testId = parseInt(fullNumber.substring(0, len));
          const testBooking = await FlightBooking.findByPk(testId);
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
      
      const booking = await FlightBooking.findByPk(bookingId, {
        include: [
          { model: Flight, as: "OutboundFlight", required: false },
          { model: Flight, as: "ReturnFlight", required: false },
          { model: User, required: false }
        ]
      });

      if (!booking) {
        console.error("❌ Booking not found in database:", bookingId);
        console.log("Checking recent bookings...");
        try {
          const recentBookings = await FlightBooking.findAll({
            limit: 10,
            order: [['id', 'DESC']],
            attributes: ['id', 'user_id', 'outbound_flight_id', 'status', 'total_price']
          });
          console.log("Recent bookings (last 10):", recentBookings.map(b => ({
            id: b.id,
            user_id: b.user_id,
            outbound_flight_id: b.outbound_flight_id,
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
        outbound_flight_id: booking.outbound_flight_id,
        status: booking.status,
        total_price: booking.total_price
      });

      if (responseCode === "00") {
        // Payment success - update payment status
        booking.payment_status = "paid";
        await booking.save();

        // Send confirmation email
        try {
          const recipient = booking.User || {
            name: booking.guest_name,
            email: booking.guest_email
          };
          
          if (recipient && recipient.email && booking.OutboundFlight) {
            await sendFlightPaymentConfirmationEmail(
              recipient,
              booking,
              booking.OutboundFlight,
              booking.ReturnFlight,
              {
                method: "vnpay",
                amount: booking.total_price,
                transaction_code: orderId,
                status: "success"
              }
            );
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=vnpay&type=flight`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=vnpay&type=flight&message=${encodeURIComponent(vnp_Params["vnp_ResponseCode"] || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing VNPay callback for flight booking:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * MoMo Callback Handler (Flight Booking)
 */
router.get("/momo-callback", async (req, res) => {
  try {
    const params = req.query;

    if (verifyMoMoCallback(params)) {
      const orderId = params.orderId;
      const resultCode = params.resultCode;

      // Extract booking ID from orderId (format: MOMOFB{bookingId}{timestamp})
      const bookingIdMatch = orderId.match(/MOMOFB(\d+)/);
      if (!bookingIdMatch) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
      }

      const bookingId = parseInt(bookingIdMatch[1]);
      const booking = await FlightBooking.findByPk(bookingId, {
        include: [
          { model: Flight, as: "OutboundFlight", required: false },
          { model: Flight, as: "ReturnFlight", required: false },
          { model: User, required: false }
        ]
      });

      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Booking not found`);
      }

      if (resultCode === 0) {
        // Payment success - update payment status
        booking.payment_status = "paid";
        await booking.save();

        // Send confirmation email
        try {
          const recipient = booking.User || {
            name: booking.guest_name,
            email: booking.guest_email
          };
          
          if (recipient && recipient.email && booking.OutboundFlight) {
            await sendFlightPaymentConfirmationEmail(
              recipient,
              booking,
              booking.OutboundFlight,
              booking.ReturnFlight,
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
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&bookingId=${bookingId}&method=momo&type=flight`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&bookingId=${bookingId}&method=momo&type=flight&message=${encodeURIComponent(params.message || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing MoMo callback for flight booking:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * Thanh toán bằng tiền mặt (Flight Booking)
 */
router.post("/cash", verifyToken, async (req, res) => {
  try {
    const { flight_booking_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!flight_booking_id) {
      return res.status(400).json({ message: "Thiếu flight_booking_id" });
    }

    const booking = await FlightBooking.findByPk(parseInt(flight_booking_id), {
      include: [
        { model: Flight, as: "OutboundFlight", required: false },
        { model: Flight, as: "ReturnFlight", required: false },
        { model: User, required: false }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    // Kiểm tra quyền
    if (booking.user_id && parseInt(booking.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán booking đang pending
    if (booking.payment_status !== "pending") {
      return res.status(400).json({ message: "Đặt vé này không thể thanh toán" });
    }

    // Thanh toán tiền mặt thành công - update payment status
    booking.payment_status = "paid";
    await booking.save();

    // Gửi email xác nhận
    try {
      const recipient = booking.User || {
        name: booking.guest_name,
        email: booking.guest_email
      };
      
      if (recipient && recipient.email && booking.OutboundFlight) {
        await sendFlightPaymentConfirmationEmail(
          recipient,
          booking,
          booking.OutboundFlight,
          booking.ReturnFlight,
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
    console.error("Error processing cash payment for flight booking:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;








