import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "travel",
    image: "",
    is_published: false
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts", { params: { limit: 100, showAll: true } });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await api.put(`/posts/${editingPost.id}`, formData, { headers });
        alert("✅ Cập nhật bài viết thành công!");
      } else {
        await api.post("/posts", formData, { headers });
        alert("✅ Tạo bài viết thành công!");
      }
      setShowForm(false);
      setEditingPost(null);
      setFormData({ title: "", summary: "", content: "", category: "travel", image: "", is_published: false });
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      summary: post.summary || "",
      content: post.content || "",
      category: post.category || "travel",
      image: post.image || "",
      is_published: post.is_published || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await api.delete(`/posts/${id}`, { headers });
      alert("✅ Xóa bài viết thành công!");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Có lỗi xảy ra khi xóa bài viết!");
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách bài viết..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📝 Quản lý Blog/Cẩm nang</h1>
              <p className="text-gray-600 mt-1">Tạo và quản lý các bài viết hướng dẫn du lịch</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingPost(null);
                setFormData({ title: "", summary: "", content: "", category: "travel", image: "", is_published: false });
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ➕ Tạo bài mới
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={post.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop"}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {post.category}
                    </span>
                    {post.is_published ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        Đã xuất bản
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        Nháp
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.summary || post.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>👁️ {post.views || 0} lượt xem</span>
                    <span>{new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPost ? "✏️ Chỉnh sửa bài viết" : "➕ Tạo bài viết mới"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="travel">Du lịch</option>
                    <option value="tips">Mẹo vặt</option>
                    <option value="food">Ẩm thực</option>
                    <option value="photography">Nhiếp ảnh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={formData.is_published ? "published" : "draft"}
                    onChange={(e) => setFormData({...formData, is_published: e.target.value === "published"})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Xuất bản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện (URL)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPost ? "Cập nhật" : "Tạo bài"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

