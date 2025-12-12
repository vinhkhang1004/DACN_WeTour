import express from "express";
import { Op, Sequelize } from "sequelize";
import { Hotel, HotelBooking, HotelRoom, HotelReview, User, Promotion } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { sendHotelBookingConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

// ✅ Tìm kiếm và lọc khách sạn
router.get("/", async (req, res) => {
  try {
    const {
      location,
      check_in,
      check_out,
      min_price,
      max_price,
      star_rating,
      amenities,
      areas,
      sort_by = "popular",
      page = 1,
      limit = 20
    } = req.query;

    const where = { status: "active" };
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Lọc theo địa điểm
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    // Lọc theo khu vực (areas) - tìm trong address hoặc location
    if (areas) {
      const areaList = areas.split(",");
      where[Op.or] = [
        ...areaList.map(area => ({
          address: { [Op.like]: `%${area.trim()}%` }
        })),
        ...areaList.map(area => ({
          location: { [Op.like]: `%${area.trim()}%` }
        }))
      ];
    }

    // Lọc theo khoảng giá
    if (min_price || max_price) {
      where.price_per_night = {};
      if (min_price) {
        where.price_per_night[Op.gte] = parseFloat(min_price);
      }
      if (max_price) {
        where.price_per_night[Op.lte] = parseFloat(max_price);
      }
    }

    // Lọc theo xếp hạng sao
    if (star_rating) {
      where.star_rating = parseInt(star_rating);
    }

    // Sắp xếp
    let order = [];
    switch (sort_by) {
      case "price_low":
        order = [["price_per_night", "ASC"]];
        break;
      case "price_high":
        order = [["price_per_night", "DESC"]];
        break;
      case "rating":
        order = [["user_score", "DESC"]];
        break;
      case "popular":
      default:
        order = [["user_score", "DESC"], ["price_per_night", "ASC"]];
        break;
    }

    const { count, rows } = await Hotel.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: HotelRoom,
          as: "Rooms",
          where: { status: "available" },
          required: false,
          attributes: ["price_per_night"]
        }
      ]
    });

    // Lọc theo tiện nghi (nếu có)
    let filteredHotels = rows;
    if (amenities) {
      const amenityList = amenities.split(",");
      filteredHotels = rows.filter(hotel => {
        try {
          const hotelAmenities = hotel.amenities ? JSON.parse(hotel.amenities) : [];
          return amenityList.some(amenity => 
            hotelAmenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
          );
        } catch {
          return false;
        }
      });
    }

    // Lấy thống kê reviews cho tất cả hotels một lần
    const hotelIds = filteredHotels.map(h => h.id);
    const reviewStats = await HotelReview.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: [
        "hotel_id",
        [Sequelize.fn("AVG", Sequelize.col("rating")), "avgRating"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "reviewCount"]
      ],
      group: ["hotel_id"],
      raw: true
    });

    // Tạo map để lookup nhanh
    const ratingMap = {};
    reviewStats.forEach(stat => {
      ratingMap[stat.hotel_id] = {
        averageRating: parseFloat(stat.avgRating || 0),
        reviewCount: parseInt(stat.reviewCount || 0)
      };
    });

    // Query tất cả Rooms để tính giá tối thiểu (không chỉ available)
    const allHotelIds = filteredHotels.map(h => h.id);
    const allRooms = await HotelRoom.findAll({
      where: { hotel_id: { [Op.in]: allHotelIds } },
      attributes: ["hotel_id", "price_per_night"]
    });
    
    // Tạo map giá tối thiểu cho mỗi hotel
    const minPriceMap = {};
    allRooms.forEach(room => {
      const hotelId = room.hotel_id;
      const price = parseFloat(room.price_per_night) || 0;
      if (price > 0) {
        if (!minPriceMap[hotelId] || price < minPriceMap[hotelId]) {
          minPriceMap[hotelId] = price;
        }
      }
    });

    // Format hotels với rating data và tính giá tối thiểu từ Rooms
    const hotelsWithRating = filteredHotels.map(hotel => {
      const hotelData = hotel.toJSON();
      const stats = ratingMap[hotel.id] || { averageRating: 0, reviewCount: 0 };
      
      // Cập nhật user_score nếu có reviews (ưu tiên averageRating từ reviews)
      if (stats.averageRating > 0) {
        hotelData.user_score = stats.averageRating;
      }

      // Tính giá tối thiểu từ Rooms nếu có, nếu không thì dùng price_per_night
      let minPrice = hotelData.price_per_night || 0;
      if (minPriceMap[hotel.id]) {
        minPrice = minPriceMap[hotel.id];
      } else if (hotelData.Rooms && hotelData.Rooms.length > 0) {
        const roomPrices = hotelData.Rooms
          .map(r => parseFloat(r.price_per_night) || 0)
          .filter(p => p > 0);
        if (roomPrices.length > 0) {
          minPrice = Math.min(...roomPrices);
        }
      }
      
      // Cập nhật price_per_night với giá tối thiểu từ Rooms
      hotelData.price_per_night = minPrice;

      return {
        ...hotelData,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount
      };
    });

    res.json({
      hotels: hotelsWithRating,
      total: filteredHotels.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết khách sạn
router.get("/:id", async (req, res) => {
  try {
    // Kiểm tra query parameter để quyết định có lấy tất cả phòng hay chỉ phòng available
    const includeAllRooms = req.query.include_all_rooms === "true" || req.query.show_all_status === "true";
    
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        // Chỉ include Rooms nếu không phải includeAllRooms (để tránh conflict)
        ...(includeAllRooms ? [] : [{
          model: HotelRoom,
          as: "Rooms",
          where: { status: "available" },
          required: false,
          order: [["created_at", "DESC"]]
        }]),
        {
          model: HotelReview,
          as: "Reviews",
          include: [{ model: User, attributes: ["id", "name", "email"] }],
          required: false,
          limit: 5,
          order: [["created_at", "DESC"]]
        }
      ]
    });
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Nếu includeAllRooms = true, fetch tất cả phòng riêng biệt để đảm bảo lấy đủ
    let rooms = [];
    if (includeAllRooms) {
      // Fetch TẤT CẢ phòng không filter theo status
      rooms = await HotelRoom.findAll({
        where: { 
          hotel_id: hotel.id
          // KHÔNG filter theo status để lấy tất cả
        },
        order: [["created_at", "DESC"]]
      });
      console.log(`[Hotel ${hotel.id}] Fetched ${rooms.length} rooms (includeAllRooms=true):`, 
        rooms.map(r => ({ id: r.id, name: r.name, status: r.status })));
    } else {
      // Lấy từ hotel.Rooms nếu đã include (chỉ available)
      rooms = hotel.Rooms || [];
      console.log(`[Hotel ${hotel.id}] Fetched ${rooms.length} available rooms (default)`);
    }

    // Tính số lượng đánh giá và điểm trung bình
    const reviewCount = await HotelReview.count({
      where: { hotel_id: hotel.id }
    });

    const reviewStats = await HotelReview.findOne({
      where: { hotel_id: hotel.id },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("rating")), "avgRating"]
      ],
      raw: true
    });

    const averageRating = reviewStats ? parseFloat(reviewStats.avgRating || 0) : 0;

    const hotelData = hotel.toJSON();
    
    // Gắn phòng vào hotelData - đảm bảo convert đúng và không mất dữ liệu
    hotelData.Rooms = await Promise.all(
      rooms
        .filter(room => room !== null && room !== undefined) // Loại bỏ null/undefined
        .map(async (room) => {
          const roomData = room.toJSON ? room.toJSON() : room;
          
          // Đảm bảo quantity có giá trị hợp lệ (default = 1 nếu không có)
          if (roomData.quantity === undefined || roomData.quantity === null) {
            roomData.quantity = 1;
          }
          
          // Đảm bảo quantity là số nguyên
          roomData.quantity = parseInt(roomData.quantity) || 1;
        
          // Tự động cập nhật status dựa trên quantity
          if (roomData.quantity <= 0 && roomData.status === "available") {
            // Cập nhật trong database nếu cần
            try {
              await HotelRoom.update(
                { status: "unavailable" },
                { where: { id: roomData.id } }
              );
            } catch (e) {
              console.error(`Error updating room ${roomData.id} status:`, e);
            }
            roomData.status = "unavailable";
          } else if (roomData.quantity > 0 && roomData.status === "unavailable") {
            // Có thể tự động chuyển về available nếu quantity > 0
            // Nhưng để admin kiểm soát, chỉ cập nhật nếu chưa được set thủ công
          }
        
          // Đảm bảo status có giá trị hợp lệ
          if (!roomData.status) {
            roomData.status = roomData.quantity > 0 ? "available" : "unavailable";
          }
        
          return roomData;
        })
    );
    
    console.log(`[Backend] Total rooms before sort: ${hotelData.Rooms.length}`);
    
    // Sắp xếp phòng: available trước, unavailable sau
    if (includeAllRooms && hotelData.Rooms && Array.isArray(hotelData.Rooms)) {
      hotelData.Rooms.sort((a, b) => {
        // Available trước (status = "available" thì return -1)
        if (a.status === "available" && b.status !== "available") return -1;
        if (a.status !== "available" && b.status === "available") return 1;
        // Nếu cùng status, sắp xếp theo created_at DESC
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      console.log(`[Backend] Sorted ${hotelData.Rooms.length} rooms:`, hotelData.Rooms.map(r => ({ id: r.id, name: r.name, status: r.status })));
    }
    
    console.log(`[Backend] Final response - Total rooms: ${hotelData.Rooms.length}`);
    
    // Cập nhật user_score nếu có reviews
    if (averageRating > 0) {
      hotelData.user_score = averageRating;
    }

    res.json({
      ...hotelData,
      reviewCount,
      averageRating
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Đặt phòng khách sạn (có thể là user hoặc guest)
router.post("/:id/book", async (req, res) => {
  try {
    const { check_in_date, check_out_date, adults, children, rooms, room_id, guest_name, guest_email, guest_phone, notes, promotion_code } = req.body;
    const hotelId = req.params.id;

    // Kiểm tra token (có thể có hoặc không)
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        // Token có thể có id hoặc userId
        userId = decoded.id || decoded.userId || null;
        console.log("✅ Booking - Decoded token:", { id: decoded.id, userId: decoded.userId, role: decoded.role });
        console.log("✅ Booking - Using userId:", userId);
      } catch (e) {
        // Token không hợp lệ, tiếp tục như guest
        console.log("⚠️ Token verification failed:", e.message);
      }
    }

    // Nếu không có user_id, yêu cầu thông tin guest
    if (!userId && (!guest_name || !guest_email || !guest_phone)) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp thông tin liên hệ (tên, email, số điện thoại)" 
      });
    }

    // Nếu có userId nhưng thiếu thông tin user, vẫn yêu cầu guest info như fallback
    // (Backend sẽ ưu tiên dùng userId nếu có, nhưng guest info đảm bảo booking vẫn thành công)

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Tính số đêm
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return res.status(400).json({ message: "Ngày trả phòng phải sau ngày nhận phòng" });
    }

    // Xử lý room_id và kiểm tra số lượng phòng còn lại
    let selectedRoom = null;
    let roomPrice = parseFloat(hotel.price_per_night) || 0;
    const numberOfRooms = parseInt(rooms || 1);

    if (room_id) {
      // Tìm phòng được chọn
      selectedRoom = await HotelRoom.findOne({
        where: {
          id: room_id,
          hotel_id: hotelId
        }
      });

      if (!selectedRoom) {
        return res.status(404).json({ message: "Không tìm thấy loại phòng đã chọn" });
      }

      // Kiểm tra số lượng phòng còn lại
      const currentQuantity = parseInt(selectedRoom.quantity || 0);
      if (currentQuantity < numberOfRooms) {
        return res.status(400).json({ 
          message: `Chỉ còn ${currentQuantity} phòng. Vui lòng chọn số lượng phòng phù hợp.` 
        });
      }

      // Kiểm tra status
      if (selectedRoom.status !== "available") {
        return res.status(400).json({ 
          message: "Loại phòng này hiện không khả dụng" 
        });
      }

      // Sử dụng giá của phòng cụ thể
      roomPrice = parseFloat(selectedRoom.price_per_night || hotel.price_per_night || 0);
    }

    // Tính tổng tiền
    let totalPrice = roomPrice * nights * numberOfRooms;
    
    // Xử lý khuyến mãi
    let discount_amount = 0;
    let promotion_id = null;
    
    if (promotion_code) {
      const promotion = await Promotion.findOne({
        where: {
          code: promotion_code.toUpperCase(),
          is_active: true,
          valid_from: { [Op.lte]: new Date() },
          valid_to: { [Op.gte]: new Date() },
          // Check service_type: must be "hotel", "all", or combo that includes hotel
          [Op.or]: [
            { service_type: "hotel" },
            { service_type: "all" },
            { service_type: "tour_hotel" },
            { service_type: "hotel_flight" },
            { service_type: null }
          ]
        }
      });

      if (promotion) {
        // Check usage limit
        if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
          return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
        }

        // Check minimum amount
        if (promotion.min_amount > totalPrice) {
          return res.status(400).json({ 
            message: `Đơn hàng tối thiểu ${promotion.min_amount.toLocaleString()} ₫ để sử dụng mã này` 
          });
        }

        // Calculate discount
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

        // Update promotion usage count
        await promotion.update({
          usage_count: promotion.usage_count + 1
        });
      } else {
        return res.status(400).json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn" });
      }
    }

    // Tạo booking
    // Nếu có userId, luôn dùng userId và không lưu guest info
    // Nếu không có userId, lưu guest info
    const bookingData = {
      user_id: userId || null,
      guest_name: userId ? null : (guest_name || null),
      guest_email: userId ? null : (guest_email || null),
      guest_phone: userId ? null : (guest_phone || null),
      hotel_id: hotelId,
      room_id: room_id || null, // Lưu room_id nếu có
      check_in_date,
      check_out_date,
      adults: parseInt(adults || 1),
      children: parseInt(children || 0),
      rooms: numberOfRooms,
      total_price: totalPrice,
      discount_amount: discount_amount,
      promotion_id: promotion_id,
      status: "pending",
      notes: notes || null
    };
    
    console.log("📝 Creating hotel booking with data:", {
      user_id: bookingData.user_id,
      guest_email: bookingData.guest_email,
      hotel_id: bookingData.hotel_id,
      room_id: bookingData.room_id,
      rooms: bookingData.rooms
    });
    
    const booking = await HotelBooking.create(bookingData);
    
    // Giảm số lượng phòng còn lại nếu có room_id
    if (selectedRoom && room_id) {
      const newQuantity = Math.max(0, parseInt(selectedRoom.quantity) - numberOfRooms);
      await selectedRoom.update({
        quantity: newQuantity
      });
      console.log(`✅ Updated room ${room_id} quantity: ${selectedRoom.quantity} -> ${newQuantity}`);
    }
    
    console.log("✅ Hotel booking created:", {
      id: booking.id,
      user_id: booking.user_id,
      guest_email: booking.guest_email,
      room_id: booking.room_id
    });

    // Tạo notification cho admin về đặt phòng mới
    try {
      const { Notification } = await import("../models/index.js");
      const admins = await User.findAll({ 
        where: { role: "admin" },
        attributes: ["id"]
      });
      
      const customerName = userId ? (await User.findByPk(userId))?.name : guest_name;
      
      for (const admin of admins) {
        await Notification.create({
          user_id: admin.id,
          title: "🏨 Có đơn đặt phòng khách sạn mới",
          message: `${userId ? customerName : 'Khách chưa đăng nhập'} vừa đặt phòng tại ${hotel.name} - ${rooms || 1} phòng, ${nights} đêm`,
          type: "hotel_booking",
          is_read: false
        });
      }
    } catch (notifError) {
      console.error("Error creating admin notifications:", notifError);
    }

    // Gửi email xác nhận
    try {
      const recipientEmail = userId ? (await User.findByPk(userId))?.email : guest_email;
      const recipientName = userId ? (await User.findByPk(userId))?.name : guest_name;
      
      if (recipientEmail) {
        const emailUser = userId ? await User.findByPk(userId, {
          attributes: ['id', 'name', 'email']
        }) : {
          id: null,
          name: recipientName,
          email: recipientEmail
        };
        
        if (emailUser) {
          const emailResult = await sendHotelBookingConfirmationEmail(emailUser, booking, hotel);
          
          if (emailResult.success) {
            console.log(`✅ Hotel booking confirmation email sent successfully to ${recipientEmail}`);
          } else {
            console.error(`❌ Failed to send hotel booking confirmation email: ${emailResult.error}`);
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending booking email:", emailError);
      // Không fail request nếu email lỗi
    }

    res.status(201).json({
      message: "Đặt phòng thành công!",
      booking
    });
  } catch (error) {
    console.error("Error creating hotel booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy danh sách đặt phòng của user
router.get("/bookings/my", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    // Lấy email từ database nếu token không có email
    let userEmail = req.user.email;
    if (!userEmail && userId) {
      try {
        const user = await User.findByPk(userId);
        userEmail = user?.email || null;
      } catch (e) {
        console.log("Could not fetch user email:", e.message);
      }
    }
    
    console.log("🔍 Fetching hotel bookings for user:", {
      userId: userId,
      userEmail: userEmail,
      reqUser: req.user
    });
    
    // Lấy bookings theo user_id hoặc email (cho trường hợp guest booking với email của user)
    let whereCondition;
    
    if (userEmail) {
      // Tìm theo cả user_id và email
      whereCondition = {
        [Op.or]: [
          { user_id: userId },
          { guest_email: userEmail }
        ]
      };
    } else {
      // Chỉ tìm theo user_id
      whereCondition = {
        user_id: userId
      };
    }
    
    console.log("🔍 Search condition:", JSON.stringify(whereCondition, null, 2));
    
    // Test query trước
    const testCount = await HotelBooking.count({ where: whereCondition });
    console.log(`🔍 Found ${testCount} bookings matching condition`);
    
    const bookings = await HotelBooking.findAll({
      where: whereCondition,
      include: [{ model: Hotel }],
      order: [["created_at", "DESC"]]
    });
    
    console.log(`✅ Found ${bookings.length} hotel bookings for user ${userId}`);
    if (bookings.length > 0) {
      bookings.forEach(b => {
        console.log(`  - Booking #${b.id}: user_id=${b.user_id}, guest_email=${b.guest_email}, hotel=${b.Hotel?.name}, status=${b.status}`);
      });
    } else {
      console.log("⚠️ No bookings found. Checking all bookings for this user_id...");
      const allUserBookings = await HotelBooking.findAll({
        where: { user_id: userId },
        include: [{ model: Hotel }]
      });
      console.log(`  Found ${allUserBookings.length} bookings with user_id=${userId}`);
    }
    
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching hotel bookings:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết đặt phòng theo ID
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await HotelBooking.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          required: true
        },
        {
          model: User,
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching hotel booking:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

