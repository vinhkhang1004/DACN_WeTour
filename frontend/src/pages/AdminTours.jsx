import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminTours() {
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState({
    name: "",
    destination: "",
    price: "",
    duration: "",
    description: "",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchTours = async () => {
    const res = await api.get("/tours");
    setTours(res.data);
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // 🧭 Thêm hoặc cập nhật tour
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await api.put(`/tours/${editingId}`, form);
      alert("Cập nhật tour thành công!");
    } else {
      await api.post("/tours", form);
      alert("Đã thêm tour mới!");
    }

    setForm({
      name: "",
      destination: "",
      price: "",
      duration: "",
      description: "",
      image: "",
    });
    setEditingId(null);
    fetchTours();
  };

  const handleEdit = (tour) => {
    setEditingId(tour.id);
    setForm({
      name: tour.name,
      destination: tour.destination,
      price: tour.price,
      duration: tour.duration,
      description: tour.description,
      image: tour.image,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tour này?")) return;
    await api.delete(`/tours/${id}`);
    fetchTours();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>🧭 Quản lý Tour</h2>

      {/* FORM thêm/sửa */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 8,
          marginBottom: 20,
          background: "#f9fafb",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <h3>{editingId ? "✏️ Sửa tour" : "➕ Thêm tour mới"}</h3>
        <input
          placeholder="Tên tour"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Điểm đến"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          required
        />
        <input
          placeholder="Giá"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Thời gian (vd: 3 ngày 2 đêm)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
        />
        <textarea
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Link ảnh"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            style={{
              background: editingId ? "#16a34a" : "#0ea5e9",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {editingId ? "Cập nhật" : "Thêm tour"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  name: "",
                  destination: "",
                  price: "",
                  duration: "",
                  description: "",
                  image: "",
                });
              }}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* Bảng danh sách tour */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên tour</th>
            <th>Điểm đến</th>
            <th>Giá</th>
            <th>Thời gian</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.destination}</td>
              <td>{Number(t.price).toLocaleString()}₫</td>
              <td>{t.duration}</td>
              <td>
                <button
                  onClick={() => handleEdit(t)}
                  style={{
                    background: "#facc15",
                    border: "none",
                    padding: "4px 8px",
                    marginRight: 4,
                    cursor: "pointer",
                  }}
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
