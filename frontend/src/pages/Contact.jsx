import React, { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 2000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
          Liên hệ với chúng tôi
        </h1>
        <p style={{ fontSize: "20px", margin: 0, opacity: 0.95 }}>
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Contact Form */}
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: "28px", marginBottom: "30px", color: "#1e293b" }}>
            Gửi tin nhắn cho chúng tôi
          </h2>

          {submitted ? (
            <div
              style={{
                padding: "20px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                color: "#16a34a",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>✅</div>
              <p style={{ margin: 0, fontSize: "16px" }}>
                Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
                  Chủ đề *
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    background: "#fff",
                  }}
                >
                  <option value="">Chọn chủ đề</option>
                  <option value="booking">Hỗ trợ đặt tour</option>
                  <option value="payment">Vấn đề thanh toán</option>
                  <option value="cancel">Hủy/Đổi tour</option>
                  <option value="complaint">Khiếu nại</option>
                  <option value="suggestion">Góp ý</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div style={{ marginBottom: "30px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
                  Nội dung tin nhắn *
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Hãy mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: submitting ? "#94a3b8" : "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div>
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ fontSize: "24px", marginBottom: "30px", color: "#1e293b" }}>
              Thông tin liên hệ
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "#f0f9ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  📍
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    Địa chỉ
                  </div>
                  <div style={{ color: "#64748b" }}>
                    123 Đường ABC, Quận 1<br />
                    TP. Hồ Chí Minh, Việt Nam
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "#f0f9ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  📞
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    Điện thoại
                  </div>
                  <div style={{ color: "#64748b" }}>
                    Hotline: 1900-xxxx<br />
                    Mobile: 090-xxx-xxxx
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "#f0f9ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  📧
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    Email
                  </div>
                  <div style={{ color: "#64748b" }}>
                    support@travelbooking.vn<br />
                    info@travelbooking.vn
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "#f0f9ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  🕒
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    Giờ làm việc
                  </div>
                  <div style={{ color: "#64748b" }}>
                    Thứ 2 - Thứ 6: 8:00 - 18:00<br />
                    Thứ 7: 8:00 - 12:00
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontSize: "24px", marginBottom: "20px", color: "#1e293b" }}>
              Câu hỏi thường gặp
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Làm thế nào để đặt tour?",
                "Tôi có thể hủy tour không?",
                "Phương thức thanh toán nào được chấp nhận?",
                "Có chính sách hoàn tiền không?"
              ].map((faq, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    color: "#475569",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  {faq}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



