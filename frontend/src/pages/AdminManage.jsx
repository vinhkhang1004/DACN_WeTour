import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminManage() {
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingTour, setEditingTour] = useState(null);
  const [newTour, setNewTour] = useState({
    name: "",
    destination: "",
    duration: "",
    price: "",
    description: "",
    image: "",
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const toursPerPage = 5;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get("/admin/tours", { headers }).then((res) => setTours(res.data));
    api.get("/admin/bookings", { headers }).then((res) => {
      console.log("Bookings data:", res.data);
      setBookings(res.data);
    });
  }, []);

  // ✅ Thêm hoặc sửa tour
  const saveTour = async () => {
    if (!newTour.name || !newTour.destination || !newTour.duration || !newTour.price) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (editingTour) {
      await api.put(`/admin/tours/${editingTour.id}`, newTour, { headers });
      setTours(tours.map((t) => (t.id === editingTour.id ? { ...t, ...newTour } : t)));
    } else {
      const res = await api.post("/admin/tours", newTour, { headers });
      setTours([...tours, res.data]);
    }

    setNewTour({
      name: "",
      destination: "",
      duration: "",
      price: "",
      description: "",
      image: "",
    });
    setEditingTour(null);
  };

  // ✅ Xóa tour
  const deleteTour = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tour này?")) return;
    await api.delete(`/admin/tours/${id}`, { headers });
    setTours(tours.filter((t) => t.id !== id));
  };

  // ✅ Cập nhật trạng thái booking
  const updateStatus = async (id, status) => {
    await api.put(`/admin/bookings/status/${id}`, { status }, { headers });
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  // 🔍 Lọc tour theo từ khóa tìm kiếm
  const filteredTours = tours.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
  );

  // 🔢 Phân trang
  const totalPages = Math.ceil(filteredTours.length / toursPerPage);
  const currentTours = filteredTours.slice(
    (page - 1) * toursPerPage,
    page * toursPerPage
  );

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: 20 }}>
      <h2>👑 Quản trị Tour & Đặt Tour</h2>

      {/* --- Quản lý tour --- */}
      <h3>📍 Danh sách tour</h3>

      {/* Ô tìm kiếm */}
      <input
        type="text"
        placeholder="🔍 Tìm kiếm tour theo tên hoặc địa điểm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "60%",
          padding: 6,
          marginBottom: 10,
          borderRadius: 4,
          border: "1px solid #ccc",
        }}
      />

      {/* Form thêm/sửa tour */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Tên tour"
          value={newTour.name}
          onChange={(e) => setNewTour({ ...newTour, name: e.target.value })}
        />
        <input
          placeholder="Địa điểm"
          value={newTour.destination}
          onChange={(e) => setNewTour({ ...newTour, destination: e.target.value })}
        />
        <input
          placeholder="Thời gian"
          value={newTour.duration}
          onChange={(e) => setNewTour({ ...newTour, duration: e.target.value })}
        />
        <input
          placeholder="Giá"
          type="number"
          value={newTour.price}
          onChange={(e) => setNewTour({ ...newTour, price: e.target.value })}
        />
        <input
          placeholder="Mô tả ngắn"
          value={newTour.description}
          onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
        />

        {/* 🖼️ Upload ảnh */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setNewTour({ ...newTour, image: reader.result });
              reader.readAsDataURL(file);
            }
          }}
        />

        {newTour.image && (
          <img
            src={newTour.image}
            alt="preview"
            style={{
              width: 80,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        )}

        <button onClick={saveTour}>
          {editingTour ? "💾 Lưu thay đổi" : "➕ Thêm tour"}
        </button>

        {editingTour && (
          <button
            onClick={() => {
              setEditingTour(null);
              setNewTour({
                name: "",
                destination: "",
                duration: "",
                price: "",
                description: "",
                image: "",
              });
            }}
          >
            ❌ Hủy
          </button>
        )}
      </div>

      {/* Bảng danh sách tour */}
      <table border="1" cellPadding="6" style={{ width: "100%", marginBottom: 10, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e0f2fe", fontWeight: "bold" }}>
            <th>ID</th>
            <th>Ảnh</th>
            <th>Tên tour</th>
            <th>Địa điểm</th>
            <th>Giá</th>
            <th>Thời gian</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentTours.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>
                {t.image ? (
                  <img
                    src={t.image}
                    alt={t.name}
                    style={{
                      width: 80,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  "Không có ảnh"
                )}
              </td>
              <td>{t.name}</td>
              <td>{t.destination}</td>
              <td>{t.price.toLocaleString()}₫</td>
              <td>{t.duration}</td>
              <td>
                <button
                  onClick={() => {
                    setEditingTour(t);
                    setNewTour(t);
                  }}
                >
                  ✏️ Sửa
                </button>{" "}
                <button
                  onClick={() => deleteTour(t.id)}
                  style={{ color: "red" }}
                >
                  🗑️ Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phân trang */}
      <div style={{ marginBottom: 30 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ⬅️ Trước
        </button>
        <span style={{ margin: "0 10px" }}>
          Trang {page}/{totalPages || 1}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Tiếp ➡️
        </button>
      </div>

      {/* --- Quản lý đặt tour --- */}
      <h3>📋 Danh sách đặt tour</h3>
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#fef9c3", fontWeight: "bold", textAlign: "center" }}>
            <th>ID</th>
            <th>Khách</th>
            <th>Tour</th>
            <th>Ngày đi</th>
            <th>Số người</th>
            <th>Tổng tiền</th>
            <th>Ghi chú</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>
                {b.user_id ? (
                  b.User?.fullname || "Ẩn danh"
                ) : (
                  <div>
                    <div>{b.guest_name || "Khách chưa đăng nhập"}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{b.guest_email || ""}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{b.guest_phone || ""}</div>
                    <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px" }}>Guest</span>
                  </div>
                )}
              </td>
              <td>{b.Tour?.name}</td>
              <td>{b.booking_date}</td>
              <td>{b.people_count}</td>
              <td>{b.total_price.toLocaleString()}₫</td>
              <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                {(() => {
                  if (!b.notes) {
                    return <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Không có</span>;
                  }
                  
                  // Format notes - remove technical JSON
                  let cleanNotes = b.notes;
                  let peopleInfo = null;
                  
                  // Try to extract people info - match both __PEOPLE_INFO__: and _PEOPLE_INFO_:
                  const peopleInfoMatch = b.notes.match(/(?:__|_)PEOPLE_INFO(?:_|__):(.+?)(?:\n|$)/);
                  if (peopleInfoMatch) {
                    try {
                      peopleInfo = JSON.parse(peopleInfoMatch[1]);
                      // Remove the people info part from notes (handle both formats)
                      cleanNotes = b.notes
                        .replace(/__PEOPLE_INFO__:.+?(?:\n|$)/g, '')
                        .replace(/_PEOPLE_INFO_:.+?(?:\n|$)/g, '')
                        .trim();
                    } catch (e) {
                      cleanNotes = b.notes
                        .replace(/__PEOPLE_INFO__:.+?(?:\n|$)/g, '')
                        .replace(/_PEOPLE_INFO_:.+?(?:\n|$)/g, '')
                        .trim();
                    }
                  }
                  
                  return (
                    <div>
                      {cleanNotes && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }} title={cleanNotes}>
                          {cleanNotes.length > 50 ? `${cleanNotes.substring(0, 50)}...` : cleanNotes}
                        </div>
                      )}
                      {peopleInfo && (
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                          👥 {peopleInfo.adults || 0} người lớn
                          {peopleInfo.children > 0 && `, ${peopleInfo.children} trẻ em`}
                        </div>
                      )}
                      {!cleanNotes && !peopleInfo && (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Không có</span>
                      )}
                    </div>
                  );
                })()}
              </td>
              <td>
                {b.status === "completed" ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>✔ Hoàn thành</span>
                ) : b.status === "paid" ? (
                  <span style={{ color: "blue", fontWeight: "bold" }}>💳 Đã thanh toán</span>
                ) : b.status === "cancelled" ? (
                  <span style={{ color: "red", fontWeight: "bold" }}>❌ Đã hủy</span>
                ) : (
                  <span style={{ color: "orange", fontWeight: "bold" }}>⏳ Chờ xác nhận</span>
                )}
              </td>
              <td>
                {b.status === "pending" ? (
                  <button onClick={() => updateStatus(b.id, "completed")}>✅ Hoàn thành</button>
                ) : b.status === "completed" ? (
                  <button onClick={() => updateStatus(b.id, "paid")} style={{ color: "blue" }}>
                    💳 Đã thanh toán
                  </button>
                ) : (
                  <button onClick={() => updateStatus(b.id, "cancelled")} style={{ color: "red" }}>
                    ❌ Hủy
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
