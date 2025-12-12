import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

export default function ForgotPassword() {
  const { showSuccess } = useToast();
  const [step, setStep] = useState("email"); // "email", "verify", "reset"
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/users/forgot-password", { email });
      setMessage(response.data.message || "Mã OTP đã được gửi đến email của bạn");
      setStep("verify");
      setCountdown(600); // 10 minutes
    } catch (error) {
      setError(error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setError("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setStep("reset");
    setError("");
    setMessage("");
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/users/reset-password", {
        email,
        code: otpCode,
        newPassword
      });
      
      showSuccess(response.data.message || "Đặt lại mật khẩu thành công!");
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "450px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
            🔐 Quên mật khẩu
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            {step === "email" && "Nhập email để nhận mã OTP"}
            {step === "verify" && "Nhập mã OTP đã gửi đến email"}
            {step === "reset" && "Nhập mật khẩu mới"}
          </p>
        </div>

        {message && (
          <div style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#1e293b",
                fontSize: "14px"
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#94a3b8" : "#0E7490",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "16px"
              }}
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#1e293b",
                fontSize: "14px"
              }}>
                Mã OTP
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(value);
                }}
                placeholder="Nhập mã OTP 6 chữ số"
                maxLength={6}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {countdown > 0 && (
                <div style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#64748b",
                  textAlign: "center"
                }}>
                  Mã còn hiệu lực trong: <strong>{formatTime(countdown)}</strong>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={otpCode.length !== 6}
              style={{
                width: "100%",
                padding: "12px",
                background: otpCode.length !== 6 ? "#94a3b8" : "#0E7490",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: otpCode.length !== 6 ? "not-allowed" : "pointer",
                marginBottom: "16px"
              }}
            >
              Xác nhận mã OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError("");
                setMessage("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#0E7490",
                border: "1px solid #0E7490",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                marginBottom: "16px"
              }}
            >
              Quay lại
            </button>

            {countdown === 0 && (
              <button
                type="button"
                onClick={handleSendOTP}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  color: "#f97316",
                  border: "1px solid #f97316",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Gửi lại mã OTP
              </button>
            )}
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#1e293b",
                fontSize: "14px"
              }}>
                Mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#64748b"
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#1e293b",
                fontSize: "14px"
              }}>
                Xác nhận mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#64748b"
                  }}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{
                width: "100%",
                padding: "12px",
                background: loading || !newPassword || !confirmPassword ? "#94a3b8" : "#0E7490",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
                marginBottom: "16px"
              }}
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("verify");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#0E7490",
                border: "1px solid #0E7490",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Quay lại
            </button>
          </form>
        )}

        <div style={{
          textAlign: "center",
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <Link
            to="/login"
            style={{
              color: "#0E7490",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

