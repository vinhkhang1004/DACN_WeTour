import express from "express";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "../middleware/authMiddleware.js";
import { CustomTour, CustomTourActivity, Activity, User } from "../models/index.js";

const router = express.Router();

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ✅ AI gợi ý activities dựa trên destination
router.post("/activities/ai-suggest", async (req, res) => {
  try {
    const { destination, tourType, budget, adults, children } = req.body;
    
    if (!destination) {
      return res.status(400).json({ message: "Vui lòng cung cấp điểm đến" });
    }

    // Lấy activities hiện có từ database để tham khảo
    const existingActivities = await Activity.findAll({
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    // Tạo prompt cho AI
    const prompt = `Bạn là một chuyên gia tư vấn du lịch Việt Nam. Dựa trên thông tin sau, hãy gợi ý các hoạt động du lịch phù hợp:

Điểm đến: ${destination}
${tourType ? `Loại hình tour: ${tourType}` : ''}
${budget ? `Ngân sách: ${budget.toLocaleString()} VNĐ` : ''}
${adults ? `Số người lớn: ${adults}` : ''}
${children ? `Số trẻ em: ${children}` : ''}

Hãy gợi ý 8-12 hoạt động du lịch phù hợp tại ${destination}, bao gồm:
- Tham quan (di tích, danh lam thắng cảnh)
- Ăn uống (đặc sản địa phương)
- Mua sắm (chợ, trung tâm thương mại)
- Giải trí (bãi biển, công viên, spa, v.v.)

Mỗi hoạt động cần có:
- Tên hoạt động (tiếng Việt, ngắn gọn, hấp dẫn)
- Mô tả ngắn (1-2 câu)
- Thể loại (một trong: Tham quan, Ăn uống, Mua sắm, Giải trí)
- Thời lượng ước tính (giờ, ví dụ: 2.0, 3.5)
- Giá ước tính mỗi người (VNĐ, 0 nếu miễn phí)
- Image keyword: Từ khóa tiếng Anh để tìm ảnh (ví dụ: "vietnam temple", "vietnamese food", "floating market", "beach vietnam")

Trả về dưới dạng JSON array với format:
[
  {
    "name": "Tên hoạt động",
    "description": "Mô tả ngắn gọn",
    "category": "Tham quan",
    "duration_hours": 2.0,
    "price_per_person": 50000,
    "location": "${destination}",
    "image_keyword": "vietnam temple"
  },
  ...
]

Chỉ trả về JSON array, không có text thêm.`;

    let aiActivities = [];

    // Thử dùng Gemini nếu có API key
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        // Thử các model name khác nhau nếu một cái không hoạt động
        const modelsToTry = [
          "gemini-1.5-flash-latest",
          "gemini-1.5-flash", 
          "gemini-1.5-pro",
          "gemini-pro"
        ];
        
        const fullPrompt = `Bạn là chuyên gia tư vấn du lịch Việt Nam. Hãy trả về JSON array chính xác theo format yêu cầu.

${prompt}`;

        let result = null;
        let lastError = null;
        
        // Thử từng model cho đến khi một cái hoạt động
        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(fullPrompt);
            break; // Thành công, thoát khỏi loop
          } catch (modelError) {
            lastError = modelError;
            continue; // Thử model tiếp theo
          }
        }
        
        if (!result) {
          throw lastError || new Error("All Gemini models failed");
        }
        const response = await result.response;
        const content = response.text().trim();
        
        // Parse JSON từ response
        try {
          // Tìm JSON array trong response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiActivities = JSON.parse(jsonMatch[0]);
            
            // Validate và clean data
            aiActivities = aiActivities
              .filter(act => act.name && act.category && act.duration_hours)
              .map(act => {
                // Tạo URL ảnh từ Unsplash dựa trên image_keyword
                let imageUrl = null;
                if (act.image_keyword) {
                  // Unsplash Source API - miễn phí, không cần API key
                  const keyword = encodeURIComponent(act.image_keyword.trim());
                  imageUrl = `https://source.unsplash.com/800x500/?${keyword}`;
                } else {
                  // Fallback: tạo keyword từ tên activity và location
                  const fallbackKeyword = `${act.name} ${act.location || destination}`.toLowerCase()
                    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
                    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
                    .replace(/[ìíịỉĩ]/g, 'i')
                    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
                    .replace(/[ùúụủũưừứựửữ]/g, 'u')
                    .replace(/[ỳýỵỷỹ]/g, 'y')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, ',');
                  imageUrl = `https://source.unsplash.com/800x500/?${encodeURIComponent(fallbackKeyword)}`;
                }
                
                return {
                  name: act.name.trim(),
                  description: (act.description || "").trim(),
                  category: act.category.trim(),
                  duration_hours: parseFloat(act.duration_hours) || 2.0,
                  price_per_person: parseInt(act.price_per_person) || 0,
                  location: act.location || destination,
                  image: imageUrl,
                  image_keyword: act.image_keyword || null
                };
              })
              .slice(0, 12); // Giới hạn tối đa 12 activities
          }
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
      }
    }

    // Fallback: Tạo activities dựa trên rule-based nếu không có Gemini hoặc AI fail
    if (aiActivities.length === 0) {
      aiActivities = generateRuleBasedActivities(destination, tourType, budget);
    }

    res.json({
      activities: aiActivities,
      aiPowered: aiActivities.length > 0 && process.env.GEMINI_API_KEY ? true : false,
      destination: destination
    });

  } catch (error) {
    console.error("AI activity suggestion error:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo gợi ý hoạt động. Vui lòng thử lại.",
      error: error.message 
    });
  }
});

