import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function CreateBlog() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "travel",
    image: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Vui lòng đăng nhập để viết blog");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.post("/posts", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(response.data.message || "Tạo bài viết thành công!");
      navigate("/blog");
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tạo bài viết");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 800, margin: "60px auto", padding: 20, textAlign: "center" }}>
        <h2>Vui lòng đăng nhập để viết blog</h2>
        <button
          onClick={() => navigate("/login")}
          style={{
            marginTop: 20,
            padding: "12px 24px",
            background: "#0E7490",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          ✍️ Viết blog trải nghiệm
        </h1>
        <p style={{ color: "#64748b" }}>
          Chia sẻ câu chuyện du lịch của bạn với cộng đồng
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
            Tiêu đề *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ví dụ: Trải nghiệm 3 ngày khám phá Hà Nội"
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 16,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
            Tóm tắt
          </label>
          <textarea
            rows={3}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Tóm tắt ngắn gọn về bài viết..."
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
            Nội dung *
          </label>
          <textarea
            required
            rows={15}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Viết nội dung bài viết của bạn ở đây...&#10;&#10;Bạn có thể chia sẻ:&#10;- Trải nghiệm du lịch&#10;- Mẹo vặt hữu ích&#10;- Địa điểm tham quan&#10;- Ẩm thực địa phương&#10;- Và nhiều hơn nữa..."
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Danh mục
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
                boxSizing: "border-box"
              }}
            >
              <option value="travel">Du lịch</option>
              <option value="tips">Mẹo vặt</option>
              <option value="food">Ẩm thực</option>
              <option value="photography">Nhiếp ảnh</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Ảnh bìa (URL)
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {formData.image && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>Xem trước ảnh bìa:</p>
            <img
              src={formData.image}
              alt="Preview"
              style={{ maxWidth: "100%", height: 200, objectFit: "cover", borderRadius: 8 }}
              onError={(e) => e.target.style.display = "none"}
            />
          </div>
        )}

        <div style={{
          padding: 16,
          background: "#f0f9ff",
          border: "1px solid #0ea5e9",
          borderRadius: 8,
          marginBottom: 24
        }}>
          <p style={{ fontSize: 14, color: "#0369a1", margin: 0 }}>
            💡 <strong>Lưu ý:</strong> Bài viết của bạn sẽ được gửi đến admin để duyệt trước khi hiển thị công khai.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate("/blog")}
            style={{
              padding: "12px 24px",
              background: "#fff",
              color: "#64748b",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#94a3b8" : "#0E7490",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {loading ? "Đang gửi..." : "Gửi bài viết"}
          </button>
        </div>
      </form>
    </div>
  );
}

