import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Hotel, HotelRoom, HotelBooking, User } from "../models/index.js";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { sendEmailNotification } from "../utils/emailService.js";

const router = express.Router();

// Tất cả routes đều cần admin
router.use(verifyToken);

// ✅ Lấy danh sách khách sạn (admin)
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Hotel.findAndCountAll({
      where,
      include: [
        {
          model: HotelRoom,
          as: "Rooms",
          required: false
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      hotels: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========== HOTEL BOOKING MANAGEMENT ==========
// NOTE: Đặt routes booking trước route /:id để tránh conflict

// ✅ Lấy danh sách đặt phòng khách sạn (admin)
router.get("/bookings", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { search, status, hotel_id, page = 1, limit = 50 } = req.query;
    const where = {};
    const includeWhere = {};

    if (status) {
      where.status = status;
    }

    if (hotel_id) {
      where.hotel_id = parseInt(hotel_id);
    }

    if (search) {
      // Search in hotel name and location
      includeWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
      
      // Also search in guest fields
      where[Op.or] = [
        { guest_name: { [Op.like]: `%${search}%` } },
        { guest_email: { [Op.like]: `%${search}%` } },
        { guest_phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await HotelBooking.findAndCountAll({
      where,
      include: [
        {
          model: Hotel,
          required: true,
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined
        },
        {
          model: User,
          required: false
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });

    const bookings = rows;

    res.json({
      bookings: bookings,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết đặt phòng (admin)
router.get("/bookings/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

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
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật trạng thái đặt phòng (admin)
router.put("/bookings/:id/status", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}` 
      });
    }

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

    const oldStatus = booking.status;
    await booking.update({ status });

    // Gửi email thông báo khi trạng thái thay đổi thành "confirmed" hoặc "completed"
    if (oldStatus !== status && (status === "confirmed" || status === "completed")) {
      try {
        // Xác định thông tin người nhận
        const recipientEmail = booking.user_id 
          ? booking.User?.email 
          : booking.guest_email;
        const recipientName = booking.user_id 
          ? booking.User?.name 
          : booking.guest_name;

        if (recipientEmail) {
          const hotel = booking.Hotel;
          const nights = Math.ceil(
            (new Date(booking.check_out_date) - new Date(booking.check_in_date)) / 
            (1000 * 60 * 60 * 24)
          );

          let emailSubject = "";
          let emailTitle = "";
          let emailMessage = "";

          if (status === "confirmed") {
            emailSubject = "✅ Xác nhận đặt phòng khách sạn - WeTour";
            emailTitle = "✅ Đặt phòng đã được xác nhận!";
            emailMessage = `Đặt phòng của bạn tại <strong>${hotel?.name || "Khách sạn"}</strong> đã được xác nhận thành công. Chúng tôi rất vui được phục vụ bạn!`;
          } else if (status === "completed") {
            emailSubject = "🌟 Hoàn thành đặt phòng khách sạn - WeTour";
            emailTitle = "🌟 Đặt phòng đã hoàn thành!";
            emailMessage = `Đặt phòng của bạn tại <strong>${hotel?.name || "Khách sạn"}</strong> đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`;
          }

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0E7490; margin-bottom: 20px;">${emailTitle}</h2>
              
              <p>Xin chào <strong>${recipientName || "Quý khách"}</strong>,</p>
              
              <p>${emailMessage}</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">📋 Thông tin đặt phòng:</h3>
                <p><strong>Mã đặt phòng:</strong> #${booking.id}</p>
                <p><strong>Khách sạn:</strong> ${hotel?.name || "N/A"}</p>
                <p><strong>Địa chỉ:</strong> ${hotel?.address || hotel?.location || "N/A"}</p>
                <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.check_in_date).toLocaleDateString('vi-VN')}</p>
                <p><strong>Ngày trả phòng:</strong> ${new Date(booking.check_out_date).toLocaleDateString('vi-VN')}</p>
                <p><strong>Số đêm:</strong> ${nights} đêm</p>
                <p><strong>Số phòng:</strong> ${booking.rooms || 1} phòng</p>
                <p><strong>Số người:</strong> ${booking.adults || 1} người lớn, ${booking.children || 0} trẻ em</p>
                <p><strong>Tổng tiền:</strong> <strong style="color: #0E7490; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong></p>
                <p><strong>Trạng thái:</strong> <span style="color: ${status === "confirmed" ? "#059669" : "#0ea5e9"}; font-weight: 600;">${status === "confirmed" ? "Đã xác nhận" : "Hoàn thành"}</span></p>
              </div>
              
              ${status === "confirmed" 
                ? "<p>Chúng tôi đã xác nhận đặt phòng của bạn. Vui lòng đến đúng thời gian đã đặt để nhận phòng.</p>" 
                : "<p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Chúng tôi rất mong được phục vụ bạn trong những lần tiếp theo!</p>"
              }
              
              <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ WeTour</strong></p>
            </div>
          `;

          await sendEmailNotification(recipientEmail, emailSubject, emailHtml);
          console.log(`✅ Email sent to ${recipientEmail} for booking #${booking.id} status: ${status}`);
        } else {
          console.warn(`⚠️ Cannot send email: recipient email missing for booking #${booking.id}`);
        }
      } catch (emailError) {
        console.error("Error sending status update email:", emailError);
        // Không fail request nếu email lỗi
      }
    }

    res.json({ 
      message: "Cập nhật trạng thái thành công", 
      booking 
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa đặt phòng (admin)
router.delete("/bookings/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const booking = await HotelBooking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    await booking.destroy();
    res.json({ message: "Xóa đặt phòng thành công" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết khách sạn (admin)
router.get("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        {
          model: HotelRoom,
          as: "Rooms",
          required: false
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Tạo khách sạn mới
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const {
      name,
      location,
      address,
      star_rating,
      user_score,
      price_per_night,
      image,
      images,
      description,
      amenities,
      latitude,
      longitude,
      total_rooms
    } = req.body;

    if (!name || !location || !price_per_night) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const hotel = await Hotel.create({
      name,
      location,
      address: address || null,
      star_rating: star_rating || 0,
      user_score: user_score || 0,
      price_per_night,
      image: image || null,
      images: images ? (typeof images === 'string' ? images : JSON.stringify(images)) : null,
      description: description || null,
      amenities: amenities ? (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : null,
      latitude: latitude || null,
      longitude: longitude || null,
      total_rooms: total_rooms || 0,
      status: "active"
    });

    res.status(201).json({ message: "Tạo khách sạn thành công", hotel });
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật khách sạn
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const {
      name,
      location,
      address,
      star_rating,
      user_score,
      price_per_night,
      image,
      images,
      description,
      amenities,
      latitude,
      longitude,
      total_rooms,
      status
    } = req.body;

    await hotel.update({
      name: name !== undefined ? name : hotel.name,
      location: location !== undefined ? location : hotel.location,
      address: address !== undefined ? address : hotel.address,
      star_rating: star_rating !== undefined ? star_rating : hotel.star_rating,
      user_score: user_score !== undefined ? user_score : hotel.user_score,
      price_per_night: price_per_night !== undefined ? price_per_night : hotel.price_per_night,
      image: image !== undefined ? image : hotel.image,
      images: images !== undefined ? (typeof images === 'string' ? images : JSON.stringify(images)) : hotel.images,
      description: description !== undefined ? description : hotel.description,
      amenities: amenities !== undefined ? (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : hotel.amenities,
      latitude: latitude !== undefined ? latitude : hotel.latitude,
      longitude: longitude !== undefined ? longitude : hotel.longitude,
      total_rooms: total_rooms !== undefined ? total_rooms : hotel.total_rooms,
      status: status !== undefined ? status : hotel.status
    });

    res.json({ message: "Cập nhật khách sạn thành công", hotel });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa khách sạn
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Kiểm tra xem có booking nào không
    const bookingsCount = await HotelBooking.count({
      where: { hotel_id: hotel.id }
    });

    if (bookingsCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa khách sạn này vì có ${bookingsCount} đặt phòng liên quan. Vui lòng xóa hoặc hủy các đặt phòng trước.` 
      });
    }

    await hotel.destroy();
    res.json({ message: "Xóa khách sạn thành công" });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========== ROOM MANAGEMENT ==========

// ✅ Lấy danh sách phòng của khách sạn
router.get("/:hotelId/rooms", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const rooms = await HotelRoom.findAll({
      where: { hotel_id: req.params.hotelId },
      order: [["created_at", "DESC"]]
    });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Tạo phòng mới
router.post("/:hotelId/rooms", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const hotel = await Hotel.findByPk(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const {
      name,
      description,
      max_guests,
      max_children,
      bed_type,
      price_per_night,
      image,
      images,
      features,
      status,
      quantity
    } = req.body;

    if (!name || !price_per_night) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    
    // Xác định status dựa trên quantity nếu không có status được truyền vào
    let finalStatus = status || "available";
    const roomQuantity = quantity !== undefined ? parseInt(quantity) : 1;
    if (roomQuantity <= 0) {
      finalStatus = "unavailable";
    }

    // Xử lý images: nếu có images array thì dùng, nếu không thì dùng image single (backward compatibility)
    let imagesData = null;
    if (images && Array.isArray(images) && images.length > 0) {
      imagesData = JSON.stringify(images);
    } else if (image) {
      // Nếu có image cũ, chuyển thành array
      imagesData = JSON.stringify([image]);
    }

    const roomData = {
      hotel_id: req.params.hotelId,
      name,
      description: description || null,
      max_guests: max_guests || 2,
      max_children: max_children || 0,
      bed_type: bed_type || null,
      price_per_night,
      image: image || null, // Giữ lại để backward compatibility
      images: imagesData,
      features: features ? (typeof features === 'string' ? features : JSON.stringify(features)) : null,
      status: finalStatus,
      quantity: roomQuantity
    };
    
    console.log(`[Create Room] Creating room with quantity: ${roomQuantity}, status: ${finalStatus}`);
    
    const room = await HotelRoom.create(roomData);
    
    // Reload để đảm bảo lấy dữ liệu mới nhất từ database
    await room.reload();
    console.log(`[Create Room] Created room ID: ${room.id}, quantity: ${room.quantity}, status: ${room.status}`);

    res.status(201).json({ message: "Tạo phòng thành công", room });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật phòng
router.put("/:hotelId/rooms/:roomId", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const room = await HotelRoom.findOne({
      where: {
        id: req.params.roomId,
        hotel_id: req.params.hotelId
      }
    });

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const {
      name,
      description,
      max_guests,
      max_children,
      bed_type,
      price_per_night,
      image,
      images,
      features,
      status,
      quantity
    } = req.body;

    // Xử lý images: nếu có images array thì dùng, nếu không thì dùng image single (backward compatibility)
    let imagesData = room.images;
    if (images !== undefined) {
      if (Array.isArray(images) && images.length > 0) {
        imagesData = JSON.stringify(images);
      } else if (images === null || (Array.isArray(images) && images.length === 0)) {
        imagesData = null;
      }
    } else if (image !== undefined && image) {
      // Nếu có image cũ, chuyển thành array
      imagesData = JSON.stringify([image]);
    }

    const oldStatus = room.status;
    
    // Xác định quantity và status
    // Đảm bảo quantity luôn là số nguyên hợp lệ
    let newQuantity;
    if (quantity !== undefined && quantity !== null) {
      newQuantity = parseInt(quantity);
      if (isNaN(newQuantity)) {
        // Nếu không parse được, giữ nguyên giá trị hiện tại
        newQuantity = room.quantity !== undefined && room.quantity !== null ? parseInt(room.quantity) : 1;
      }
    } else {
      // Nếu không có quantity trong request, giữ nguyên giá trị hiện tại
      newQuantity = room.quantity !== undefined && room.quantity !== null ? parseInt(room.quantity) : 1;
    }
    
    // Đảm bảo quantity >= 0
    if (newQuantity < 0) {
      newQuantity = 0;
    }
    
    let newStatus = status !== undefined ? status : room.status;
    
    console.log(`[Update Room] Room ID: ${room.id}`);
    console.log(`[Update Room] Old quantity: ${room.quantity}, Old status: ${room.status}`);
    console.log(`[Update Room] Request quantity: ${quantity}, Parsed quantity: ${newQuantity}`);
    console.log(`[Update Room] Request status: ${status}, Final status: ${newStatus}`);
    
    // Tự động chuyển status dựa trên quantity (chỉ khi admin không chỉ định status)
    if (status === undefined) {
      if (newQuantity <= 0) {
        newStatus = "unavailable";
      } else if (newQuantity > 0 && room.status === "unavailable") {
        newStatus = "available";
      }
    }
    
    const updateData = {
      name: name !== undefined ? name : room.name,
      description: description !== undefined ? description : room.description,
      max_guests: max_guests !== undefined ? max_guests : room.max_guests,
      max_children: max_children !== undefined ? max_children : room.max_children,
      bed_type: bed_type !== undefined ? bed_type : room.bed_type,
      price_per_night: price_per_night !== undefined ? price_per_night : room.price_per_night,
      image: image !== undefined ? image : room.image, // Giữ lại để backward compatibility
      images: imagesData !== undefined ? imagesData : room.images,
      features: features !== undefined ? (typeof features === 'string' ? features : JSON.stringify(features)) : room.features,
      status: newStatus,
      quantity: newQuantity // Luôn cập nhật quantity, không dùng undefined
    };
    
    console.log(`[Update Room] Update data:`, updateData);
    console.log(`[Update Room] Before update - Room ID: ${room.id}, Current quantity: ${room.quantity}, New quantity: ${newQuantity}`);
    
    await room.update(updateData);
    
    // Reload để đảm bảo lấy dữ liệu mới nhất từ database
    await room.reload();
    console.log(`[Update Room] After update - Room ID: ${room.id}, quantity: ${room.quantity}, status: ${room.status}`);
    
    // Kiểm tra xem quantity có được lưu đúng không
    if (room.quantity !== newQuantity) {
      console.error(`[Update Room] WARNING: Quantity mismatch! Expected: ${newQuantity}, Got: ${room.quantity}`);
      // Thử update lại trực tiếp bằng raw query nếu cần
      try {
        await sequelize.query(
          `UPDATE hotel_rooms SET quantity = :quantity WHERE id = :id`,
          {
            replacements: { quantity: newQuantity, id: room.id },
            type: QueryTypes.UPDATE
          }
        );
        await room.reload();
        console.log(`[Update Room] After direct SQL update - quantity: ${room.quantity}`);
      } catch (e) {
        console.error(`[Update Room] Error in direct SQL update:`, e);
      }
    }

    // Nếu trạng thái chuyển từ "available" sang "unavailable", gửi thông báo cho người dùng đã đặt phòng
    if (oldStatus === "available" && newStatus === "unavailable") {
      try {
        const { Notification } = await import("../models/index.js");
        const hotel = await Hotel.findByPk(req.params.hotelId);
        
        // Tìm tất cả các booking liên quan đến phòng này với trạng thái pending hoặc confirmed
        const bookings = await HotelBooking.findAll({
          where: {
            room_id: req.params.roomId,
            status: { [Op.in]: ["pending", "confirmed"] },
            check_in_date: { [Op.gte]: new Date() } // Chỉ các booking trong tương lai
          },
          include: [
            {
              model: User,
              attributes: ["id", "name", "email"]
            }
          ]
        });

        // Gửi thông báo cho từng user
        for (const booking of bookings) {
          if (booking.user_id) {
            // User đã đăng nhập
            await Notification.create({
              user_id: booking.user_id,
              title: "⚠️ Thông báo về phòng đã đặt",
              message: `Phòng "${room.name}" tại ${hotel?.name || "khách sạn"} đã hết phòng. Vui lòng liên hệ với chúng tôi để được hỗ trợ.`,
              type: "hotel_booking",
              is_read: false
            });

            // Gửi email nếu có email
            if (booking.User?.email) {
              try {
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0E7490; margin-bottom: 20px;">⚠️ Thông báo về phòng đã đặt</h2>
                    <p>Xin chào <strong>${booking.User.name || "Quý khách"}</strong>,</p>
                    <p>Chúng tôi rất tiếc phải thông báo rằng phòng <strong>"${room.name}"</strong> tại <strong>${hotel?.name || "khách sạn"}</strong> đã hết phòng.</p>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                      <h3 style="color: #991b1b; margin-top: 0;">📋 Thông tin đặt phòng:</h3>
                      <p><strong>Mã đặt phòng:</strong> #${booking.id}</p>
                      <p><strong>Phòng:</strong> ${room.name}</p>
                      <p><strong>Khách sạn:</strong> ${hotel?.name || "N/A"}</p>
                      <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.check_in_date).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Ngày trả phòng:</strong> ${new Date(booking.check_out_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <p>Vui lòng liên hệ với chúng tôi để được hỗ trợ và tìm giải pháp thay thế phù hợp.</p>
                    <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ WeTour</strong></p>
                  </div>
                `;
                await sendEmailNotification(
                  booking.User.email,
                  "⚠️ Thông báo về phòng đã đặt - WeTour",
                  emailHtml
                );
              } catch (emailError) {
                console.error("Error sending email notification:", emailError);
              }
            }
          } else if (booking.guest_email) {
            // Guest chưa đăng nhập - chỉ gửi email
            try {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0E7490; margin-bottom: 20px;">⚠️ Thông báo về phòng đã đặt</h2>
                  <p>Xin chào <strong>${booking.guest_name || "Quý khách"}</strong>,</p>
                  <p>Chúng tôi rất tiếc phải thông báo rằng phòng <strong>"${room.name}"</strong> tại <strong>${hotel?.name || "khách sạn"}</strong> đã hết phòng.</p>
                  <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="color: #991b1b; margin-top: 0;">📋 Thông tin đặt phòng:</h3>
                    <p><strong>Mã đặt phòng:</strong> #${booking.id}</p>
                    <p><strong>Phòng:</strong> ${room.name}</p>
                    <p><strong>Khách sạn:</strong> ${hotel?.name || "N/A"}</p>
                    <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.check_in_date).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Ngày trả phòng:</strong> ${new Date(booking.check_out_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <p>Vui lòng liên hệ với chúng tôi để được hỗ trợ và tìm giải pháp thay thế phù hợp.</p>
                  <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ WeTour</strong></p>
                </div>
              `;
              await sendEmailNotification(
                booking.guest_email,
                "⚠️ Thông báo về phòng đã đặt - WeTour",
                emailHtml
              );
            } catch (emailError) {
              console.error("Error sending email notification:", emailError);
            }
          }
        }

        if (bookings.length > 0) {
          console.log(`✅ Đã gửi thông báo cho ${bookings.length} người dùng về phòng "${room.name}" hết phòng`);
        }
      } catch (notifError) {
        console.error("Error sending notifications for room status change:", notifError);
        // Không fail request nếu notification lỗi
      }
    }

    res.json({ message: "Cập nhật phòng thành công", room });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Xóa phòng
router.delete("/:hotelId/rooms/:roomId", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const room = await HotelRoom.findOne({
      where: {
        id: req.params.roomId,
        hotel_id: req.params.hotelId
      }
    });

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    await room.destroy();
    res.json({ message: "Xóa phòng thành công" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;