// Rule-based activity generation fallback
function generateRuleBasedActivities(destination, tourType, budget) {
  const activities = [];
  const location = destination.split(",")[0].trim();
  
  // Template activities dựa trên location
  const templates = {
    "Đà Nẵng": [
      { name: "Tham quan Cầu Vàng – Bà Nà Hills", category: "Tham quan", duration: 5.0, price: 750000 },
      { name: "Tắm biển Mỹ Khê", category: "Giải trí", duration: 2.5, price: 0 },
      { name: "Thưởng thức Mỳ Quảng", category: "Ăn uống", duration: 1.0, price: 150000 },
      { name: "Tham quan Chùa Linh Ứng", category: "Tham quan", duration: 2.0, price: 0 },
      { name: "Mua sắm tại Chợ Hàn", category: "Mua sắm", duration: 2.0, price: 0 }
    ],
    "Hội An": [
      { name: "Tham quan Phố Cổ Hội An", category: "Tham quan", duration: 4.0, price: 120000 },
      { name: "Thưởng thức Cao Lầu", category: "Ăn uống", duration: 1.0, price: 120000 },
      { name: "Tham quan Làng Gốm Thanh Hà", category: "Tham quan", duration: 2.5, price: 80000 }
    ],
    "Hà Nội": [
      { name: "Tham quan Văn Miếu Quốc Tử Giám", category: "Tham quan", duration: 2.0, price: 30000 },
      { name: "Thưởng thức Phở Hà Nội", category: "Ăn uống", duration: 1.0, price: 80000 },
      { name: "Tham quan Hồ Hoàn Kiếm", category: "Tham quan", duration: 1.5, price: 0 },
      { name: "Mua sắm tại Phố Cổ Hà Nội", category: "Mua sắm", duration: 3.0, price: 0 }
    ]
  };

  // Tìm template phù hợp
  const matchedTemplate = Object.keys(templates).find(key => 
    location.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(location.toLowerCase())
  );

  if (matchedTemplate) {
    // Map category to image keywords
    const categoryKeywords = {
      "Tham quan": "vietnam temple",
      "Ăn uống": "vietnamese food",
      "Mua sắm": "vietnam market",
      "Giải trí": "vietnam beach"
    };
    
    return templates[matchedTemplate].map(act => {
      const keyword = categoryKeywords[act.category] || "vietnam tourism";
      return {
        name: act.name,
        description: `Hoạt động du lịch tại ${location}`,
        category: act.category,
        duration_hours: act.duration,
        price_per_person: act.price,
        location: location,
        image: `https://source.unsplash.com/800x500/?${encodeURIComponent(keyword)}`,
        image_keyword: keyword
      };
    });
  }

  // Default activities nếu không tìm thấy template
  return [
    { name: `Tham quan ${location}`, category: "Tham quan", duration_hours: 2.0, price_per_person: 0, location, image: null },
    { name: `Thưởng thức đặc sản ${location}`, category: "Ăn uống", duration_hours: 1.0, price_per_person: 100000, location, image: null },
    { name: `Mua sắm tại ${location}`, category: "Mua sắm", duration_hours: 2.0, price_per_person: 0, location, image: null }
  ].map(act => ({
    ...act,
    description: `Hoạt động du lịch tại ${location}`
  }));
}

