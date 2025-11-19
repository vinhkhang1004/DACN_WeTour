import React, { useState } from "react";

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      category: "Đặt tour",
      questions: [
        {
          question: "Làm thế nào để đặt tour?",
          answer: "Bạn có thể đặt tour bằng cách: 1) Chọn tour yêu thích từ danh sách, 2) Nhấn 'Xem chi tiết', 3) Điền thông tin đặt tour (ngày khởi hành, số người), 4) Chọn phương thức thanh toán, 5) Xác nhận đặt tour. Bạn sẽ nhận được email xác nhận sau khi đặt thành công."
        },
        {
          question: "Tôi có thể đặt tour cho người khác không?",
          answer: "Có, bạn có thể đặt tour cho người khác. Khi đặt tour, hãy cung cấp thông tin chính xác của người tham gia tour để chúng tôi có thể liên hệ khi cần thiết."
        },
        {
          question: "Có giới hạn số lượng người khi đặt tour không?",
          answer: "Mỗi tour có giới hạn số lượng người tối đa khác nhau tùy thuộc vào loại hình tour và phương tiện di chuyển. Thông tin này sẽ được hiển thị rõ ràng trên trang chi tiết tour."
        }
      ]
    },
    {
      category: "Thanh toán",
      questions: [
        {
          question: "Các phương thức thanh toán nào được chấp nhận?",
          answer: "Chúng tôi chấp nhận thanh toán bằng: Tiền mặt (thanh toán tại văn phòng), MoMo, VNPay, và chuyển khoản ngân hàng. Tất cả các giao dịch đều được bảo mật và mã hóa."
        },
        {
          question: "Khi nào tôi cần thanh toán?",
          answer: "Bạn có thể thanh toán ngay khi đặt tour hoặc thanh toán trước ngày khởi hành ít nhất 3 ngày. Với một số tour đặc biệt, có thể yêu cầu thanh toán trước 7-14 ngày."
        },
        {
          question: "Tôi có thể thanh toán trả góp không?",
          answer: "Hiện tại chúng tôi chưa hỗ trợ thanh toán trả góp. Tuy nhiên, chúng tôi đang nghiên cứu và có thể triển khai tính năng này trong tương lai."
        }
      ]
    },
    {
      category: "Hủy và đổi tour",
      questions: [
        {
          question: "Tôi có thể hủy tour không?",
          answer: "Có, bạn có thể hủy tour theo chính sách sau: - Hủy trước 7 ngày: Hoàn 100% phí - Hủy trước 3-6 ngày: Hoàn 70% phí - Hủy trước 1-2 ngày: Hoàn 50% phí - Hủy trong ngày: Không hoàn phí"
        },
        {
          question: "Tôi có thể đổi tour khác không?",
          answer: "Có, bạn có thể đổi sang tour khác nếu còn chỗ trống và tour mới có giá trị tương đương. Phí đổi tour là 10% giá trị tour ban đầu. Việc đổi tour cần được thực hiện trước ngày khởi hành ít nhất 3 ngày."
        },
        {
          question: "Điều kiện thời tiết xấu có được hủy tour không?",
          answer: "Nếu thời tiết xấu ảnh hưởng đến an toàn của tour, chúng tôi sẽ thông báo hủy tour và hoàn 100% phí cho khách hàng. Trong trường hợp tour vẫn diễn ra nhưng một số hoạt động bị ảnh hưởng, chúng tôi sẽ điều chỉnh lịch trình phù hợp."
        }
      ]
    },
    {
      category: "Trong chuyến đi",
      questions: [
        {
          question: "Tôi cần mang theo những gì?",
          answer: "Tùy thuộc vào loại tour, bạn nên mang theo: Giấy tờ tùy thân, quần áo phù hợp với thời tiết, giày dép thoải mái, thuốc cá nhân, máy ảnh, sạc điện thoại, và các vật dụng cá nhân cần thiết. Danh sách chi tiết sẽ được gửi kèm email xác nhận."
        },
        {
          question: "Có hướng dẫn viên không?",
          answer: "Tất cả các tour của chúng tôi đều có hướng dẫn viên chuyên nghiệp, am hiểu về địa phương và có kinh nghiệm dẫn tour. Hướng dẫn viên sẽ hỗ trợ bạn trong suốt chuyến đi."
        },
        {
          question: "Tôi có thể tự do khám phá không?",
          answer: "Tùy thuộc vào loại tour, có những thời gian bạn có thể tự do khám phá. Tuy nhiên, để đảm bảo an toàn và đúng lịch trình, hãy tuân thủ hướng dẫn của hướng dẫn viên và thông báo khi muốn tách đoàn."
        }
      ]
    },
    {
      category: "Khác",
      questions: [
        {
          question: "Tôi có thể đánh giá tour sau chuyến đi không?",
          answer: "Có, chúng tôi rất mong nhận được phản hồi từ bạn. Sau khi hoàn thành tour, bạn sẽ nhận được email mời đánh giá. Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và giúp khách hàng khác có thông tin tham khảo."
        },
        {
          question: "Có chương trình khách hàng thân thiết không?",
          answer: "Có, chúng tôi có chương trình khách hàng thân thiết với nhiều ưu đãi như giảm giá cho lần đặt tour tiếp theo, ưu tiên đặt chỗ, và các dịch vụ đặc biệt khác."
        },
        {
          question: "Làm sao để liên hệ hỗ trợ?",
          answer: "Bạn có thể liên hệ chúng tôi qua: Hotline: 1900-xxxx, Email: support@travelbooking.vn, hoặc sử dụng form liên hệ trên website. Chúng tôi hoạt động từ 8:00-18:00 các ngày trong tuần."
        }
      ]
    }
  ];

  return (
    <div style={{ padding: "40px 20px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "80px 20px",
          textAlign: "center",
          borderRadius: "12px",
          marginBottom: "60px",
        }}
      >
        <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
          Câu hỏi thường gặp
        </h1>
        <p style={{ fontSize: "20px", margin: 0, opacity: 0.95 }}>
          Tìm câu trả lời cho những thắc mắc phổ biến
        </p>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontSize: "24px",
                marginBottom: "20px",
                color: "#1e293b",
                paddingBottom: "10px",
                borderBottom: "2px solid #0E7490",
              }}
            >
              {category.category}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {category.questions.map((item, itemIndex) => {
                const globalIndex = categoryIndex * 100 + itemIndex;
                const isOpen = openItems.has(globalIndex);

                return (
                  <div
                    key={itemIndex}
                    style={{
                      background: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => toggleItem(globalIndex)}
                      style={{
                        width: "100%",
                        padding: "20px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1e293b",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <span>{item.question}</span>
                      <span
                        style={{
                          fontSize: "20px",
                          color: "#0E7490",
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: "0 20px 20px",
                          color: "#475569",
                          lineHeight: "1.6",
                          animation: "fadeIn 0.3s ease-in-out",
                        }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            marginTop: "60px",
          }}
        >
          <h3 style={{ fontSize: "24px", marginBottom: "16px", color: "#1e293b" }}>
            Không tìm thấy câu trả lời?
          </h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/contact"
              style={{
                padding: "12px 24px",
                background: "#0E7490",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0c6b7a";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Liên hệ ngay
            </a>
            <a
              href="tel:1900-xxxx"
              style={{
                padding: "12px 24px",
                background: "#fff",
                color: "#0E7490",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: 600,
                border: "2px solid #0E7490",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#0E7490";
              }}
            >
              📞 1900-xxxx
            </a>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}



