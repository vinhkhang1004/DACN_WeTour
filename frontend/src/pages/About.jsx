import React from "react";

export default function About() {
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
          Về chúng tôi
        </h1>
        <p style={{ fontSize: "20px", margin: 0, opacity: 0.95 }}>
          Hành trình của chúng tôi trong việc mang đến những trải nghiệm du lịch tuyệt vời
        </p>
      </div>

      {/* Mission & Vision */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "40px",
          marginBottom: "60px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎯</div>
          <h3 style={{ fontSize: "24px", marginBottom: "16px", color: "#1e293b" }}>
            Sứ mệnh
          </h3>
          <p style={{ color: "#64748b", lineHeight: "1.8" }}>
            Chúng tôi cam kết mang đến những chuyến du lịch chất lượng cao với giá cả hợp lý,
            giúp khách hàng khám phá vẻ đẹp của Việt Nam và thế giới một cách an toàn và thú vị.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>👁️</div>
          <h3 style={{ fontSize: "24px", marginBottom: "16px", color: "#1e293b" }}>
            Tầm nhìn
          </h3>
          <p style={{ color: "#64748b", lineHeight: "1.8" }}>
            Trở thành nền tảng đặt tour du lịch hàng đầu Việt Nam, được tin tưởng bởi hàng triệu
            khách hàng và đối tác trong nước cũng như quốc tế.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div
        style={{
          background: "#fff",
          padding: "60px 40px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: "60px",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: "30px", color: "#1e293b", textAlign: "center" }}>
          Câu chuyện của chúng tôi
        </h2>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p style={{ fontSize: "18px", color: "#475569", lineHeight: "1.8", marginBottom: "20px" }}>
            WeTour được thành lập vào năm 2024 với niềm đam mê du lịch và mong muốn
            chia sẻ những trải nghiệm tuyệt vời với mọi người. Chúng tôi hiểu rằng mỗi chuyến đi
            đều là một câu chuyện đặc biệt, và chúng tôi muốn trở thành một phần của câu chuyện đó.
          </p>
          <p style={{ fontSize: "18px", color: "#475569", lineHeight: "1.8", marginBottom: "20px" }}>
            Với đội ngũ nhân viên giàu kinh nghiệm và mạng lưới đối tác rộng khắp, chúng tôi
            đã tổ chức thành công hàng nghìn chuyến du lịch, mang đến niềm vui và kỷ niệm
            đáng nhớ cho khách hàng.
          </p>
          <p style={{ fontSize: "18px", color: "#475569", lineHeight: "1.8" }}>
            Chúng tôi tin rằng du lịch không chỉ là việc di chuyển từ nơi này đến nơi khác,
            mà là cách để mở rộng tầm nhìn, kết nối với con người và văn hóa, tạo ra những
            kỷ niệm sẽ theo bạn suốt đời.
          </p>
        </div>
      </div>

      {/* Values */}
      <div style={{ marginBottom: "60px" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "40px", color: "#1e293b", textAlign: "center" }}>
          Giá trị cốt lõi
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
          }}
        >
          {[
            {
              icon: "🤝",
              title: "Tin cậy",
              description: "Minh bạch trong mọi giao dịch, cam kết chất lượng dịch vụ"
            },
            {
              icon: "💎",
              title: "Chất lượng",
              description: "Chỉ cung cấp những tour du lịch được kiểm duyệt kỹ lưỡng"
            },
            {
              icon: "❤️",
              title: "Tận tâm",
              description: "Luôn đặt lợi ích và trải nghiệm của khách hàng lên hàng đầu"
            },
            {
              icon: "🚀",
              title: "Đổi mới",
              description: "Không ngừng cải tiến và phát triển dịch vụ"
            },
            {
              icon: "🌍",
              title: "Bền vững",
              description: "Du lịch có trách nhiệm, bảo vệ môi trường và văn hóa địa phương"
            },
            {
              icon: "🎯",
              title: "Chính xác",
              description: "Thông tin chính xác, dịch vụ đúng như cam kết"
            }
          ].map((value, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                textAlign: "center",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>{value.icon}</div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px", color: "#1e293b" }}>
                {value.title}
              </h3>
              <p style={{ color: "#64748b", lineHeight: "1.6" }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          padding: "60px 40px",
          borderRadius: "12px",
          marginBottom: "60px",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: "40px", color: "#1e293b", textAlign: "center" }}>
          Thành tựu của chúng tôi
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "40px",
            textAlign: "center",
          }}
        >
          {[
            { number: "10,000+", label: "Khách hàng hài lòng" },
            { number: "500+", label: "Tour du lịch" },
            { number: "50+", label: "Điểm đến" },
            { number: "99%", label: "Tỷ lệ hài lòng" }
          ].map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: "48px", fontWeight: 700, color: "#0E7490", marginBottom: "8px" }}>
                {stat.number}
              </div>
              <div style={{ fontSize: "18px", color: "#64748b" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "60px 40px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>
          Sẵn sàng bắt đầu hành trình của bạn?
        </h2>
        <p style={{ fontSize: "18px", marginBottom: "30px", opacity: 0.95 }}>
          Hãy để chúng tôi giúp bạn tạo ra những kỷ niệm đáng nhớ
        </p>
        <a
          href="/tours"
          style={{
            display: "inline-block",
            padding: "16px 32px",
            background: "#fff",
            color: "#0E7490",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: 600,
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          }}
        >
          Khám phá tour ngay →
        </a>
      </div>
    </div>
  );
}

