import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Tour } from "../models/index.js";
import OpenAI from "openai";

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// AI Tour Recommendation
router.post("/recommend", verifyToken, async (req, res) => {
  try {
    const { preferences, budget, duration, destination, interests, travelStyle } = req.body;

    // Validate input
    if (!preferences && !budget && !duration && !destination && !interests && !travelStyle) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp ít nhất một thông tin để nhận gợi ý" 
      });
    }

    // Fetch all available tours
    const tours = await Tour.findAll({
      where: { status: "active" },
      attributes: [
        "id", "name", "destination", "description", "price", 
        "duration", "category", "highlights", "available_dates"
      ]
    });

    if (tours.length === 0) {
      return res.status(404).json({ message: "Hiện tại không có tour nào khả dụng" });
    }

    // Prepare tour data for AI
    const toursData = tours.map(tour => ({
      id: tour.id,
      name: tour.name,
      destination: tour.destination,
      description: tour.description || "",
      price: tour.price,
      duration: tour.duration,
      category: tour.category || "",
      highlights: tour.highlights || ""
    }));

    // Build user preferences string
    let userInput = "Người dùng muốn tìm tour với các yêu cầu sau:\n";
    if (preferences) userInput += `- Sở thích/Ưu tiên: ${preferences}\n`;
    if (budget) userInput += `- Ngân sách: ${budget}\n`;
    if (duration) userInput += `- Thời gian: ${duration}\n`;
    if (destination) userInput += `- Điểm đến mong muốn: ${destination}\n`;
    if (interests) userInput += `- Sở thích du lịch: ${interests}\n`;
    if (travelStyle) userInput += `- Phong cách du lịch: ${travelStyle}\n`;

    // Create prompt for OpenAI
    const prompt = `Bạn là một chuyên gia tư vấn du lịch. Dựa trên thông tin người dùng và danh sách tour có sẵn, hãy gợi ý các tour phù hợp nhất.

${userInput}

Danh sách tour có sẵn:
${JSON.stringify(toursData, null, 2)}

Hãy phân tích và trả về:
1. Danh sách ID các tour phù hợp nhất (tối đa 5 tour), sắp xếp theo độ phù hợp giảm dần
2. Lý do tại sao các tour này phù hợp với yêu cầu của người dùng
3. Gợi ý bổ sung nếu có

Trả về dưới dạng JSON với format:
{
  "recommendedTourIds": [1, 2, 3],
  "reasoning": "Lý do chi tiết...",
  "suggestions": "Gợi ý bổ sung..."
}`;

    let aiResponse;
    let recommendedTourIds = [];

    // Try to use OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Bạn là một chuyên gia tư vấn du lịch chuyên nghiệp. Hãy phân tích kỹ lưỡng và đưa ra gợi ý chính xác."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        const content = completion.choices[0].message.content;
        
        // Try to parse JSON from response
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0]);
            recommendedTourIds = aiResponse.recommendedTourIds || [];
          } else {
            // Fallback: extract IDs from text
            const idMatches = content.match(/tour.*?(\d+)/gi);
            if (idMatches) {
              recommendedTourIds = idMatches.map(m => parseInt(m.match(/\d+/)[0]));
            }
          }
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          // Fallback to rule-based recommendation
          recommendedTourIds = getRuleBasedRecommendations(toursData, {
            preferences, budget, duration, destination, interests, travelStyle
          });
          aiResponse = {
            reasoning: content.substring(0, 500) || "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
            suggestions: "Vui lòng xem chi tiết từng tour để đưa ra quyết định cuối cùng."
          };
        }
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        // Fallback to rule-based recommendation
        recommendedTourIds = getRuleBasedRecommendations(toursData, {
          preferences, budget, duration, destination, interests, travelStyle
        });
        aiResponse = {
          reasoning: "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
          suggestions: "Hãy xem chi tiết từng tour để đưa ra quyết định."
        };
      }
    } else {
      // Fallback: Rule-based recommendation if no OpenAI API key
      recommendedTourIds = getRuleBasedRecommendations(toursData, {
        preferences, budget, duration, destination, interests, travelStyle
      });
      aiResponse = {
        reasoning: "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
        suggestions: "Hãy xem chi tiết từng tour để đưa ra quyết định."
      };
    }

    // Get recommended tours
    const recommendedTours = tours.filter(tour => 
      recommendedTourIds.includes(tour.id)
    );

    // If no tours matched, return top tours
    if (recommendedTours.length === 0) {
      const topTours = tours.slice(0, 5);
      return res.json({
        tours: topTours,
        reasoning: "Dựa trên yêu cầu của bạn, đây là các tour phổ biến nhất hiện có.",
        suggestions: "Bạn có thể điều chỉnh tiêu chí tìm kiếm để nhận được gợi ý chính xác hơn.",
        aiPowered: false
      });
    }

    res.json({
      tours: recommendedTours,
      reasoning: aiResponse.reasoning || "Các tour này phù hợp với yêu cầu của bạn.",
      suggestions: aiResponse.suggestions || "",
      aiPowered: !!process.env.OPENAI_API_KEY
    });

  } catch (error) {
    console.error("AI recommendation error:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.",
      error: error.message 
    });
  }
});

// Rule-based recommendation fallback
function getRuleBasedRecommendations(tours, criteria) {
  const scores = tours.map(tour => {
    let score = 0;

    // Match destination
    if (criteria.destination && tour.destination) {
      const tourDest = tour.destination.toLowerCase();
      const userDest = criteria.destination.toLowerCase();
      if (tourDest.includes(userDest) || userDest.includes(tourDest)) {
        score += 10;
      }
    }

    // Match budget
    if (criteria.budget) {
      const budgetNum = parseInt(criteria.budget.toString().replace(/\D/g, ""));
      if (budgetNum && tour.price) {
        if (tour.price <= budgetNum) {
          score += 8;
        } else if (tour.price <= budgetNum * 1.2) {
          score += 4;
        }
      }
    }

    // Match duration
    if (criteria.duration && tour.duration) {
      const tourDur = parseInt(tour.duration.toString().replace(/\D/g, ""));
      const userDur = parseInt(criteria.duration.toString().replace(/\D/g, ""));
      if (tourDur && userDur) {
        const diff = Math.abs(tourDur - userDur);
        if (diff === 0) score += 8;
        else if (diff <= 1) score += 5;
        else if (diff <= 2) score += 3;
      }
    }

    // Match interests/preferences in description
    if (criteria.interests || criteria.preferences) {
      const searchText = (criteria.interests || criteria.preferences || "").toLowerCase();
      const tourText = (tour.description + " " + tour.highlights + " " + tour.category).toLowerCase();
      const keywords = searchText.split(/[,\s]+/).filter(k => k.length > 2);
      keywords.forEach(keyword => {
        if (tourText.includes(keyword)) score += 3;
      });
    }

    return { id: tour.id, score };
  });

  // Sort by score and return top 5 IDs
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(item => item.score > 0)
    .map(item => item.id);
}

export default router;

