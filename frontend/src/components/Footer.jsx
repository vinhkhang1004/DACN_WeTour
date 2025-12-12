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
        background: "#fff",
        color: "#1e293b",
        padding: "60px 20px 30px",
        marginTop: "0",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          marginBottom: "40px",
        }}
      >
        {/* About WeTour */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <img
              src="/images/wetour-logo.png"
              alt="WeTour Logo"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/48x48?text=W";
              }}
            />
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0E7490" }}>
              WeTour
            </h3>
          </div>
          <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6", fontSize: "14px" }}>
            Đối tác du lịch đáng tin cậy của bạn cho những cuộc phiêu lưu khó quên.
          </p>
        </div>

        {/* VỀ CHÚNG TÔI */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            VỀ CHÚNG TÔI
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/about"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Công ty
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/contact"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Tuyển dụng
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/blog"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Báo chí
              </Link>
            </li>
          </ul>
        </div>

        {/* HỖ TRỢ */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            HỖ TRỢ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/contact"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Liên hệ
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/faq"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Câu hỏi thường gặp
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/faq"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Trung tâm trợ giúp
              </Link>
            </li>
          </ul>
        </div>

        {/* PHÁP LÝ */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            PHÁP LÝ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/terms"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Điều khoản dịch vụ
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/privacy"
                style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0E7490";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Chính sách bảo mật
              </Link>
            </li>
          </ul>
        </div>

        {/* THEO DÕI CHÚNG TÔI */}
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            THEO DÕI CHÚNG TÔI
          </h4>
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="#"
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                background: "#f1f5f9",
                borderRadius: "50%",
                textAlign: "center",
                lineHeight: "40px",
                color: "#64748b",
                textDecoration: "none",
                fontSize: "18px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              📘
            </a>
            <a
              href="#"
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                background: "#f1f5f9",
                borderRadius: "50%",
                textAlign: "center",
                lineHeight: "40px",
                color: "#64748b",
                textDecoration: "none",
                fontSize: "18px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              📷
            </a>
            <a
              href="#"
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                background: "#f1f5f9",
                borderRadius: "50%",
                textAlign: "center",
                lineHeight: "40px",
                color: "#64748b",
                textDecoration: "none",
                fontSize: "18px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              🐦
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "20px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2024 Travelly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
