import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Flight, FlightBooking, User } from "../models/index.js";
import { Op } from "sequelize";

const router = express.Router();

// Tất cả routes đều cần admin
router.use(verifyToken);

// ========== FLIGHT BOOKING MANAGEMENT ==========
// NOTE: Đặt routes booking TRƯỚC route /:id để tránh conflict

// ✅ Lấy danh sách đặt vé máy bay (admin)
router.get("/bookings", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { search, status, payment_status, flight_id, page = 1, limit = 50 } = req.query;
    const where = {};
    const includeWhere = {};

    if (status) {
      where.status = status;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (flight_id) {
      where[Op.or] = [
        { flight_id: parseInt(flight_id) },
        { return_flight_id: parseInt(flight_id) }
      ];
    }

    if (search) {
      // Search in booking code, guest info, flight info
      where[Op.or] = [
        { booking_code: { [Op.like]: `%${search}%` } },
        { guest_name: { [Op.like]: `%${search}%` } },
        { guest_email: { [Op.like]: `%${search}%` } },
        { guest_phone: { [Op.like]: `%${search}%` } }
      ];
      
      // Also search in flight info
      includeWhere[Op.or] = [
        { airline: { [Op.like]: `%${search}%` } },
        { flight_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const includeOptions = [
      {
        model: Flight,
        as: "OutboundFlight",
        required: false
      },
      {
        model: Flight,
        as: "ReturnFlight",
        required: false
      },
      {
        model: User,
        required: false
      }
    ];

    // Only add where clause to OutboundFlight if we have search criteria
    if (Object.keys(includeWhere).length > 0) {
      includeOptions[0].where = includeWhere;
    }

    const { count, rows } = await FlightBooking.findAndCountAll({
      where,
      include: includeOptions,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      bookings: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching flight bookings:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({ message: error.message || "Lỗi khi tải danh sách đặt vé" });
  }
});

// ✅ Lấy chi tiết đặt vé (admin)
router.get("/bookings/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const booking = await FlightBooking.findByPk(req.params.id, {
      include: [
        {
          model: Flight,
          as: "OutboundFlight",
          required: false
        },
        {
          model: Flight,
          as: "ReturnFlight",
          required: false
        },
        {
          model: User,
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching flight booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật trạng thái đặt vé (admin)
router.put("/bookings/:id/status", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { status, payment_status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    const validPaymentStatuses = ["pending", "paid", "refunded"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}` });
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ message: `Trạng thái thanh toán không hợp lệ. Chỉ chấp nhận: ${validPaymentStatuses.join(", ")}` });
    }

    const booking = await FlightBooking.findByPk(req.params.id, {
      include: [
        {
          model: Flight,
          as: "OutboundFlight",
          required: false
        },
        {
          model: Flight,
          as: "ReturnFlight",
          required: false
        },
        {
          model: User,
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    const oldStatus = booking.status;
    const oldPaymentStatus = booking.payment_status;

    if (status) {
      booking.status = status;
    }
    if (payment_status) {
      booking.payment_status = payment_status;
    }

    await booking.save();

    // Send email when status changes
    if (oldStatus !== booking.status && (booking.status === "confirmed" || booking.status === "completed")) {
      try {
        const { sendFlightAdminConfirmationEmail, sendFlightCompletionEmail } = await import("../utils/emailService.js");
        
        // Determine recipient
        const recipient = booking.User || {
          name: booking.guest_name,
          email: booking.guest_email
        };

        if (recipient && recipient.email && booking.OutboundFlight) {
          if (booking.status === "confirmed") {
            // Send admin confirmation email
            await sendFlightAdminConfirmationEmail(
              recipient,
              booking,
              booking.OutboundFlight,
              booking.ReturnFlight
            );
            console.log(`✅ Admin confirmation email sent to ${recipient.email} for flight booking #${booking.id}`);
          } else if (booking.status === "completed") {
            // Send completion email
            await sendFlightCompletionEmail(
              recipient,
              booking,
              booking.OutboundFlight,
              booking.ReturnFlight
            );
            console.log(`✅ Completion email sent to ${recipient.email} for flight booking #${booking.id}`);
          }
        } else {
          console.warn(`⚠️ Cannot send email: recipient or flight missing for booking #${booking.id}`);
        }
      } catch (emailError) {
        console.error("Error sending flight status change email:", emailError);
        // Continue even if email fails
      }
    }

    res.json({ message: "Cập nhật trạng thái thành công!", booking });
  } catch (error) {
    console.error("Error updating flight booking status:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa đặt vé (admin)
router.delete("/bookings/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const booking = await FlightBooking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt vé" });
    }

    await booking.destroy();

    res.json({ message: "Xóa đặt vé thành công!" });
  } catch (error) {
    console.error("Error deleting flight booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========== FLIGHT MANAGEMENT ==========

// ✅ Lấy danh sách chuyến bay (admin)
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { search, airline, origin, destination, status, page = 1, limit = 50 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { airline: { [Op.like]: `%${search}%` } },
        { flight_number: { [Op.like]: `%${search}%` } },
        { origin: { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } }
      ];
    }

    if (airline) {
      where.airline = { [Op.like]: `%${airline}%` };
    }

    if (origin) {
      where.origin = { [Op.like]: `%${origin}%` };
    }

    if (destination) {
      where.destination = { [Op.like]: `%${destination}%` };
    }

    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Flight.findAndCountAll({
      where,
      order: [["departure_date", "ASC"], ["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      flights: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Tạo chuyến bay mới (admin)
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const {
      airline,
      flight_number,
      origin,
      origin_code,
      origin_airport,
      destination,
      destination_code,
      destination_airport,
      departure_date,
      arrival_date,
      duration,
      flight_type,
      aircraft_type,
      economy_price,
      business_price,
      first_class_price,
      available_seats_economy,
      available_seats_business,
      available_seats_first,
      baggage_carry_on,
      baggage_checked,
      status
    } = req.body;

    // Validate required fields
    if (!airline || !flight_number || !origin || !origin_code || !destination || !destination_code || !departure_date || !arrival_date) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    const flight = await Flight.create({
      airline,
      flight_number,
      origin,
      origin_code: origin_code.toUpperCase(),
      origin_airport,
      destination,
      destination_code: destination_code.toUpperCase(),
      destination_airport,
      departure_date,
      arrival_date,
      duration: duration || Math.ceil((new Date(arrival_date) - new Date(departure_date)) / (1000 * 60)),
      flight_type: flight_type || "direct",
      aircraft_type,
      economy_price: parseFloat(economy_price) || 0,
      business_price: business_price ? parseFloat(business_price) : null,
      first_class_price: first_class_price ? parseFloat(first_class_price) : null,
      available_seats_economy: parseInt(available_seats_economy) || 0,
      available_seats_business: available_seats_business ? parseInt(available_seats_business) : 0,
      available_seats_first: available_seats_first ? parseInt(available_seats_first) : 0,
      baggage_carry_on: baggage_carry_on || "7kg",
      baggage_checked: baggage_checked || "23kg",
      status: status || "scheduled"
    });

    res.status(201).json({ message: "Tạo chuyến bay thành công!", flight });
  } catch (error) {
    console.error("Error creating flight:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết chuyến bay (admin)
router.get("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const flight = await Flight.findByPk(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
    }

    res.json(flight);
  } catch (error) {
    console.error("Error fetching flight:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật chuyến bay (admin)
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const flight = await Flight.findByPk(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
    }

    const {
      airline,
      flight_number,
      origin,
      origin_code,
      origin_airport,
      destination,
      destination_code,
      destination_airport,
      departure_date,
      arrival_date,
      duration,
      flight_type,
      aircraft_type,
      economy_price,
      business_price,
      first_class_price,
      available_seats_economy,
      available_seats_business,
      available_seats_first,
      baggage_carry_on,
      baggage_checked,
      status
    } = req.body;

    // Update fields
    if (airline !== undefined) flight.airline = airline;
    if (flight_number !== undefined) flight.flight_number = flight_number;
    if (origin !== undefined) flight.origin = origin;
    if (origin_code !== undefined) flight.origin_code = origin_code.toUpperCase();
    if (origin_airport !== undefined) flight.origin_airport = origin_airport;
    if (destination !== undefined) flight.destination = destination;
    if (destination_code !== undefined) flight.destination_code = destination_code.toUpperCase();
    if (destination_airport !== undefined) flight.destination_airport = destination_airport;
    if (departure_date !== undefined) flight.departure_date = departure_date;
    if (arrival_date !== undefined) flight.arrival_date = arrival_date;
    if (duration !== undefined) flight.duration = duration;
    if (flight_type !== undefined) flight.flight_type = flight_type;
    if (aircraft_type !== undefined) flight.aircraft_type = aircraft_type;
    if (economy_price !== undefined) flight.economy_price = parseFloat(economy_price);
    if (business_price !== undefined) flight.business_price = business_price ? parseFloat(business_price) : null;
    if (first_class_price !== undefined) flight.first_class_price = first_class_price ? parseFloat(first_class_price) : null;
    if (available_seats_economy !== undefined) flight.available_seats_economy = parseInt(available_seats_economy);
    if (available_seats_business !== undefined) flight.available_seats_business = available_seats_business ? parseInt(available_seats_business) : 0;
    if (available_seats_first !== undefined) flight.available_seats_first = available_seats_first ? parseInt(available_seats_first) : 0;
    if (baggage_carry_on !== undefined) flight.baggage_carry_on = baggage_carry_on;
    if (baggage_checked !== undefined) flight.baggage_checked = baggage_checked;
    if (status !== undefined) flight.status = status;

    // Recalculate duration if dates changed
    if (departure_date || arrival_date) {
      const depDate = new Date(flight.departure_date);
      const arrDate = new Date(flight.arrival_date);
      flight.duration = Math.ceil((arrDate - depDate) / (1000 * 60));
    }

    await flight.save();

    res.json({ message: "Cập nhật chuyến bay thành công!", flight });
  } catch (error) {
    console.error("Error updating flight:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa chuyến bay (admin)
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const flight = await Flight.findByPk(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
    }

    // Check if there are any bookings for this flight
    const bookingsCount = await FlightBooking.count({
      where: {
        [Op.or]: [
          { flight_id: flight.id },
          { return_flight_id: flight.id }
        ]
      }
    });

    if (bookingsCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa chuyến bay này vì đã có ${bookingsCount} đặt vé liên quan. Vui lòng hủy các đặt vé trước.` 
      });
    }

    await flight.destroy();

    res.json({ message: "Xóa chuyến bay thành công!" });
  } catch (error) {
    console.error("Error deleting flight:", error);
    res.status(500).json({ message: error.message });
  }
});


export default router;

