import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Blog() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/posts", { params: { limit: 50 } });
        const data = (res.data?.posts || []).map(p => ({
          id: p.id,
          title: p.title,
          excerpt: p.summary || p.content?.substring(0, 150) + "...",
          content: p.content,
          image: p.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
          category: p.category || "travel",
          author: p.User?.name || "Admin",
          date: p.created_at,
          readTime: Math.ceil((p.content || "").length / 500) + " phút",
          views: p.views || 0,
        }));
        setPosts(data);
      } catch (_) {
        // Fallback: keep empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = [
    { id: "all", name: "Tất cả", count: posts.length },
    { id: "travel", name: "Du lịch", count: posts.filter(p => p.category === "travel").length },
    { id: "tips", name: "Mẹo vặt", count: posts.filter(p => p.category === "tips").length },
    { id: "food", name: "Ẩm thực", count: posts.filter(p => p.category === "food").length },
    { id: "photography", name: "Nhiếp ảnh", count: posts.filter(p => p.category === "photography").length }
  ];

  const filteredPosts = selectedCategory === "all" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải bài viết...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "80px 20px",
          textAlign: "center",
          borderRadius: "12px",
          marginBottom: "60px",
        }}
      >
        <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
          Blog Du Lịch
        </h1>
        <p style={{ fontSize: "20px", margin: "0 0 24px", opacity: 0.95 }}>
          Chia sẻ kinh nghiệm, mẹo vặt và câu chuyện du lịch thú vị
        </p>
        {user && (
          <Link
            to="/blog/create"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "#fff",
              color: "#0E7490",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
            }}
          >
            ✍️ Viết blog của bạn
          </Link>
        )}
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Categories Filter */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "40px",
          }}
        >
          <h3 style={{ margin: "0 0 20px", color: "#1e293b" }}>Danh mục</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: "8px 16px",
                  background: selectedCategory === category.id ? "#0E7490" : "#f1f5f9",
                  color: selectedCategory === category.id ? "#fff" : "#475569",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "30px",
            marginBottom: "60px",
          }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={post.image}
                  alt={post.title}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "#0E7490",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {categories.find(c => c.id === post.category)?.name}
                </div>
              </div>

              <div style={{ padding: "24px" }}>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    margin: "0 0 12px",
                    color: "#1e293b",
                    lineHeight: "1.4",
                  }}
                >
                  {post.title}
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: "1.6",
                    margin: "0 0 16px",
                    fontSize: "14px",
                  }}
                >
                  {post.excerpt}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  <span>👤 {post.author}</span>
                  <span>📅 {formatDate(post.date)}</span>
                  <span>⏱️ {post.readTime}</span>
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#f8fafc",
                    color: "#0E7490",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#0E7490";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.color = "#0E7490";
                  }}
                >
                  <Link to={`/blog/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    Đọc thêm →
                  </Link>
                </button>
              </div>
            </article>
          ))}
        </div>
        
        {filteredPosts.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ marginBottom: 8, color: "#1e293b" }}>Chưa có bài viết</h3>
            <p style={{ color: "#64748b" }}>Hãy quay lại sau để xem thêm nội dung</p>
          </div>
        )}

        {/* Newsletter Subscription */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            padding: "60px 40px",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <h2 style={{ fontSize: "32px", marginBottom: "16px", color: "#1e293b" }}>
            Đăng ký nhận tin
          </h2>
          <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "30px" }}>
            Nhận những bài viết mới nhất về du lịch và ưu đãi đặc biệt
          </p>
          <div
            style={{
              display: "flex",
              maxWidth: "400px",
              margin: "0 auto",
              gap: "12px",
            }}
          >
            <input
              type="email"
              placeholder="Nhập email của bạn"
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
            <button
              style={{
                padding: "12px 24px",
                background: "#0E7490",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

