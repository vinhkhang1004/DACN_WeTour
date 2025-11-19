import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        const data = res.data;
        setPost({
          id: data.id,
          title: data.title,
          content: data.content,
          image: data.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop",
          category: data.category || "travel",
          author: data.User?.name || "Admin",
          date: data.created_at,
          views: data.views || 0,
        });
      } catch (e) {
        setError(e.response?.data?.message || "Post not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
        <div style={{ fontSize: 48, color: "#0E7490", marginBottom: "20px" }}>🔄</div>
        <p style={{ color: "#64748b" }}>Đang tải...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: "20px" }}>📝</div>
        <h3 style={{ marginBottom: 8 }}>Không tìm thấy bài viết</h3>
        <p style={{ marginBottom: 24, color: "#64748b" }}>{error || "Bài viết này không tồn tại"}</p>
        <Link
          to="/blog"
          style={{
            display: "inline-block",
            background: "#0E7490",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Quay về blog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "24px", fontSize: "14px", color: "#64748b" }}>
        <Link to="/" style={{ color: "#0E7490", textDecoration: "none" }}>Trang chủ</Link>
        {" > "}
        <Link to="/blog" style={{ color: "#0E7490", textDecoration: "none" }}>Blog</Link>
        {" > "}
        <span>{post.title}</span>
      </div>

      {/* Article Image */}
      <img
        src={post.image}
        alt={post.title}
        style={{
          width: "100%",
          height: "400px",
          objectFit: "cover",
          borderRadius: "12px",
          marginBottom: "32px",
        }}
      />

      {/* Article Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-block",
            background: "#f0f9ff",
            color: "#0E7490",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          {post.category}
        </div>

        <h1
          style={{
            fontSize: "40px",
            fontWeight: 700,
            margin: "0 0 20px",
            color: "#1e293b",
            lineHeight: "1.2",
          }}
        >
          {post.title}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#64748b", fontSize: "14px" }}>
          <span>👤 {post.author}</span>
          <span>📅 {formatDate(post.date)}</span>
          <span>👁️ {post.views} lượt xem</span>
        </div>
      </div>

      {/* Article Content */}
      <div
        style={{
          fontSize: "18px",
          lineHeight: "1.8",
          color: "#334155",
          marginBottom: "40px",
        }}
        dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br />") }}
      />

      {/* Share Section */}
      <div
        style={{
          background: "#f8fafc",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "40px",
          textAlign: "center",
        }}
      >
        <h3 style={{ margin: "0 0 16px", color: "#1e293b" }}>Chia sẻ bài viết này</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <button style={{ padding: "10px 20px", background: "#1877f2", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Facebook
          </button>
          <button style={{ padding: "10px 20px", background: "#1da1f2", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Twitter
          </button>
          <button style={{ padding: "10px 20px", background: "#25d366", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            WhatsApp
          </button>
        </div>
      </div>

      {/* Back Button */}
      <div style={{ textAlign: "center" }}>
        <Link
          to="/blog"
          style={{
            display: "inline-block",
            background: "#0E7490",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Quay về danh sách bài viết
        </Link>
      </div>
    </div>
  );
}

