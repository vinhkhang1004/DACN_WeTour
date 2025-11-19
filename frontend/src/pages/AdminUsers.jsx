import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // 🧩 Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        { headers }
      );
      setUsers(res.data.data);
      setTotal(res.data.meta.total);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // 🔍 Tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // ✅ Cập nhật quyền user
  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole }, { headers });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
      alert("✅ Đã cập nhật quyền thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật quyền:", err);
      alert("❌ Không thể cập nhật quyền!");
    }
  };

  // ✅ Cập nhật trạng thái user
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus }, { headers });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
      alert("✅ Đã cập nhật trạng thái thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert("❌ Không thể cập nhật trạng thái!");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontSize: 20 }}>
        ⏳ Đang tải dữ liệu...
      </div>
    );

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>👥 Quản lý người dùng</h2>

      {/* Tìm kiếm */}
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 6,
            width: "300px",
            border: "1px solid #ccc",
            borderRadius: 4,
            marginRight: 10,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "6px 12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          🔍 Tìm
        </button>
      </form>

      {/* Bảng người dùng */}
      <table
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <thead style={{ background: "#e0f2fe" }}>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Quyền</th>
            <th>Trạng thái</th>
            <th>Booking</th>
            <th>Đã chi (₫)</th>
            <th>Tạo lúc</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", color: "#777" }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <select
                    value={u.status}
                    onChange={(e) => handleStatusChange(u.id, e.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="banned">banned</option>
                  </select>
                </td>
                <td>
                  {u.bookingStats.completed}/{u.bookingStats.total}
                </td>
                <td>{u.bookingStats.spent.toLocaleString()}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Phân trang */}
      <div style={{ marginTop: 15, textAlign: "center" }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          style={{ marginRight: 10 }}
        >
          ⬅ Trước
        </button>
        <span>
          Trang {page} / {Math.ceil(total / limit) || 1}
        </span>
        <button
          disabled={page >= Math.ceil(total / limit)}
          onClick={() => setPage(page + 1)}
          style={{ marginLeft: 10 }}
        >
          Tiếp ➡
        </button>
      </div>
    </div>
  );
}
