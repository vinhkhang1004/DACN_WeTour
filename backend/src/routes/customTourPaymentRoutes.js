import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { CustomTour, User } from "../models/index.js";
import {
  createVNPayPaymentUrl,
  verifyVNPayCallback,
  createMoMoPaymentUrl,
  verifyMoMoCallback,
} from "../utils/paymentService.js";
import { sendPaymentConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

/**
 * Tạo payment URL cho VNPay (Custom Tour)
 */
router.post("/vnpay/create", verifyToken, async (req, res) => {
  try {
    const { custom_tour_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!custom_tour_id) {
      return res.status(400).json({ message: "Thiếu custom_tour_id" });
    }

    const customTour = await CustomTour.findByPk(parseInt(custom_tour_id), {
      include: [{ model: User }]
    });

    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Kiểm tra quyền
    if (customTour.user_id && parseInt(customTour.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán tour đã được approve
    if (customTour.status !== "approved") {
      return res.status(400).json({ message: "Tour chưa được xác nhận, không thể thanh toán" });
    }

    // Kiểm tra đã thanh toán chưa (status = paid hoặc completed)
    if (customTour.status === "paid" || customTour.status === "completed") {
      return res.status(400).json({ message: "Tour đã được thanh toán" });
    }

    const amount = parseFloat(customTour.estimated_cost || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    // Tạo order ID
    const orderId = `CT${customTour.id}_${Date.now()}`;
    const orderDescription = `Thanh toán tour tự thiết kế: ${customTour.destination}`;
    const ipAddr = req.ip || req.connection.remoteAddress || "127.0.0.1";

    console.log("\n=== Creating VNPay Payment URL for Custom Tour ===");
    console.log("Custom Tour ID:", customTour.id);
    console.log("Amount:", amount);
    console.log("Order ID:", orderId);

    const paymentUrl = createVNPayPaymentUrl(orderId, amount, orderDescription, ipAddr);

    // Lưu transaction_code vào custom_tour (có thể lưu vào một bảng payment riêng sau)
    // Tạm thời lưu vào admin_notes hoặc tạo bảng payment riêng
    // Ở đây ta sẽ cập nhật status thành "paid" sau khi verify callback

    console.log("Payment URL created successfully");

    res.json({
      success: true,
      paymentUrl,
      orderId,
      amount
    });
  } catch (error) {
    console.error("Error creating VNPay payment for custom tour:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * Tạo payment URL cho MoMo (Custom Tour)
 */
router.post("/momo/create", verifyToken, async (req, res) => {
  try {
    const { custom_tour_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!custom_tour_id) {
      return res.status(400).json({ message: "Thiếu custom_tour_id" });
    }

    const customTour = await CustomTour.findByPk(parseInt(custom_tour_id), {
      include: [{ model: User }]
    });

    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Kiểm tra quyền
    if (customTour.user_id && parseInt(customTour.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán tour đã được approve
    if (customTour.status !== "approved") {
      return res.status(400).json({ message: "Tour chưa được xác nhận, không thể thanh toán" });
    }

    if (customTour.status === "paid" || customTour.status === "completed") {
      return res.status(400).json({ message: "Tour đã được thanh toán" });
    }

    const amount = parseFloat(customTour.estimated_cost || 0);
    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    const orderId = `CT${customTour.id}_${Date.now()}`;
    const orderInfo = `Thanh toán tour tự thiết kế: ${customTour.destination}`;

    try {
      const momoResponse = await createMoMoPaymentUrl(orderId, amount, orderInfo);

      // Kiểm tra response từ MoMo
      if (momoResponse && momoResponse.payUrl) {
        res.json({
          success: true,
          paymentUrl: momoResponse.payUrl,
          orderId,
          amount
        });
      } else {
        // Xử lý các trường hợp lỗi từ MoMo
        const errorMessage = momoResponse?.message || 
                            momoResponse?.localMessage || 
                            "Không thể tạo link thanh toán MoMo. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.";
        
        console.error("MoMo payment error:", momoResponse);
        
        res.status(400).json({
          message: errorMessage,
          error: momoResponse
        });
      }
    } catch (momoError) {
      console.error("Error calling MoMo API:", momoError);
      res.status(500).json({
        message: "Có lỗi xảy ra khi kết nối với MoMo. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
        error: momoError.message
      });
    }
  } catch (error) {
    console.error("Error creating MoMo payment for custom tour:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo link thanh toán",
      error: error.message 
    });
  }
});

/**
 * VNPay Callback Handler (Custom Tour)
 */
router.get("/vnpay/callback", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const orderId = vnp_Params["vnp_TxnRef"];

    if (!orderId || !orderId.startsWith("CT")) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
    }

    // Extract custom_tour_id from orderId (format: CT{id}_{timestamp})
    const customTourId = parseInt(orderId.split("_")[0].replace("CT", ""));

    const customTour = await CustomTour.findByPk(customTourId, {
      include: [{ model: User }]
    });

    if (!customTour) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Tour not found`);
    }

    const isValid = verifyVNPayCallback(vnp_Params);

    if (isValid) {
      const responseCode = vnp_Params["vnp_ResponseCode"];

      if (responseCode === "00") {
        // Payment success
        await customTour.update({ status: "paid" });

        // Gửi email xác nhận thanh toán
        try {
          const recipient = customTour.User || {
            name: customTour.guest_name,
            email: customTour.guest_email
          };
          
          if (recipient && recipient.email) {
            await sendPaymentConfirmationEmail(
              recipient,
              { 
                id: customTour.id,
                total_price: customTour.estimated_cost,
                booking_date: customTour.start_date
              },
              {
                name: `Tour tự thiết kế: ${customTour.destination}`,
                destination: customTour.destination
              },
              {
                method: "vnpay",
                amount: customTour.estimated_cost,
                transaction_code: vnp_Params["vnp_TransactionNo"] || orderId,
                status: "success"
              }
            );
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&customTourId=${customTourId}&method=vnpay`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&customTourId=${customTourId}&method=vnpay&message=${encodeURIComponent(vnp_Params["vnp_ResponseMessage"] || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing VNPay callback for custom tour:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * MoMo Callback Handler (Custom Tour)
 */
router.get("/momo/callback", async (req, res) => {
  try {
    const params = req.query;
    const orderId = params.orderId;

    if (!orderId || !orderId.startsWith("CT")) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid order ID`);
    }

    const customTourId = parseInt(orderId.split("_")[0].replace("CT", ""));

    const customTour = await CustomTour.findByPk(customTourId, {
      include: [{ model: User }]
    });

    if (!customTour) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Tour not found`);
    }

    const isValid = verifyMoMoCallback(params);

    if (isValid) {
      const resultCode = params.resultCode;

      if (resultCode === "0") {
        // Payment success
        await customTour.update({ status: "paid" });

        // Gửi email xác nhận thanh toán
        try {
          const recipient = customTour.User || {
            name: customTour.guest_name,
            email: customTour.guest_email
          };
          
          if (recipient && recipient.email) {
            await sendPaymentConfirmationEmail(
              recipient,
              { 
                id: customTour.id,
                total_price: customTour.estimated_cost,
                booking_date: customTour.start_date
              },
              {
                name: `Tour tự thiết kế: ${customTour.destination}`,
                destination: customTour.destination
              },
              {
                method: "momo",
                amount: customTour.estimated_cost,
                transaction_code: params.transId || orderId,
                status: "success"
              }
            );
          }
        } catch (emailError) {
          console.error("Error sending payment email:", emailError);
        }

        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=success&customTourId=${customTourId}&method=momo`
        );
      } else {
        // Payment failed
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&customTourId=${customTourId}&method=momo&message=${encodeURIComponent(params.message || "Thanh toán thất bại")}`
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Invalid signature`);
    }
  } catch (error) {
    console.error("Error processing MoMo callback for custom tour:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=Server error`);
  }
});

/**
 * Thanh toán bằng tiền mặt (Custom Tour)
 */
router.post("/cash", verifyToken, async (req, res) => {
  try {
    const { custom_tour_id } = req.body;
    const user_id = parseInt(req.user.id);

    if (!custom_tour_id) {
      return res.status(400).json({ message: "Thiếu custom_tour_id" });
    }

    const customTour = await CustomTour.findByPk(parseInt(custom_tour_id), {
      include: [{ model: User }]
    });

    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Kiểm tra quyền
    if (customTour.user_id && parseInt(customTour.user_id) !== user_id) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Chỉ cho phép thanh toán tour đã được approve
    if (customTour.status !== "approved") {
      return res.status(400).json({ message: "Tour chưa được xác nhận, không thể thanh toán" });
    }

    if (customTour.status === "paid" || customTour.status === "completed") {
      return res.status(400).json({ message: "Tour đã được thanh toán" });
    }

    // Cập nhật status thành paid
    await customTour.update({ status: "paid" });

    // Gửi email xác nhận
    try {
      const recipient = customTour.User || {
        name: customTour.guest_name,
        email: customTour.guest_email
      };
      
      if (recipient && recipient.email) {
        await sendPaymentConfirmationEmail(
          recipient,
          { 
            id: customTour.id,
            total_price: customTour.estimated_cost,
            booking_date: customTour.start_date
          },
          {
            name: `Tour tự thiết kế: ${customTour.destination}`,
            destination: customTour.destination
          },
          {
            method: "cash",
            amount: customTour.estimated_cost,
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
      tour: customTour 
    });
  } catch (error) {
    console.error("Error processing cash payment for custom tour:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

