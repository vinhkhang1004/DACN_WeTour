import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function UserProfile() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || ""
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await api.put("/users/me", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update user in context
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...userData, name: formData.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      login({ token, user: updatedUser });
      
      alert(response.data.message || "Cập nhật thông tin thành công!");
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(response.data.message || "Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>
        👤 Thông tin cá nhân
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #e5e7eb", marginBottom: 32 }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{
            padding: "12px 24px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "info" ? "2px solid #0E7490" : "2px solid transparent",
            color: activeTab === "info" ? "#0E7490" : "#64748b",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: -2
          }}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("password")}
          style={{
            padding: "12px 24px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "password" ? "2px solid #0E7490" : "2px solid transparent",
            color: activeTab === "password" ? "#0E7490" : "#64748b",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: -2
          }}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <form onSubmit={handleUpdateProfile} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Họ và tên *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                background: "#f8fafc",
                color: "#64748b",
                boxSizing: "border-box"
              }}
            />
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Email không thể thay đổi
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
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
              Địa chỉ
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Nhập địa chỉ của bạn"
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

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 32px",
              background: saving ? "#94a3b8" : "#0E7490",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Đang lưu..." : "Cập nhật thông tin"}
          </button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Mật khẩu hiện tại *
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
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
              Mật khẩu mới *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                boxSizing: "border-box"
              }}
            />
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Tối thiểu 6 ký tự
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 32px",
              background: saving ? "#94a3b8" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