// ✅ Lấy danh sách activities (public)
router.get("/activities", async (req, res) => {
  try {
    const { category, search, location } = req.query;
    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      // Tìm kiếm location (Sequelize sẽ tự động case-insensitive với COLLATE utf8mb4_unicode_ci)
      where.location = { [Op.like]: `%${location}%` };
    }
    
    let activities = await Activity.findAll({ 
      where,
      order: location ? [['location', 'ASC'], ['name', 'ASC']] : [['name', 'ASC']]
    });
    
    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      activities = activities.filter(activity => 
        activity.name.toLowerCase().includes(searchLower) ||
        (activity.description && activity.description.toLowerCase().includes(searchLower))
      );
    }
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Tạo custom tour (có thể là user hoặc guest)
router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    
    // Nếu có token, lấy user_id
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Token được tạo với { id: user.id, role: user.role } trong userRoutes.js
        userId = decoded.id || decoded.userId || null;
        if (userId) {
          console.log("✅ User authenticated, userId:", userId);
        } else {
          console.log("⚠️ Token decoded but no id/userId found:", decoded);
        }
      } catch (e) {
        console.log("⚠️ Token invalid or expired:", e.message);
        // Token không hợp lệ, tiếp tục như guest
        userId = null;
      }
    } else {
      console.log("ℹ️ No authorization header, treating as guest");
    }
    
    const {
      destination,
      start_date,
      end_date,
      adults,
      children,
      tour_type,
      budget,
      activities, // Array of { activity_id, day_number, start_time, order_index, notes }
      guest_name,
      guest_email,
      guest_phone
    } = req.body;
    
    // Validate
    if (!destination || !start_date || !end_date) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    
    // Chỉ yêu cầu thông tin guest nếu không có userId (chưa đăng nhập)
    if (!userId) {
      if (!guest_name || !guest_email || !guest_phone) {
        console.log("❌ Guest booking missing contact info:", { guest_name, guest_email, guest_phone });
        return res.status(400).json({ message: "Vui lòng cung cấp thông tin liên hệ" });
      }
      console.log("✅ Guest booking with contact info");
    } else {
      console.log("✅ User booking, userId:", userId);
    }
    
    // Tính toán estimated_cost và total_hours
    let estimatedCost = 0;
    let totalHours = 0;
    
    if (activities && activities.length > 0) {
      const activityIds = activities.map(a => a.activity_id);
      const activityData = await Activity.findAll({
        where: { id: activityIds }
      });
      
      const activityMap = {};
      activityData.forEach(a => {
        activityMap[a.id] = a;
      });
      
      activities.forEach(item => {
        const activity = activityMap[item.activity_id];
        if (activity) {
          totalHours += parseFloat(activity.duration_hours || 0);
          const price = parseFloat(activity.price_per_person || 0);
          estimatedCost += price * (adults || 1) + price * 0.7 * (children || 0);
        }
      });
    }
    
    // Tạo custom tour
    const customTour = await CustomTour.create({
      user_id: userId,
      guest_name: userId ? null : guest_name,
      guest_email: userId ? null : guest_email,
      guest_phone: userId ? null : guest_phone,
      destination,
      start_date,
      end_date,
      adults: adults || 1,
      children: children || 0,
      tour_type: tour_type || "Nghỉ dưỡng",
      budget: budget ? parseFloat(budget) : null,
      estimated_cost: estimatedCost,
      total_hours: totalHours,
      status: "pending"
    });
    
    // Thêm activities
    if (activities && activities.length > 0) {
      await CustomTourActivity.bulkCreate(
        activities.map(item => ({
          custom_tour_id: customTour.id,
          activity_id: item.activity_id,
          day_number: item.day_number,
          start_time: item.start_time || null,
          order_index: item.order_index || 0,
          notes: item.notes || null
        }))
      );
    }
    
    // Reload với activities
    const result = await CustomTour.findByPk(customTour.id, {
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }]
        },
        { model: User, required: false }
      ]
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating custom tour:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy custom tours của user (cần đăng nhập)
router.get("/my-tours", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const customTours = await CustomTour.findAll({
      where: { user_id: userId },
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        }
      ],
      order: [["created_at", "DESC"]]
    });
    
    res.json(customTours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Lấy chi tiết custom tour
router.get("/:id", async (req, res) => {
  try {
    const customTour = await CustomTour.findByPk(req.params.id, {
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        },
        { model: User, required: false }
      ]
    });
    
    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    
    res.json(customTour);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Cập nhật custom tour (draft)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const customTour = await CustomTour.findByPk(req.params.id);
    
    if (!customTour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    
    // Chỉ cho phép user sở hữu tour hoặc admin
    if (customTour.user_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    // Chỉ cho phép cập nhật nếu status là pending
    if (customTour.status !== "pending") {
      return res.status(400).json({ message: "Không thể cập nhật tour đã được xác nhận" });
    }
    
    const {
      destination,
      start_date,
      end_date,
      adults,
      children,
      tour_type,
      budget,
      activities
    } = req.body;
    
    // Tính toán lại estimated_cost và total_hours
    let estimatedCost = 0;
    let totalHours = 0;
    
    if (activities && activities.length > 0) {
      const activityIds = activities.map(a => a.activity_id);
      const activityData = await Activity.findAll({
        where: { id: activityIds }
      });
      
      const activityMap = {};
      activityData.forEach(a => {
        activityMap[a.id] = a;
      });
      
      activities.forEach(item => {
        const activity = activityMap[item.activity_id];
        if (activity) {
          totalHours += parseFloat(activity.duration_hours || 0);
          const price = parseFloat(activity.price_per_person || 0);
          estimatedCost += price * (adults || customTour.adults) + price * 0.7 * (children || customTour.children);
        }
      });
    }
    
    // Cập nhật tour
    await customTour.update({
      destination: destination || customTour.destination,
      start_date: start_date || customTour.start_date,
      end_date: end_date || customTour.end_date,
      adults: adults !== undefined ? adults : customTour.adults,
      children: children !== undefined ? children : customTour.children,
      tour_type: tour_type || customTour.tour_type,
      budget: budget !== undefined ? parseFloat(budget) : customTour.budget,
      estimated_cost: estimatedCost,
      total_hours: totalHours
    });
    
    // Xóa activities cũ và thêm mới
    if (activities) {
      await CustomTourActivity.destroy({
        where: { custom_tour_id: customTour.id }
      });
      
      if (activities.length > 0) {
        await CustomTourActivity.bulkCreate(
          activities.map(item => ({
            custom_tour_id: customTour.id,
            activity_id: item.activity_id,
            day_number: item.day_number,
            start_time: item.start_time || null,
            order_index: item.order_index || 0,
            notes: item.notes || null
          }))
        );
      }
    }
    
    // Reload với activities
    const result = await CustomTour.findByPk(customTour.id, {
      include: [
        {
          model: CustomTourActivity,
          as: "Activities",
          include: [{ model: Activity, as: "Activity" }],
          order: [["day_number", "ASC"], ["order_index", "ASC"]]
        },
        { model: User, required: false }
      ]
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error updating custom tour:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

