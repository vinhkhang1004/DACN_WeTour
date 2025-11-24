import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminChatManagement() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  // Polling for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      } else {
        fetchConversations();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: statusFilter });
      const response = await api.get(`/admin/chat/conversations?${params}`, { headers });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      alert("Không thể tải danh sách cuộc trò chuyện!");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/admin/chat/conversations/${conversationId}/messages`, { headers });
      setSelectedConversation(response.data.conversation);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      alert("Không thể tải tin nhắn!");
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setReplyMessage("");
    fetchMessages(conversation.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await api.post(
        "/admin/chat/reply",
        {
          conversation_id: selectedConversation.id,
          content: replyMessage.trim()
        },
        { headers }
      );

      // Add new message to list
      setMessages(prev => [...prev, response.data.adminMessage]);
      setReplyMessage("");

      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Không thể gửi tin nhắn: " + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (conversationId, newStatus) => {
    try {
      await api.put(
        `/admin/chat/conversations/${conversationId}/status`,
        { status: newStatus },
        { headers }
      );
      fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Không thể cập nhật trạng thái!");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span style={{ padding: "4px 12px", background: "#dbeafe", color: "#1e40af", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Đang hoạt động</span>;
      case "resolved":
        return <span style={{ padding: "4px 12px", background: "#d1fae5", color: "#065f46", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Đã giải quyết</span>;
      case "closed":
        return <span style={{ padding: "4px 12px", background: "#f3f4f6", color: "#374151", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Đã đóng</span>;
      default:
        return <span>{status}</span>;
    }
  };

  if (loading && conversations.length === 0) {
    return <LoadingSpinner size="large" text="Đang tải danh sách cuộc trò chuyện..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💬 Quản lý Chat Hỗ trợ</h1>
              <p className="text-gray-600 mt-1">Quản lý và trả lời tin nhắn từ khách hàng</p>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="closed">Đã đóng</option>
              </select>
              <button
                onClick={fetchConversations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Danh sách conversations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Cuộc trò chuyện ({conversations.length})</h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {conv.User?.name || "Khách hàng"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {conv.User?.email || ""}
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        {getStatusBadge(conv.status)}
                        <span className="text-xs text-gray-400">
                          {conv.last_message_at
                            ? formatTime(conv.last_message_at)
                            : formatTime(conv.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-lg shadow-sm border flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
                {/* Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.User?.name || "Khách hàng"}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedConversation.User?.email || ""}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getStatusBadge(selectedConversation.status)}
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => handleUpdateStatus(selectedConversation.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="closed">Đã đóng</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Chưa có tin nhắn nào</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.sender_type === "user";
                      const isSystem = msg.sender_type === "system";
                      const isAdmin = msg.sender_type === "admin";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isUser
                                ? "bg-gray-100 text-gray-800"
                                : isAdmin
                                ? "bg-blue-600 text-white"
                                : "bg-yellow-100 text-gray-800"
                            }`}
                          >
                            {isAdmin && (
                              <div className="text-xs font-semibold mb-1 opacity-90">
                                👨‍💼 {msg.Sender?.name || "Admin"}
                              </div>
                            )}
                            {isSystem && (
                              <div className="text-xs font-semibold mb-1 opacity-90">
                                🤖 Hệ thống
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isUser ? "text-gray-500" : "text-blue-100"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply input */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Nhập tin nhắn trả lời..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || sending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {sending ? "Đang gửi..." : "Gửi"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chọn cuộc trò chuyện
                </h3>
                <p className="text-gray-500">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để xem và trả lời tin nhắn
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

