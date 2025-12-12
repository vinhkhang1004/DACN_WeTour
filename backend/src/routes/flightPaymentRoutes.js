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
    const orderDescription = `Thanh toán đặt vé máy bay: ${flightInfo}`;
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

    const paymentUrl = createVNPayPaymentUrl(orderId, amount, orderDescription, ipAddr);

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

    if (verifyVNPayCallback(vnp_Params)) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // Extract booking ID from orderId (format: FB{bookingId}_{timestamp})
      const bookingIdMatch = orderId.match(/FB(\d+)/);
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








