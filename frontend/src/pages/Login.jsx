import React, { useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/users/login", { email, password });
      login(res.data);
      // Nếu là admin thì chuyển đến trang admin, nếu không thì về trang chủ
      if (res.data.user?.role === "admin") {
        navigate("/admin/dashboard-pro");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      setError("");
      setLoading(true);
      
      // Gửi Google credential token lên backend để verify
      const res = await api.post("/users/oauth/google", { 
        credential: credentialResponse.credential 
      });
      
      login(res.data);
      
      // Nếu là admin thì chuyển đến trang admin, nếu không thì về trang chủ
      if (res.data.user?.role === "admin") {
        navigate("/admin/dashboard-pro");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng nhập Google");
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError("Đăng nhập Google thất bại");
    setLoading(false);
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
        Đăng nhập
      </h2>
      <p style={{ marginBottom: "32px", color: "#64748b" }}>
        Chào mừng bạn trở lại!
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#1e293b",
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {error && (
          <div
            style={{
              padding: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              marginBottom: "20px",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

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
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ height: 1, background: "#e5e7eb", flex: 1 }} />
          <span style={{ color: "#9ca3af", fontSize: 12 }}>hoặc</span>
          <div style={{ height: 1, background: "#e5e7eb", flex: 1 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            text="signin_with"
            shape="rectangular"
            size="large"
            width="370"
            locale="vi"
          />
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#64748b" }}>
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            style={{ color: "#0E7490", textDecoration: "none", fontWeight: 600 }}
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
