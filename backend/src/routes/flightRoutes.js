import express from "express";
import { Flight, FlightBooking, User, Promotion } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

// Generate unique booking code
const generateBookingCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// GET flights - Search flights
router.get("/", async (req, res) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      return_date,
      passengers = 1,
      class_type = "economy",
      airline,
      flight_type,
      min_price,
      max_price,
      sort_by = "price"
    } = req.query;

    const where = {};
    const conditions = [];
    
    // Extract code from input like "Hà Nội (HAN)" -> "HAN"
    const extractCode = (input) => {
      const match = input.match(/\(([A-Z]{3})\)/);
      return match ? match[1] : null;
    };
    
    if (origin) {
      const originCode = extractCode(origin);
      const originName = origin.replace(/\s*\([A-Z]{3}\)\s*/, '').trim();
      
      conditions.push({
        [Op.or]: [
          { origin: { [Op.like]: `%${originName}%` } },
          ...(originCode ? [{ origin_code: originCode }] : [{ origin_code: { [Op.like]: `%${origin.toUpperCase()}%` } }])
        ]
      });
    }
    
    if (destination) {
      const destCode = extractCode(destination);
      const destName = destination.replace(/\s*\([A-Z]{3}\)\s*/, '').trim();
      
      conditions.push({
        [Op.or]: [
          { destination: { [Op.like]: `%${destName}%` } },
          ...(destCode ? [{ destination_code: destCode }] : [{ destination_code: { [Op.like]: `%${destination.toUpperCase()}%` } }])
        ]
      });
    }
    
    if (conditions.length > 0) {
      where[Op.and] = conditions;
    }

    if (departure_date) {
      const departureDate = new Date(departure_date);
      departureDate.setHours(0, 0, 0, 0);
      // Tìm chuyến bay trong vòng ±7 ngày từ ngày đã chọn
      const dateRange = 7; // 7 ngày
      const startDate = new Date(departureDate);
      startDate.setDate(startDate.getDate() - dateRange);
      const endDate = new Date(departureDate);
      endDate.setDate(endDate.getDate() + dateRange);
      endDate.setHours(23, 59, 59, 999);
      
      conditions.push({
        departure_date: {
          [Op.between]: [startDate, endDate]
        }
      });
    }

    if (airline) {
      conditions.push({
        airline: { [Op.like]: `%${airline}%` }
      });
    }

    if (flight_type) {
      conditions.push({
        flight_type: flight_type
      });
    }

    // Price filter based on class type
    const priceField = `${class_type}_price`;
    if (min_price || max_price) {
      const priceCondition = {};
      if (min_price) priceCondition[Op.gte] = parseFloat(min_price);
      if (max_price) priceCondition[Op.lte] = parseFloat(max_price);
      conditions.push({ [priceField]: priceCondition });
    }

    // Always filter by status (only scheduled flights)
    // Only filter by future dates if user didn't specify a date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (!departure_date) {
      // If no date specified, show future flights (>= today)
      conditions.push({ 
        status: "scheduled",
        departure_date: {
          [Op.gte]: now
        }
      });
    } else {
      // If user specified date, only add status filter (date filter already added above)
      conditions.push({ status: "scheduled" });
    }
    
    // Build final where clause
    if (conditions.length > 0) {
      where[Op.and] = conditions;
    } else {
      // If no search conditions, show all scheduled flights in the future
      where.status = "scheduled";
      where.departure_date = {
        [Op.gte]: now
      };
    }

    // Order by - nếu có departure_date, ưu tiên sắp xếp theo khoảng cách ngày gần nhất
    let order = [];
    if (departure_date) {
      // Ưu tiên sắp xếp theo khoảng cách ngày gần nhất với ngày đã chọn
      const departureDate = new Date(departure_date);
      departureDate.setHours(0, 0, 0, 0);
      // Sắp xếp theo departure_date gần nhất với ngày đã chọn
      order = [["departure_date", "ASC"]];
    } else if (sort_by === "price") {
      order = [[priceField, "ASC"]];
    } else if (sort_by === "duration") {
      order = [["duration", "ASC"]];
    } else if (sort_by === "departure") {
      order = [["departure_date", "ASC"]];
    } else {
      order = [[priceField, "ASC"]];
    }

    // Query flights
    console.log("Flight search query:", JSON.stringify(where, null, 2));
    
    try {
      let flights = await Flight.findAll({
        where,
        order,
        limit: 100 // Tăng limit để hiển thị nhiều hơn
      });

      // Nếu có departure_date, sắp xếp lại theo khoảng cách ngày gần nhất
      if (departure_date && flights.length > 0) {
        const departureDate = new Date(departure_date);
        departureDate.setHours(0, 0, 0, 0);
        
        flights = flights.map(flight => {
          const flightDate = new Date(flight.departure_date);
          flightDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.abs((flightDate - departureDate) / (1000 * 60 * 60 * 24));
          return { ...flight.toJSON(), daysDiff };
        }).sort((a, b) => a.daysDiff - b.daysDiff);
      }

      console.log(`Found ${flights.length} flights`);
      
      // Return flights even if empty array
      res.json({ 
        flights: flights || [], 
        total: flights ? flights.length : 0,
        hasExactMatch: departure_date ? flights.some(f => f.daysDiff === 0) : true
      });
    } catch (dbError) {
      console.error("Database error in flight search:", dbError);
      res.status(500).json({ 
        message: "Lỗi khi tìm kiếm chuyến bay", 
        error: dbError.message,
        flights: [],
        total: 0
      });
    }
  } catch (error) {
    console.error("Error searching flights:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET flight by ID
router.get("/:id", async (req, res) => {
  try {
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

// POST book flight
router.post("/:id/book", async (req, res) => {
  try {
    const {
      return_flight_id,
      passengers,
      class_type,
      passenger_info,
      contact_email,
      contact_phone,
      promotion_code,
      additional_services,
      notes
    } = req.body;

    const flightId = req.params.id;

    // Get user from token if available
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        userId = decoded.id || decoded.userId || null;
      } catch (e) {
        // Token invalid, continue as guest
      }
    }

    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
    }

    // Check return flight if provided
    let returnFlight = null;
    if (return_flight_id) {
      returnFlight = await Flight.findByPk(return_flight_id);
      if (!returnFlight) {
        return res.status(404).json({ message: "Không tìm thấy chuyến bay về" });
      }
    }

    // Calculate total price
    const priceField = `${class_type}_price`;
    let basePrice = parseFloat(flight[priceField] || flight.economy_price) * parseInt(passengers || 1);
    
    if (returnFlight) {
      basePrice += parseFloat(returnFlight[priceField] || returnFlight.economy_price) * parseInt(passengers || 1);
    }
    
    // Add taxes (20%)
    let totalPrice = basePrice * 1.2;
    
    // Add additional services (baggage and seat upgrades) to total
    if (additional_services) {
      try {
        const services = typeof additional_services === 'string' 
          ? JSON.parse(additional_services) 
          : additional_services;
        
        // Add baggage fees
        if (services.baggage) {
          Object.values(services.baggage).forEach(bag => {
            if (bag && bag.price) {
              totalPrice += parseFloat(bag.price);
            }
          });
        }
        
        // Add seat upgrade fees (first class seats)
        if (services.seats && Array.isArray(services.seats)) {
          const economyPrice = parseFloat(flight.economy_price || 0);
          const firstClassPrice = parseFloat(flight.first_class_price || 0);
          if (firstClassPrice > economyPrice) {
            services.seats.forEach(seatNumber => {
              if (seatNumber) {
                const row = parseInt(seatNumber.match(/\d+/)?.[0] || "0");
                if (row >= 1 && row <= 10) {
                  // This is a first class seat, add upgrade fee
                  totalPrice += (firstClassPrice - economyPrice);
                }
              }
            });
          }
        }
        
        // Add return flight seat upgrade fees
        if (services.return_seats && Array.isArray(services.return_seats) && returnFlight) {
          const returnEconomyPrice = parseFloat(returnFlight.economy_price || 0);
          const returnFirstClassPrice = parseFloat(returnFlight.first_class_price || 0);
          if (returnFirstClassPrice > returnEconomyPrice) {
            services.return_seats.forEach(seatNumber => {
              if (seatNumber) {
                const row = parseInt(seatNumber.match(/\d+/)?.[0] || "0");
                if (row >= 1 && row <= 10) {
                  totalPrice += (returnFirstClassPrice - returnEconomyPrice);
                }
              }
            });
          }
        }
      } catch (e) {
        console.error("Error parsing additional_services:", e);
      }
    }

    // Apply promotion if provided
    let discount_amount = 0;
    let promotion_id = null;
    
    if (promotion_code) {
      const promotion = await Promotion.findOne({
        where: {
          code: promotion_code.toUpperCase(),
          is_active: true,
          valid_from: { [Op.lte]: new Date() },
          valid_to: { [Op.gte]: new Date() },
          // Check service_type: must be "flight", "all", or combo that includes flight
          [Op.or]: [
            { service_type: "flight" },
            { service_type: "all" },
            { service_type: "tour_flight" },
            { service_type: "hotel_flight" },
            { service_type: null }
          ]
        }
      });

      if (promotion) {
        if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
          return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
        }

        if (promotion.min_amount > totalPrice) {
          return res.status(400).json({ 
            message: `Đơn hàng tối thiểu ${promotion.min_amount.toLocaleString()} ₫ để sử dụng mã này` 
          });
        }

        if (promotion.discount_type === "percentage") {
          discount_amount = (totalPrice * promotion.discount_value) / 100;
          if (promotion.max_discount && discount_amount > promotion.max_discount) {
            discount_amount = promotion.max_discount;
          }
        } else {
          discount_amount = promotion.discount_value;
        }

        totalPrice = totalPrice - discount_amount;
        promotion_id = promotion.id;

        await promotion.update({
          usage_count: promotion.usage_count + 1
        });
      } else {
        return res.status(400).json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn" });
      }
    }

    // Generate unique booking code
    let bookingCode;
    let isUnique = false;
    while (!isUnique) {
      bookingCode = generateBookingCode();
      const existing = await FlightBooking.findOne({ where: { booking_code: bookingCode } });
      if (!existing) isUnique = true;
    }

    // Create booking
    const booking = await FlightBooking.create({
      booking_code: bookingCode,
      user_id: userId || null,
      guest_name: userId ? null : (passenger_info?.[0]?.full_name || null),
      guest_email: contact_email || null,
      guest_phone: contact_phone || null,
      flight_id: flightId,
      return_flight_id: return_flight_id || null,
      passenger_count: parseInt(passengers || 1),
      class_type: class_type || "economy",
      passengers: JSON.stringify(passenger_info || []),
      total_price: totalPrice,
      discount_amount: discount_amount,
      promotion_id: promotion_id,
      additional_services: additional_services ? JSON.stringify(additional_services) : null,
      status: "pending",
      payment_status: "pending",
      notes: notes || null
    });

    // Create notification for admin
    try {
      const { Notification } = await import("../models/index.js");
      const admins = await User.findAll({ 
        where: { role: "admin" },
        attributes: ["id"]
      });
      
      const customerName = userId ? (await User.findByPk(userId))?.name : (passenger_info?.[0]?.full_name || "Khách");
      
      for (const admin of admins) {
        await Notification.create({
          user_id: admin.id,
          title: "✈️ Có đơn đặt vé máy bay mới",
          message: `${customerName} vừa đặt vé ${flight.airline} ${flight.flight_number} - ${passengers || 1} hành khách`,
          type: "flight_booking",
          is_read: false
        });
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Send booking confirmation email
    try {
      const { sendFlightBookingConfirmationEmail } = await import("../utils/emailService.js");
      const user = userId ? await User.findByPk(userId) : null;
      const recipient = user || {
        name: booking.guest_name,
        email: booking.guest_email
      };
      
      if (recipient && recipient.email) {
        await sendFlightBookingConfirmationEmail(
          recipient,
          booking,
          flight,
          returnFlight
        );
        console.log(`✅ Booking confirmation email sent to ${recipient.email} for flight booking #${booking.id}`);
      } else {
        console.warn(`⚠️ Cannot send booking email: recipient email missing for booking #${booking.id}`);
      }
    } catch (emailError) {
      console.error("Error sending flight booking confirmation email:", emailError);
      // Continue even if email fails
    }

    res.json({
      message: "Đặt vé thành công",
      booking: {
        ...booking.toJSON(),
        flight: flight,
        return_flight: returnFlight
      }
    });
  } catch (error) {
    console.error("Error booking flight:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET user's flight bookings - MUST be before /bookings/:id to avoid conflict
router.get("/bookings/my", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const userEmail = req.user.email;

    console.log("🔍 Fetching flight bookings for user:", {
      userId: userId,
      userEmail: userEmail,
      reqUser: req.user
    });

    // Lấy email từ database nếu token không có email
    let finalUserEmail = userEmail;
    if (!finalUserEmail && userId) {
      try {
        const user = await User.findByPk(userId);
        finalUserEmail = user?.email || null;
        console.log("📧 Fetched user email from DB:", finalUserEmail);
      } catch (e) {
        console.log("Could not fetch user email:", e.message);
      }
    }

    const whereCondition = {
      [Op.or]: [
        { user_id: userId }
      ]
    };

    if (finalUserEmail) {
      whereCondition[Op.or].push({ guest_email: finalUserEmail });
    }

    console.log("🔍 Search condition:", JSON.stringify(whereCondition, null, 2));

    // Test query trước
    const testCount = await FlightBooking.count({ where: whereCondition });
    console.log(`🔍 Found ${testCount} flight bookings matching condition`);

    const bookings = await FlightBooking.findAll({
      where: whereCondition,
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
        }
      ],
      order: [["created_at", "DESC"]]
    });

    console.log(`✅ Found ${bookings.length} flight bookings for user ${userId}`);
    if (bookings.length > 0) {
      bookings.forEach((b, idx) => {
        console.log(`  - Booking #${b.id}: user_id=${b.user_id}, guest_email=${b.guest_email}, flight=${b.OutboundFlight?.airline} ${b.OutboundFlight?.flight_number}, status=${b.status}`);
      });
    } else {
      console.log("⚠️ No bookings found. Checking all bookings...");
      const allBookings = await FlightBooking.findAll({
        limit: 10,
        include: [
          {
            model: Flight,
            as: "OutboundFlight",
            required: false
          }
        ]
      });
      console.log(`  Found ${allBookings.length} total bookings in database`);
      if (allBookings.length > 0) {
        allBookings.forEach((b) => {
          console.log(`    - Booking #${b.id}: user_id=${b.user_id}, guest_email=${b.guest_email}`);
        });
      }
    }

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching flight bookings:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: error.message });
  }
});

// GET booking by ID
router.get("/bookings/:id", async (req, res) => {
  try {
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
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt chỗ" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching flight booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET occupied seats for a flight
router.get("/:id/seats", async (req, res) => {
  try {
    const flightId = req.params.id;
    
    // Get all bookings for this flight that have seat information
    const bookings = await FlightBooking.findAll({
      where: {
        [Op.or]: [
          { flight_id: flightId },
          { return_flight_id: flightId }
        ],
        status: {
          [Op.ne]: "cancelled"
        }
      }
    });

    const occupiedSeats = {
      outbound: [],
      return: []
    };

    bookings.forEach(booking => {
      try {
        const additionalServices = booking.additional_services 
          ? JSON.parse(booking.additional_services) 
          : {};
        
        if (booking.flight_id === parseInt(flightId) && additionalServices.seats) {
          const seats = Array.isArray(additionalServices.seats) 
            ? additionalServices.seats 
            : [additionalServices.seats];
          occupiedSeats.outbound.push(...seats);
        }
        
        if (booking.return_flight_id === parseInt(flightId) && additionalServices.return_seats) {
          const seats = Array.isArray(additionalServices.return_seats) 
            ? additionalServices.return_seats 
            : [additionalServices.return_seats];
          occupiedSeats.return.push(...seats);
        }
      } catch (e) {
        console.error("Error parsing additional_services:", e);
      }
    });

    res.json({
      occupied_seats: occupiedSeats.outbound,
      occupied_return_seats: occupiedSeats.return
    });
  } catch (error) {
    console.error("Error fetching occupied seats:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

