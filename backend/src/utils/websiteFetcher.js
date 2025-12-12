import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch và parse nội dung từ website
 * @param {string} url - URL của website cần fetch
 * @returns {Promise<{success: boolean, content: string, error?: string}>}
 */
export async function fetchWebsiteContent(url) {
  try {
    // Validate URL
    if (!url || typeof url !== "string") {
      return { success: false, error: "URL không hợp lệ" };
    }

    // Ensure URL has protocol
    let validUrl = url.trim();
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = "https://" + validUrl;
    }

    // Fetch website content
    const response = await axios.get(validUrl, {
      timeout: 10000, // 10 seconds timeout
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    // Parse HTML content
    const $ = cheerio.load(response.data);

    // Remove script and style tags
    $("script, style, noscript, iframe").remove();

    // Extract text content
    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const headings = [];
    $("h1, h2, h3").each((i, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    // Extract main content (prioritize main, article, or body)
    let mainContent = "";
    if ($("main").length > 0) {
      mainContent = $("main").text().trim();
    } else if ($("article").length > 0) {
      mainContent = $("article").text().trim();
    } else {
      mainContent = $("body").text().trim();
    }

    // Clean up content (remove extra whitespace)
    mainContent = mainContent.replace(/\s+/g, " ").substring(0, 5000); // Limit to 5000 characters

    // Combine all information
    const content = `
Tiêu đề: ${title}
Mô tả: ${metaDescription}
Tiêu đề chính: ${headings.slice(0, 5).join(", ")}
Nội dung: ${mainContent}
`.trim();

    return {
      success: true,
      content: content,
      title: title,
      url: validUrl
    };

  } catch (error) {
    console.error("Error fetching website content:", error.message);
    
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return { success: false, error: "Không thể kết nối đến website. Vui lòng kiểm tra lại URL." };
    }
    
    if (error.response?.status === 404) {
      return { success: false, error: "Website không tồn tại (404)" };
    }
    
    if (error.response?.status >= 500) {
      return { success: false, error: "Lỗi server của website" };
    }

    return { 
      success: false, 
      error: error.message || "Có lỗi xảy ra khi lấy nội dung từ website" 
    };
  }
}






