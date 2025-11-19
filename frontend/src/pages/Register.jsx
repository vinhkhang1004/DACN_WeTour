import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // "email", "verify", "register"
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCode = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/users/send-verification", { email: form.email, name: form.name });
      setMessage(res.data.message || "✅ Mã xác thực đã được gửi!");
      setStep("verify");
      setCountdown(600); // 10 minutes
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi gửi mã xác thực");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/users/verify-email", { email: form.email, code: otpCode });
      setMessage(res.data.message || "✅ Xác thực thành công!");
      setStep("register");
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Mã xác thực không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await api.post("/users/register", form);
      setMessage("✅ Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi đăng ký");
      if (err.response?.data?.requires_verification) {
        setStep("email");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    await sendVerificationCode({ preventDefault: () => {} });
  };

  return (
    <div
      style={{
        maxWidth: 450,
        margin: "60px auto",
        padding: "40px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "28px", color: "#1e293b" }}>
        Đăng ký tài khoản
      </h2>
      
      {/* Progress Steps */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", position: "relative" }}>
        <div style={{ 
          flex: 1, 
          textAlign: "center", 
          padding: "8px", 
          background: step === "email" ? "#0E7490" : "#10b981", 
          color: "white", 
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600
        }}>
          1. Email
        </div>
        <div style={{ 
          flex: 1, 
          textAlign: "center", 
          padding: "8px", 
          background: step === "verify" ? "#0E7490" : step === "register" ? "#10b981" : "#e5e7eb", 
          color: step !== "register" && step !== "verify" ? "#64748b" : "white", 
          borderRadius: "8px",
          marginLeft: "8px",
          fontSize: "12px",
          fontWeight: 600
        }}>
          2. Xác thực
        </div>
        <div style={{ 
          flex: 1, 
          textAlign: "center", 
          padding: "8px", 
          background: step === "register" ? "#0E7490" : "#e5e7eb", 
          color: step === "register" ? "white" : "#64748b", 
          borderRadius: "8px",
          marginLeft: "8px",
          fontSize: "12px",
          fontWeight: 600
        }}>
          3. Hoàn tất
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            background: message.includes("✅") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.includes("✅") ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "8px",
            marginBottom: "20px",
            color: message.includes("✅") ? "#16a34a" : "#dc2626",
          }}
        >
          {message}
        </div>
      )}

      {/* Step 1: Email Input */}
      {step === "email" && (
        <form onSubmit={sendVerificationCode}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
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
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#94a3b8" : "#0E7490",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang gửi..." : "Gửi mã xác thực"}
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", color: "#64748b" }}>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{ color: "#0E7490", textDecoration: "none", fontWeight: 600 }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === "verify" && (
        <form onSubmit={verifyCode}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1e293b" }}>
              Mã xác thực (6 số)
            </label>
            <input
              type="text"
              placeholder="Nhập mã xác thực"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "8px",
                fontFamily: "monospace",
                fontSize: "24px"
              }}
            />
            {countdown > 0 && (
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                Có thể gửi lại mã sau {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            style={{
              width: "100%",
              padding: "14px",
              background: loading || otpCode.length !== 6 ? "#94a3b8" : "#0E7490",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading || otpCode.length !== 6 ? "not-allowed" : "pointer",
              marginBottom: "12px"
            }}
          >
            {loading ? "Đang xác thực..." : "Xác thực"}
          </button>
          {countdown === 0 && (
            <button
              type="button"
              onClick={resendCode}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                color: "#0E7490",
                border: "2px solid #0E7490",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              Gửi lại mã
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep("email")}
            style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#64748b",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ← Thay đổi email
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", color: "#64748b" }}>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{ color: "#0E7490", textDecoration: "none", fontWeight: 600 }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      )}

      {/* Step 3: Complete Registration */}
      {step === "register" && (
        <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#1e293b",
            }}
          >
            Họ và tên
          </label>
          <input
            type="text"
            placeholder="Nhập họ và tên của bạn"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#1e293b",
            }}
          >
            Email (đã xác thực)
          </label>
          <input
            type="email"
            value={form.email}
            readOnly
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #10b981",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              color: "#10b981",
              fontWeight: 600
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#1e293b",
            }}
          >
            Mật khẩu
          </label>
          <input
            type="password"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
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

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#94a3b8" : "#0E7490",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#64748b" }}>
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            style={{ color: "#0E7490", textDecoration: "none", fontWeight: 600 }}
          >
            Đăng nhập ngay
          </Link>
        </p>
      </form>
      )}
    </div>
  );
}
