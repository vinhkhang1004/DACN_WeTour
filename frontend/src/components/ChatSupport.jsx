import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function ChatSupport({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and messages
  const loadConversation = async () => {
    if (!user) {
      setMessages([]);
      setConversation(null);
      return;
    }

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, user needs to login");
      setMessages([]);
      setConversation(null);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/chat/conversation');
      if (response.data.conversation) {
        setConversation(response.data.conversation);
        setMessages(response.data.messages || []);
      } else {
        setMessages([]);
        setConversation(null);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        console.warn("Token expired or invalid, clearing messages");
        setMessages([]);
        setConversation(null);
      } else if (error.response?.status !== 401) {
        // Only show error if not auth error
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Polling for new messages when chat is open
  useEffect(() => {
    if (isOpen && user) {
      const token = localStorage.getItem("token");
      if (token) {
        loadConversation();
        
        // Poll every 3 seconds for new messages
        pollingIntervalRef.current = setInterval(() => {
          const currentToken = localStorage.getItem("token");
          if (currentToken) {
            loadConversation();
          } else {
            // Stop polling if token is removed
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        }, 3000);
      }

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [isOpen, user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để sử dụng chat");
      return;
    }

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    // Optimistically add user message
    const tempUserMessage = {
      id: Date.now(),
      content: messageText,
      sender_type: 'user',
      sender_id: user.id,
      created_at: new Date(),
      Sender: { id: user.id, name: user.name, email: user.email }
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await api.post('/chat/send', {
        content: messageText
      });

      // Replace temp message with real message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, response.data.userMessage];
      });

      // If auto-reply exists, add it
      if (response.data.autoReply) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            ...response.data.autoReply,
            Sender: null
          }]);
        }, 500);
      }

      // Reload conversation to get latest messages
      setTimeout(() => {
        loadConversation();
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Optionally redirect to login
        // window.location.href = "/login";
      } else {
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderType = (message) => {
    if (message.sender_type === 'system') return 'system';
    if (message.sender_type === 'admin') return 'admin';
    return 'user';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">💬 Hỗ trợ trực tuyến</h3>
              <p className="text-xs opacity-90">Chúng tôi luôn sẵn sàng giúp đỡ</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">Đang tải tin nhắn...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map((message) => {
                const senderType = getSenderType(message);
                const isUser = senderType === 'user';
                const isSystem = senderType === 'system';
                const isAdmin = senderType === 'admin';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : isAdmin
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {isAdmin && (
                        <p className="text-xs font-semibold mb-1 opacity-90">
                          👨‍💼 {message.Sender?.name || 'Admin'}
                        </p>
                      )}
                      {isSystem && (
                        <p className="text-xs font-semibold mb-1 opacity-90">
                          🤖 Hệ thống
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isUser || isAdmin ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            {!user ? (
              <div className="text-center text-sm text-gray-500">
                Vui lòng <a href="/login" className="text-blue-600 hover:underline">đăng nhập</a> để sử dụng chat
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  disabled={isTyping}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isTyping ? '...' : 'Gửi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}


