import React, { useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [activeTab, setActiveTab] = useState("login"); // "login" or "register"
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Image carousel states
  const images = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Register states
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState("email"); // "email", "verify", "register"
  const [countdown, setCountdown] = useState(0);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Countdown timer for OTP
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Infinite scrolling for images
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await api.post("/users/login", { email, password });
      login(res.data);
      if (res.data.user?.role === "admin") {
        navigate("/admin/dashboard-pro");
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Lỗi đăng nhập");
    } finally {
      setLoginLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      setLoginError("");
      setLoginLoading(true);
      const res = await api.post("/users/oauth/google", { 
        credential: credentialResponse.credential 
      });
      login(res.data);
      if (res.data.user?.role === "admin") {
        navigate("/admin/dashboard-pro");
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Lỗi đăng nhập Google");
      setLoginLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setLoginError("Đăng nhập Google thất bại");
    setLoginLoading(false);
  };

  // Register handlers
  const sendVerificationCode = async (e) => {
    e.preventDefault();
    setRegisterMessage("");
    setRegisterLoading(true);
    try {
      const res = await api.post("/users/send-verification", { 
        email: registerForm.email, 
        name: registerForm.name 
      });
      setRegisterMessage(res.data.message || "✅ Mã xác thực đã được gửi!");
      setRegisterStep("verify");
      setCountdown(600);
    } catch (err) {
      setRegisterMessage(err.response?.data?.message || "❌ Lỗi gửi mã xác thực");
    } finally {
      setRegisterLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setRegisterMessage("");
    setRegisterLoading(true);
    try {
      const res = await api.post("/users/verify-email", { 
        email: registerForm.email, 
        code: otpCode 
      });
      setRegisterMessage(res.data.message || "✅ Xác thực thành công!");
      setRegisterStep("register");
    } catch (err) {
      setRegisterMessage(err.response?.data?.message || "❌ Mã xác thực không hợp lệ");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMessage("");
    setRegisterLoading(true);
    try {
      const res = await api.post("/users/register", registerForm);
      setRegisterMessage("✅ Đăng ký thành công! Đang chuyển đến trang chủ...");
      
      // Auto login after successful registration
      try {
        const loginRes = await api.post("/users/login", {
          email: registerForm.email,
          password: registerForm.password
        });
        login(loginRes.data);
        
        // Redirect to homepage after 1.5 seconds
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } catch (loginErr) {
        // If auto login fails, just redirect to login page
        console.error("Auto login failed:", loginErr);
        setTimeout(() => {
          setActiveTab("login");
          setRegisterStep("email");
          setRegisterForm({ name: "", email: "", password: "" });
          setOtpCode("");
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setRegisterMessage(err.response?.data?.message || "❌ Lỗi đăng ký");
      if (err.response?.data?.requires_verification) {
        setRegisterStep("email");
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    await sendVerificationCode({ preventDefault: () => {} });
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc",
      display: "flex",
      padding: "20px",
      gap: "20px"
    }}>
      {/* Left Section - Image Carousel with Infinite Scrolling */}
      <div style={{
        flex: "2",
        position: "relative",
        overflow: "hidden",
        background: "#000",
        borderRadius: "12px",
        minWidth: 0
      }}>
        {/* Image Container */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex"
        }}>
          {images.map((img, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url('${img}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: index === currentImageIndex ? 1 : 0,
                transition: "opacity 1s ease-in-out",
                zIndex: index === currentImageIndex ? 2 : 1,
                borderRadius: "12px"
              }}
            />
          ))}
          
          
          {/* Content */}
          <div style={{
            position: "relative",
            zIndex: 4,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            textAlign: "center",
            color: "#fff"
          }}>
            <h1 style={{ 
              fontSize: "42px", 
              fontWeight: 700, 
              marginBottom: "12px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              lineHeight: "1.2"
            }}>
              Chào mừng đến với WeTour
            </h1>
            <p style={{ 
              fontSize: "18px", 
              opacity: 0.95,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              lineHeight: "1.5"
            }}>
              Khám phá những điểm đến tuyệt vời
            </p>
          </div>
        </div>

        {/* Image Indicators */}
        <div style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "12px",
          zIndex: 5
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              style={{
                width: index === currentImageIndex ? "32px" : "12px",
                height: "12px",
                borderRadius: "6px",
                background: index === currentImageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                padding: 0
              }}
              onMouseEnter={(e) => {
                if (index !== currentImageIndex) {
                  e.target.style.background = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentImageIndex) {
                  e.target.style.background = "rgba(255,255,255,0.5)";
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Section - Login/Register Form */}
      <div style={{
        flex: "1",
        maxWidth: "500px",
        minWidth: "400px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "48px 40px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "36px",
          background: "#f1f5f9",
          padding: "4px",
          borderRadius: "8px"
        }}>
          <button
            onClick={() => {
              setActiveTab("login");
              setLoginError("");
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "login" ? "#fff" : "transparent",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 600,
              color: activeTab === "login" ? "#1e293b" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: activeTab === "login" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setRegisterMessage("");
              setRegisterStep("email");
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "register" ? "#fff" : "transparent",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 600,
              color: activeTab === "register" ? "#1e293b" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: activeTab === "register" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Đăng ký
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <>
            <h2 style={{ 
              fontSize: "28px", 
              fontWeight: 700, 
              marginBottom: "8px", 
              color: "#1e293b",
              lineHeight: "1.3"
            }}>
              Chào mừng trở lại!
            </h2>
            <p style={{ 
              fontSize: "15px", 
              color: "#64748b", 
              marginBottom: "32px",
              lineHeight: "1.5"
            }}>
              Quản lý các chuyến đi và khám phá những điểm đến tuyệt vời
            </p>

            <form onSubmit={handleLogin}>
              {/* Email/Username Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 500,
                  color: "#1e293b",
                  fontSize: "14px"
                }}>
                  Email hoặc Tên người dùng
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    color: "#64748b"
                  }}>
                    👤
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0E7490"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <label style={{
                    fontWeight: 500,
                    color: "#1e293b",
                    fontSize: "14px"
                  }}>
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      color: "#0E7490",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                    onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    color: "#64748b"
                  }}>
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 40px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0E7490"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                      color: "#64748b",
                      padding: "4px"
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{
                  padding: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  color: "#dc2626",
                  fontSize: "14px"
                }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loginLoading ? "#94a3b8" : "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: loginLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginBottom: "24px"
                }}
                onMouseEnter={(e) => {
                  if (!loginLoading) e.target.style.background = "#0891b2";
                }}
                onMouseLeave={(e) => {
                  if (!loginLoading) e.target.style.background = "#0E7490";
                }}
              >
                {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

              {/* Separator */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px"
              }}>
                <div style={{ height: "1px", background: "#e5e7eb", flex: 1 }} />
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                  Hoặc tiếp tục với
                </span>
                <div style={{ height: "1px", background: "#e5e7eb", flex: 1 }} />
              </div>

              {/* Google Login */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                  width="420"
                  locale="vi"
                />
              </div>
            </form>
          </>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <>
            <h2 style={{ 
              fontSize: "28px", 
              fontWeight: 700, 
              marginBottom: "8px", 
              color: "#1e293b",
              lineHeight: "1.3"
            }}>
              Tạo tài khoản mới
            </h2>
            <p style={{ 
              fontSize: "15px", 
              color: "#64748b", 
              marginBottom: "32px",
              lineHeight: "1.5"
            }}>
              Đăng ký để khám phá những điểm đến tuyệt vời
            </p>

            {registerMessage && (
              <div style={{
                padding: "12px",
                background: registerMessage.includes("✅") ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${registerMessage.includes("✅") ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: "8px",
                marginBottom: "20px",
                color: registerMessage.includes("✅") ? "#16a34a" : "#dc2626",
                fontSize: "14px"
              }}>
                {registerMessage}
              </div>
            )}

            {/* Step 1: Email */}
            {registerStep === "email" && (
              <form onSubmit={sendVerificationCode}>
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
                    placeholder="Nhập email của bạn"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    disabled={registerLoading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registerLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: registerLoading ? "#94a3b8" : "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: registerLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {registerLoading ? "Đang gửi..." : "Gửi mã xác thực"}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {registerStep === "verify" && (
              <form onSubmit={verifyCode}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#1e293b",
                    fontSize: "14px"
                  }}>
                    Mã xác thực (6 số)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mã xác thực"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    disabled={registerLoading}
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
                  disabled={registerLoading || otpCode.length !== 6}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: registerLoading || otpCode.length !== 6 ? "#94a3b8" : "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: registerLoading || otpCode.length !== 6 ? "not-allowed" : "pointer",
                    marginBottom: "12px"
                  }}
                >
                  {registerLoading ? "Đang xác thực..." : "Xác thực"}
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
              </form>
            )}

            {/* Step 3: Complete Registration */}
            {registerStep === "register" && (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#1e293b",
                    fontSize: "14px"
                  }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#1e293b",
                    fontSize: "14px"
                  }}>
                    Email (đã xác thực)
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
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
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#1e293b",
                    fontSize: "14px"
                  }}>
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={6}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registerLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: registerLoading ? "#94a3b8" : "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: registerLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {registerLoading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>
            )}

            {/* Separator for Register */}
            {registerStep === "email" && (
              <>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "24px 0"
                }}>
                  <div style={{ height: "1px", background: "#e5e7eb", flex: 1 }} />
                  <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                    Hoặc tiếp tục với
                  </span>
                  <div style={{ height: "1px", background: "#e5e7eb", flex: 1 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    text="signup_with"
                    shape="rectangular"
                    size="large"
                    width="420"
                    locale="vi"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
