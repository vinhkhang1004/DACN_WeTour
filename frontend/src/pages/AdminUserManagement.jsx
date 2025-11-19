import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [userStats, setUserStats] = useState({});

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [searchTerm, filterRole, filterStatus, sortBy, sortOrder, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        role: filterRole,
        status: filterStatus,
        sort: sortBy,
        order: sortOrder,
        page: currentPage,
        limit: usersPerPage
      });

      const response = await api.get(`/admin/users?${params}`, { headers });
      setUsers(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get("/admin/users/stats", { headers });
      setUserStats(response.data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole }, { headers });
      alert("Cập nhật vai trò thành công!");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Có lỗi xảy ra khi cập nhật vai trò!");
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus }, { headers });
      alert("Cập nhật trạng thái thành công!");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    
    try {
      await api.delete(`/admin/users/${userId}`, { headers });
      alert("Xóa người dùng thành công!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Có lỗi xảy ra khi xóa người dùng!");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      user: "bg-blue-100 text-blue-800",
      moderator: "bg-purple-100 text-purple-800"
    };
    
    const labels = {
      admin: "Quản trị viên",
      user: "Người dùng",
      moderator: "Điều hành viên"
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role] || colors.user}`}>
        {labels[role] || labels.user}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        Hoạt động
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
        Bị khóa
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách người dùng..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👥 Quản lý Người dùng nâng cao</h1>
              <p className="text-gray-600 mt-1">Quản lý toàn diện người dùng hệ thống</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.totalUsers || 0}</div>
                <div className="text-sm text-gray-600">Tổng người dùng</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-600 mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.activeUsers || 0}</div>
                <div className="text-sm text-gray-600">Đang hoạt động</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="text-3xl text-red-600 mr-4">🔒</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.bannedUsers || 0}</div>
                <div className="text-sm text-gray-600">Bị khóa</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="text-3xl text-purple-600 mr-4">👑</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.adminUsers || 0}</div>
                <div className="text-sm text-gray-600">Quản trị viên</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="admin">Quản trị viên</option>
                <option value="moderator">Điều hành viên</option>
                <option value="user">Người dùng</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="banned">Bị khóa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Ngày tạo</option>
                <option value="name">Tên</option>
                <option value="email">Email</option>
                <option value="last_login">Lần đăng nhập cuối</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || "N/A"}</div>
                      <div className="text-sm text-gray-500">{user.phone || "Chưa cập nhật"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowUserDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          👁️ Xem
                        </button>
                        
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="user">Người dùng</option>
                          <option value="moderator">Điều hành viên</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                        
                        <button
                          onClick={() => handleStatusChange(user.id, user.status === "active" ? "banned" : "active")}
                          className={`${
                            user.status === "active" 
                              ? "text-red-600 hover:text-red-900" 
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          {user.status === "active" ? "🔒 Khóa" : "🔓 Mở khóa"}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị {((currentPage - 1) * usersPerPage) + 1} đến {Math.min(currentPage * usersPerPage, users.length)} của {users.length} người dùng
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={users.length < usersPerPage}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết người dùng</h3>
                <button
                  onClick={() => setShowUserDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin cơ bản</h4>
                  <div className="space-y-2">
                    <div><strong>Tên:</strong> {showUserDetails.name || "N/A"}</div>
                    <div><strong>Email:</strong> {showUserDetails.email || "N/A"}</div>
                    <div><strong>Số điện thoại:</strong> {showUserDetails.phone || "Chưa cập nhật"}</div>
                    <div><strong>Vai trò:</strong> {getRoleBadge(showUserDetails.role)}</div>
                    <div><strong>Trạng thái:</strong> {getStatusBadge(showUserDetails.status)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin hoạt động</h4>
                  <div className="space-y-2">
                    <div><strong>Ngày tạo:</strong> {formatDate(showUserDetails.created_at)}</div>
                    <div><strong>Lần đăng nhập cuối:</strong> {showUserDetails.last_login ? formatDate(showUserDetails.last_login) : "Chưa có"}</div>
                    <div><strong>Số đặt tour:</strong> {showUserDetails.bookings_count || 0}</div>
                    <div><strong>Số đánh giá:</strong> {showUserDetails.reviews_count || 0}</div>
                  </div>
                </div>
              </div>
              
              {showUserDetails.bio && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Giới thiệu</h4>
                  <p className="text-sm text-gray-600">{showUserDetails.bio}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserDetails(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
