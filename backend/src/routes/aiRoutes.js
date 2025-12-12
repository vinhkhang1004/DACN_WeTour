import express from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { Tour } from "../models/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { matchesSearch } from "../utils/vietnameseUtils.js";
import { fetchWebsiteContent } from "../utils/websiteFetcher.js";

const router = express.Router();

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// AI Tour Recommendation (không yêu cầu đăng nhập)
router.post("/recommend", optionalAuth, async (req, res) => {
  try {
    const { preferences, budget, duration, destination, interests, travelStyle, websiteUrl } = req.body;

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

    // Fetch website content if URL is provided
    let websiteContent = "";
    if (websiteUrl && websiteUrl.trim()) {
      const websiteData = await fetchWebsiteContent(websiteUrl);
      if (websiteData.success) {
        websiteContent = `\n\nThông tin từ website ${websiteData.url}:\n${websiteData.content}`;
      } else {
        console.warn("Failed to fetch website content:", websiteData.error);
        // Continue without website content
      }
    }

    // Build user preferences string
    let userInput = "Người dùng muốn tìm tour với các yêu cầu sau:\n";
    if (preferences) userInput += `- Sở thích/Ưu tiên: ${preferences}\n`;
    if (budget) userInput += `- Ngân sách: ${budget}\n`;
    if (duration) userInput += `- Thời gian: ${duration}\n`;
    if (destination) userInput += `- Điểm đến mong muốn: ${destination}\n`;
    if (interests) userInput += `- Sở thích du lịch: ${interests}\n`;
    if (travelStyle) userInput += `- Phong cách du lịch: ${travelStyle}\n`;
    if (websiteContent) userInput += websiteContent;

    // Create prompt for Gemini
    const prompt = `Bạn là một chuyên gia tư vấn du lịch. Dựa trên thông tin người dùng và danh sách tour có sẵn, hãy gợi ý các tour phù hợp nhất.

${userInput}

Danh sách tour có sẵn:
${JSON.stringify(toursData, null, 2)}

QUAN TRỌNG - Tiêu chí lựa chọn tour:
1. ƯU TIÊN CAO NHẤT: Tour phải KHỚP CHÍNH XÁC với các yêu cầu của người dùng:
   - Nếu người dùng chỉ định thời gian (ví dụ: 6 ngày), chỉ chọn tour có thời gian GẦN NHẤT với yêu cầu (chênh lệch tối đa 1-2 ngày)
   - Nếu người dùng chỉ định điểm đến, chỉ chọn tour đến đúng điểm đến đó
   - Nếu người dùng chỉ định ngân sách, chỉ chọn tour trong phạm vi ngân sách (có thể cao hơn tối đa 20%)
   - Nếu người dùng chỉ định sở thích/phong cách, chỉ chọn tour phù hợp với mô tả đó

2. CHỈ gợi ý các tour THỰC SỰ PHÙ HỢP. Nếu không có tour nào phù hợp, hãy giải thích rõ lý do.

3. Sắp xếp theo độ phù hợp: Tour match chính xác nhất đứng đầu.

Hãy phân tích và trả về:
1. Danh sách ID các tour phù hợp nhất (tối đa 5 tour), sắp xếp theo độ phù hợp giảm dần
2. Lý do CHI TIẾT tại sao các tour này phù hợp với yêu cầu của người dùng (phải giải thích rõ từng tiêu chí)
3. Gợi ý bổ sung nếu có

Trả về dưới dạng JSON với format:
{
  "recommendedTourIds": [1, 2, 3],
  "reasoning": "Lý do chi tiết...",
  "suggestions": "Gợi ý bổ sung..."
}`;

    let aiResponse;
    let recommendedTourIds = [];
    let useAIPowered = false;

    // Log user input để debug
    console.log("🔍 AI Recommendation Request:", {
      destination,
      duration,
      budget,
      interests,
      travelStyle,
      preferences: preferences?.substring(0, 50),
      websiteUrl: websiteUrl ? "provided" : "none"
    });

    // Always use rule-based first to ensure we have results based on user input
    const ruleBasedIds = getRuleBasedRecommendations(toursData, {
      preferences, budget, duration, destination, interests, travelStyle
    });
    console.log("📊 Rule-based recommendations:", ruleBasedIds);
    recommendedTourIds = ruleBasedIds;

    // Try to use Gemini if API key is available (for better reasoning)
    // Gemini sẽ được ưu tiên nếu có kết quả tốt hơn
    // Nhưng không throw error nếu Gemini fail - chỉ log và tiếp tục với rule-based
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        console.log("🤖 Attempting to use Gemini API for enhanced recommendations...");
        // Thử các model name khác nhau nếu một cái không hoạt động
        // Danh sách model để thử theo thứ tự ưu tiên
        const modelsToTry = [
          "gemini-1.5-flash-latest",
          "gemini-1.5-flash", 
          "gemini-1.5-pro",
          "gemini-pro"
        ];
        
        const fullPrompt = `Bạn là một chuyên gia tư vấn du lịch chuyên nghiệp. Hãy phân tích kỹ lưỡng và đưa ra gợi ý chính xác.

${prompt}`;

        let result = null;
        
        // Thử từng model cho đến khi một cái hoạt động
        for (const modelName of modelsToTry) {
          try {
            console.log(`  → Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(fullPrompt);
            console.log(`  ✅ Success with model: ${modelName}`);
            break; // Thành công, thoát khỏi loop
          } catch (modelError) {
            // Chỉ log warning, không throw - tiếp tục thử model khác
            console.log(`  ⚠️ Model ${modelName} not available: ${modelError.message?.substring(0, 100)}`);
            continue; // Thử model tiếp theo
          }
        }
        
        if (result) {
          const response = await result.response;
          const content = response.text();
          console.log("🤖 Gemini response received, length:", content.length);
          
          // Try to parse JSON from response
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              // Only use AI IDs if they make sense and are valid
              if (parsed.recommendedTourIds && Array.isArray(parsed.recommendedTourIds) && parsed.recommendedTourIds.length > 0) {
                // Validate that IDs exist in our tours
                const validIds = parsed.recommendedTourIds.filter(id => toursData.some(t => t.id === id));
                if (validIds.length > 0) {
                  // Kiểm tra xem AI có tìm được tour match tốt hơn không
                  // Nếu có, sử dụng kết quả từ AI
                  recommendedTourIds = validIds;
                  useAIPowered = true;
                  console.log("✅ Using Gemini AI recommendations:", validIds);
                } else {
                  console.log("⚠️ Gemini returned invalid tour IDs, using rule-based");
                }
              }
              aiResponse = {
                reasoning: parsed.reasoning || content.substring(0, 500),
                suggestions: parsed.suggestions || "Vui lòng xem chi tiết từng tour để đưa ra quyết định cuối cùng."
              };
            } else {
              // Use AI reasoning but keep rule-based IDs
              aiResponse = {
                reasoning: content.substring(0, 500) || "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
                suggestions: "Vui lòng xem chi tiết từng tour để đưa ra quyết định cuối cùng."
              };
            }
          } catch (parseError) {
            console.warn("⚠️ Error parsing AI response, using rule-based:", parseError.message);
            // Keep rule-based IDs, use AI reasoning if available
            aiResponse = {
              reasoning: content.substring(0, 500) || "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
              suggestions: "Vui lòng xem chi tiết từng tour để đưa ra quyết định cuối cùng."
            };
          }
        } else {
          // Tất cả models đều fail - sử dụng rule-based
          console.log("ℹ️ All Gemini models unavailable, using rule-based recommendations");
          aiResponse = {
            reasoning: "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
            suggestions: "Hãy xem chi tiết từng tour để đưa ra quyết định."
          };
        }
      } catch (geminiError) {
        // Log error nhưng không throw - tiếp tục với rule-based
        console.warn("⚠️ Gemini API error (using rule-based fallback):", geminiError.message?.substring(0, 100));
        aiResponse = {
          reasoning: "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
          suggestions: "Hãy xem chi tiết từng tour để đưa ra quyết định."
        };
      }
    } else {
      // No Gemini API key - use rule-based with default reasoning
      console.log("ℹ️ No Gemini API key configured, using rule-based recommendations");
      aiResponse = {
        reasoning: "Dựa trên yêu cầu của bạn, chúng tôi đã tìm thấy các tour phù hợp.",
        suggestions: "Hãy xem chi tiết từng tour để đưa ra quyết định."
      };
    }

    // Get recommended tours - ensure we always have results based on input
    let recommendedTours = tours.filter(tour => 
      recommendedTourIds.includes(tour.id)
    );

    console.log("✅ Final recommended tour IDs:", recommendedTourIds);
    console.log("✅ Final recommended tours count:", recommendedTours.length);

    // If no tours matched, cập nhật reasoning message
    if (recommendedTours.length === 0) {
      console.log("⚠️ No tours matched user criteria");
      aiResponse = {
        reasoning: `Hiện tại không có tour nào khớp với yêu cầu của bạn${duration ? ` (thời gian: ${duration})` : ""}${destination ? ` (điểm đến: ${destination})` : ""}${budget ? ` (ngân sách: ${budget})` : ""}.`,
        suggestions: "Vui lòng thử điều chỉnh các tiêu chí tìm kiếm (đặc biệt là thời gian, điểm đến hoặc ngân sách) để nhận được gợi ý phù hợp hơn."
      };
    }

    res.json({
      tours: recommendedTours,
      reasoning: aiResponse.reasoning || "Các tour này phù hợp với yêu cầu của bạn.",
      suggestions: aiResponse.suggestions || "",
      aiPowered: useAIPowered
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
  console.log("🔍 Starting rule-based recommendations with criteria:", {
    duration: criteria.duration,
    destination: criteria.destination,
    budget: criteria.budget,
    interests: criteria.interests,
    travelStyle: criteria.travelStyle
  });
  
  const scores = tours.map(tour => {
    let score = 0;
    let hasMatch = false;

    // Match destination (hỗ trợ tìm kiếm không dấu)
    if (criteria.destination && tour.destination) {
      const tourDest = tour.destination.toLowerCase().trim();
      const userDest = criteria.destination.toLowerCase().trim();
      
      // Exact match (có thể không dấu)
      if (matchesSearch(tourDest, userDest)) {
        score += 25;
        hasMatch = true;
        console.log(`  Tour ${tour.id}: ✅ Exact destination match (${tour.destination})`);
      } else {
        // Partial match - kiểm tra xem tên địa điểm có chứa nhau không
        if (tourDest.includes(userDest) || userDest.includes(tourDest)) {
          score += 15;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Partial destination match (${tour.destination})`);
        } else {
          // Kiểm tra từng từ trong destination (ví dụ: "Hà Nội" match với "Hanoi")
          const tourWords = tourDest.split(/[\s,]+/);
          const userWords = userDest.split(/[\s,]+/);
          const matchingWords = tourWords.filter(tw => 
            userWords.some(uw => matchesSearch(tw, uw) || tw.includes(uw) || uw.includes(tw))
          );
          if (matchingWords.length > 0) {
            score += 8;
            hasMatch = true;
            console.log(`  Tour ${tour.id}: ✅ Word-based destination match (${tour.destination})`);
          } else {
            console.log(`  Tour ${tour.id}: ❌ No destination match (tour: ${tour.destination}, user: ${criteria.destination})`);
          }
        }
      }
    }

    // Match budget - parse better và strict hơn
    if (criteria.budget) {
      const budgetStr = criteria.budget.toString().toLowerCase().trim();
      let budgetNum = 0;
      
      console.log(`  Tour ${tour.id}: Parsing budget input: "${criteria.budget}"`);
      
      // Parse "5 triệu", "5tr", "5.000.000", "5000000", etc.
      if (budgetStr.includes("triệu") || budgetStr.includes("tr") || budgetStr.includes("million")) {
        // Extract số trước từ "triệu" hoặc "tr"
        const match = budgetStr.match(/([\d.,]+)\s*(?:triệu|tr|million)/);
        if (match) {
          const numStr = match[1].replace(/,/g, "").replace(/\./g, "");
          const num = parseFloat(numStr);
          budgetNum = num * 1000000;
          console.log(`    → Parsed as ${num} triệu = ${budgetNum.toLocaleString()} VNĐ`);
        } else {
          // Fallback: lấy số và nhân với 1 triệu
          const numStr = budgetStr.replace(/[^\d.,]/g, "").replace(/,/g, "").replace(/\./g, "");
          budgetNum = parseFloat(numStr) * 1000000;
          console.log(`    → Fallback parse: ${budgetNum.toLocaleString()} VNĐ`);
        }
      } else if (budgetStr.includes("nghìn") || budgetStr.includes("k") || budgetStr.includes("thousand")) {
        // Extract số trước từ "nghìn" hoặc "k"
        const match = budgetStr.match(/([\d.,]+)\s*(?:nghìn|k|thousand)/);
        if (match) {
          const numStr = match[1].replace(/,/g, "").replace(/\./g, "");
          const num = parseFloat(numStr);
          budgetNum = num * 1000;
          console.log(`    → Parsed as ${num} nghìn = ${budgetNum.toLocaleString()} VNĐ`);
        } else {
          const numStr = budgetStr.replace(/[^\d.,]/g, "").replace(/,/g, "").replace(/\./g, "");
          budgetNum = parseFloat(numStr) * 1000;
          console.log(`    → Fallback parse: ${budgetNum.toLocaleString()} VNĐ`);
        }
      } else {
        // Parse số thuần: có thể là "5000000", "5.000.000", "5,000,000"
        // Loại bỏ dấu phẩy và chấm, sau đó parse
        const cleaned = budgetStr.replace(/[,\.]/g, "");
        budgetNum = parseInt(cleaned);
        console.log(`    → Parsed as number: ${budgetNum.toLocaleString()} VNĐ`);
        
        // Nếu số quá nhỏ (< 1000), có thể là triệu (ví dụ: "5" = 5 triệu)
        if (budgetNum < 1000 && budgetNum > 0) {
          budgetNum = budgetNum * 1000000;
          console.log(`    → Interpreted as ${budgetNum / 1000000} triệu = ${budgetNum.toLocaleString()} VNĐ`);
        }
      }
      
      if (budgetNum > 0 && tour.price) {
        const priceRatio = tour.price / budgetNum;
        const diffPercent = ((tour.price - budgetNum) / budgetNum * 100).toFixed(1);
        const budgetPercent = (tour.price / budgetNum * 100).toFixed(1);
        
        // Ưu tiên các tour có giá gần với ngân sách (70-110% của ngân sách)
        if (tour.price >= budgetNum * 0.7 && tour.price <= budgetNum * 1.1) {
          // Trong khoảng 70-110% ngân sách - điểm cao nhất (ưu tiên gần 100% nhất)
          const proximityScore = 30 - Math.abs(100 - parseFloat(budgetPercent)) * 0.3; // Gần 100% = điểm cao hơn
          score += Math.max(20, proximityScore);
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Budget excellent match (${budgetPercent}% of budget, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        } else if (tour.price >= budgetNum * 0.5 && tour.price < budgetNum * 0.7) {
          // Trong khoảng 50-70% ngân sách - chấp nhận được nhưng điểm thấp hơn
          score += 10;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Budget acceptable (${budgetPercent}% of budget, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        } else if (tour.price > budgetNum * 1.1 && tour.price <= budgetNum * 1.2) {
          // Cao hơn ngân sách 10-20% - vẫn chấp nhận được
          score += 8;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Budget acceptable (+${diffPercent}%, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        } else if (tour.price < budgetNum * 0.5) {
          // Quá rẻ so với ngân sách - không phù hợp, trừ điểm
          score -= 20;
          console.log(`  Tour ${tour.id}: ❌ Budget too low (${budgetPercent}% of budget, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        } else if (tour.price > budgetNum * 1.2 && tour.price <= budgetNum * 1.3) {
          // Cao hơn 20-30% - điểm thấp, không set hasMatch
          score += 2;
          console.log(`  Tour ${tour.id}: ⚠️ Budget slightly over (+${diffPercent}%, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        } else {
          // Vượt quá 30% hoặc quá rẻ - không match
          score -= 25;
          console.log(`  Tour ${tour.id}: ❌ Budget out of range (${budgetPercent}% of budget, tour: ${tour.price.toLocaleString()} VNĐ, budget: ${budgetNum.toLocaleString()} VNĐ)`);
        }
      } else {
        console.log(`  Tour ${tour.id}: ⚠️ Budget parse failed or no tour price. budgetNum=${budgetNum}, tour.price=${tour.price}`);
      }
    }

    // Match duration - parse better và ưu tiên match chính xác
    // Đây là tiêu chí quan trọng, nếu có thì phải match tương đối gần
    // Duration có thể là: "3 ngày 2 đêm", "3 ngày", "3N2Đ", etc.
    if (criteria.duration && tour.duration) {
      // Parse tour duration - lấy số đầu tiên trước "ngày" hoặc "N"
      const tourDurStr = tour.duration.toString().toLowerCase().trim();
      let tourDur = 0;
      
      // Thử match "X ngày" hoặc "XN" hoặc "XNĐ" (ví dụ: 3N2Đ = 3 ngày)
      const tourMatch = tourDurStr.match(/(\d+)\s*(?:ngày|n(?![a-z])|day)/i);
      if (tourMatch) {
        tourDur = parseInt(tourMatch[1]);
      } else {
        // Fallback: lấy số đầu tiên (nhưng có thể sai nếu có format như "3N2Đ")
        const firstNum = tourDurStr.match(/^(\d+)/);
        tourDur = firstNum ? parseInt(firstNum[1]) : parseInt(tourDurStr.replace(/\D/g, ""));
      }
      
      // Parse user duration - lấy số đầu tiên
      const userDurStr = criteria.duration.toString().toLowerCase().trim();
      const userMatch = userDurStr.match(/(\d+)\s*(?:ngày|n|day)/);
      const userDur = userMatch ? parseInt(userMatch[1]) : parseInt(userDurStr.replace(/\D/g, ""));
      
      if (tourDur && userDur && tourDur > 0 && userDur > 0) {
        const diff = Math.abs(tourDur - userDur);
        console.log(`  Tour ${tour.id} (${tour.name}): tourDur=${tourDur}, userDur=${userDur}, diff=${diff}`);
        
        if (diff === 0) {
          // Match chính xác - điểm cao nhất
          score += 30;
          hasMatch = true;
          console.log(`    ✅ Exact match! score=${score}, hasMatch=${hasMatch}`);
        } else if (diff === 1) {
          // Chênh lệch 1 ngày - vẫn tốt
          score += 20;
          hasMatch = true;
          console.log(`    ✅ Good match (1 day diff)! score=${score}, hasMatch=${hasMatch}`);
        } else if (diff === 2) {
          // Chênh lệch 2 ngày - chấp nhận được
          score += 12;
          hasMatch = true;
          console.log(`    ✅ Acceptable match (2 days diff)! score=${score}, hasMatch=${hasMatch}`);
        } else if (diff === 3) {
          // Chênh lệch 3 ngày - không đủ gần, nhưng vẫn có thể chấp nhận nếu không có lựa chọn khác
          score += 3;
          console.log(`    ⚠️ Weak match (3 days diff), no hasMatch. score=${score}`);
        } else {
          // Chênh lệch > 3 ngày - không match, trừ điểm mạnh để loại bỏ
          score -= 30;
          console.log(`    ❌ No match (${diff} days diff). score=${score}`);
        }
      } else {
        console.log(`  Tour ${tour.id} (${tour.name}): Failed to parse duration. tourDur=${tourDur}, userDur=${userDur}`);
      }
    }

    // Match interests/preferences in description (hỗ trợ tìm kiếm không dấu)
    if (criteria.interests || criteria.preferences) {
      const searchText = (criteria.interests || criteria.preferences || "").trim();
      if (searchText && searchText.length > 0) {
        // Tạo text để search (bao gồm tất cả thông tin có thể)
        const tourText = (
          (tour.description || "") + " " + 
          (tour.highlights || "") + " " + 
          (tour.category || "") + " " + 
          (tour.name || "") + " " +
          (tour.destination || "")
        ).toLowerCase();
        
        // Tách keywords (hỗ trợ dấu phẩy, khoảng trắng, xuống dòng)
        const keywords = searchText
          .split(/[,\n\r]+/)
          .map(k => k.trim())
          .filter(k => k.length > 1);
        
        let keywordMatches = 0;
        let totalKeywordScore = 0;
        
        keywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase().trim();
          
          // Thử exact match trước (hỗ trợ không dấu)
          if (matchesSearch(tourText, keywordLower)) {
            keywordMatches++;
            totalKeywordScore += 6;
            hasMatch = true;
          } else if (tourText.includes(keywordLower)) {
            // Partial match
            keywordMatches++;
            totalKeywordScore += 4;
            hasMatch = true;
          } else {
            // Thử match từng từ trong keyword
            const keywordWords = keywordLower.split(/\s+/);
            const matchingWords = keywordWords.filter(kw => 
              tourText.includes(kw) || matchesSearch(tourText, kw)
            );
            if (matchingWords.length > 0) {
              keywordMatches++;
              totalKeywordScore += 3;
              hasMatch = true;
            }
          }
        });
        
        score += totalKeywordScore;
        
        // Bonus nếu match tất cả keywords
        if (keywordMatches === keywords.length && keywords.length > 1) {
          score += 8;
          console.log(`  Tour ${tour.id}: ✅ All keywords matched (${keywordMatches}/${keywords.length})`);
        } else if (keywordMatches > 0) {
          console.log(`  Tour ${tour.id}: ✅ Some keywords matched (${keywordMatches}/${keywords.length})`);
        } else {
          console.log(`  Tour ${tour.id}: ❌ No keyword match for: ${searchText.substring(0, 50)}`);
        }
      }
    }

    // Match travel style - dựa trên price range và category
    if (criteria.travelStyle) {
      const style = criteria.travelStyle.toLowerCase().trim();
      const category = (tour.category || "").toLowerCase();
      const travelStyle = (tour.travel_style || "").toLowerCase();
      
      // Match dựa trên price range
      if (style.includes("tiết kiệm") || style.includes("rẻ") || style.includes("economy")) {
        if (tour.price < 3000000) {
          score += 10;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Budget travel style match (price: ${tour.price.toLocaleString()})`);
        } else {
          console.log(`  Tour ${tour.id}: ❌ Budget style mismatch (price: ${tour.price.toLocaleString()}, expected < 3M)`);
        }
      } else if (style.includes("trung bình") || style.includes("vừa") || style.includes("medium") || style.includes("average")) {
        if (tour.price >= 3000000 && tour.price < 8000000) {
          score += 10;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Medium travel style match (price: ${tour.price.toLocaleString()})`);
        } else {
          console.log(`  Tour ${tour.id}: ❌ Medium style mismatch (price: ${tour.price.toLocaleString()}, expected 3M-8M)`);
        }
      } else if (style.includes("cao cấp") || style.includes("luxury") || style.includes("premium")) {
        if (tour.price >= 8000000) {
          score += 10;
          hasMatch = true;
          console.log(`  Tour ${tour.id}: ✅ Luxury travel style match (price: ${tour.price.toLocaleString()})`);
        } else {
          console.log(`  Tour ${tour.id}: ❌ Luxury style mismatch (price: ${tour.price.toLocaleString()}, expected >= 8M)`);
        }
      }
      
      // Match dựa trên category hoặc travel_style field
      if (category && (category.includes(style) || style.includes(category))) {
        score += 8;
        hasMatch = true;
        console.log(`  Tour ${tour.id}: ✅ Category match (${tour.category})`);
      } else if (travelStyle && (travelStyle.includes(style) || style.includes(travelStyle))) {
        score += 8;
        hasMatch = true;
        console.log(`  Tour ${tour.id}: ✅ Travel style field match (${tour.travel_style})`);
      }
    }

    console.log(`  Tour ${tour.id} (${tour.name}): Final score=${score}, hasMatch=${hasMatch}`);
    return { id: tour.id, score, hasMatch };
  });

  // Kiểm tra xem có tiêu chí quan trọng nào được chỉ định không
  const hasStrictCriteria = !!(criteria.duration || criteria.destination || criteria.budget);
  
  // Sort by score
  const sorted = scores.sort((a, b) => {
    // Ưu tiên tours có match
    if (a.hasMatch && !b.hasMatch) return -1;
    if (!a.hasMatch && b.hasMatch) return 1;
    // Sau đó sort theo score
    return b.score - a.score;
  });

  // Nếu có tiêu chí quan trọng được chỉ định, phải match ít nhất một trong số đó
  if (hasStrictCriteria) {
    // Đếm số tiêu chí quan trọng được chỉ định
    const strictCriteriaCount = [
      criteria.duration,
      criteria.destination,
      criteria.budget
    ].filter(c => c && c.toString().trim().length > 0).length;
    
    console.log(`📊 Strict criteria count: ${strictCriteriaCount}`);
    
    // Ưu tiên 1: Tours có hasMatch và score rất cao (>15) - match tốt
    const excellentMatches = sorted.filter(t => t.hasMatch && t.score > 15);
    if (excellentMatches.length > 0) {
      const result = excellentMatches.slice(0, 5).map(item => item.id);
      console.log("✅ Found excellent matches (score > 15):", result.length, "tours");
      console.log("   Tour IDs:", result);
      return result;
    }
    
    // Ưu tiên 2: Tours có hasMatch và score cao (>10) - match tốt
    const goodMatches = sorted.filter(t => t.hasMatch && t.score > 10);
    if (goodMatches.length > 0) {
      const result = goodMatches.slice(0, 5).map(item => item.id);
      console.log("✅ Found good matches (score > 10):", result.length, "tours");
      console.log("   Tour IDs:", result);
      return result;
    }
    
    // Ưu tiên 3: Tours có hasMatch - phải match ít nhất 1 tiêu chí quan trọng
    const acceptableMatches = sorted.filter(t => t.hasMatch && t.score > 0);
    if (acceptableMatches.length > 0) {
      const result = acceptableMatches.slice(0, 5).map(item => item.id);
      console.log("✅ Found acceptable matches (hasMatch = true):", result.length, "tours");
      console.log("   Tour IDs:", result);
      return result;
    }
    
    // Nếu có tiêu chí quan trọng nhưng không có tour nào match, không trả về tours không liên quan
    console.log("❌ No tours match the specified criteria. Criteria:", {
      duration: criteria.duration || 'not specified',
      destination: criteria.destination || 'not specified',
      budget: criteria.budget || 'not specified'
    });
    console.log("   Total tours checked:", sorted.length);
    console.log("   Tours with hasMatch:", sorted.filter(t => t.hasMatch).length);
    console.log("   Tours with score > 0:", sorted.filter(t => t.score > 0).length);
    return [];
  } else {
    // Không có tiêu chí quan trọng, có thể trả về tours dựa trên interests/preferences
    // Ưu tiên 1: Tours có hasMatch và score cao (>10)
    const excellentMatches = sorted.filter(t => t.hasMatch && t.score > 10);
    if (excellentMatches.length > 0) {
      const result = excellentMatches.slice(0, 5).map(item => item.id);
      console.log("✅ Found excellent matches:", result.length, "tours with score > 10");
      return result;
    }
    
    // Ưu tiên 2: Tours có hasMatch
    const goodMatches = sorted.filter(t => t.hasMatch && t.score > 0);
    if (goodMatches.length > 0) {
      const result = goodMatches.slice(0, 5).map(item => item.id);
      console.log("✅ Found good matches:", result.length, "tours with at least one criteria match");
      return result;
    }
    
    // Ưu tiên 3: Tours có score > 5
    const partialMatches = sorted.filter(t => t.score > 5).slice(0, 5);
    if (partialMatches.length > 0) {
      console.log("⚠️ Using partial matches:", partialMatches.length, "tours with score > 5");
      return partialMatches.map(item => item.id);
    }
  }
  
  // Cuối cùng: Nếu không có tour nào match, trả về empty array
  console.log("❌ No tours match the criteria. Returning empty list.");
  return [];
}

export default router;

