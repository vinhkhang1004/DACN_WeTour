import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }
    // Simulate subscription
    setIsSubscribed(true);
    setEmail("");
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <footer
      style={{
        background: "#1e293b",
        color: "#fff",
        padding: "40px 20px 20px",
        marginTop: "60px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "40px",
          marginBottom: "30px",
        }}
      >
        {/* About */}
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 600 }}>
            WeTour
          </h3>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: "1.6" }}>
            Nền tảng đặt tour du lịch trực tuyến hàng đầu Việt Nam. Chúng tôi cam kết mang đến
            những trải nghiệm du lịch tuyệt vời nhất cho bạn.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
            Liên kết nhanh
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Trang chủ
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/tours"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Danh sách Tour
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/blog"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Blog
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/about"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Về chúng tôi
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/contact"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Liên hệ
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/faq"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                FAQ
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/terms"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Điều khoản sử dụng
              </Link>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Link
                to="/privacy"
                style={{ color: "#94a3b8", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                Chính sách bảo mật
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
            Liên hệ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#94a3b8" }}>
            <li style={{ marginBottom: "8px" }}>📧 Email: support@travelbooking.vn</li>
            <li style={{ marginBottom: "8px" }}>📞 Hotline: 1900-xxxx</li>
            <li style={{ marginBottom: "8px" }}>📍 Địa chỉ: TP.HCM, Việt Nam</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
            Đăng ký nhận tin
          </h4>
          {isSubscribed ? (
            <div style={{ color: "#10b981", fontSize: "14px" }}>
              ✅ Đăng ký thành công! Cảm ơn bạn.
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    background: "#334155",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 12px",
                    background: "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Đăng ký
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Nhận tin tức mới nhất về tour và ưu đãi
              </p>
            </form>
          )}
          
          <div style={{ marginTop: "16px" }}>
            <h5 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>
              Theo dõi chúng tôi
            </h5>
            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="#"
                style={{
                  display: "inline-block",
                  width: "36px",
                  height: "36px",
                  background: "#334155",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "36px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#334155";
                }}
              >
                📘
              </a>
              <a
                href="#"
                style={{
                  display: "inline-block",
                  width: "36px",
                  height: "36px",
                  background: "#334155",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "36px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#334155";
                }}
              >
                📷
              </a>
              <a
                href="#"
                style={{
                  display: "inline-block",
                  width: "36px",
                  height: "36px",
                  background: "#334155",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "36px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#334155";
                }}
              >
                🐦
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          borderTop: "1px solid #334155",
          paddingTop: "20px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} WeTour. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
}

