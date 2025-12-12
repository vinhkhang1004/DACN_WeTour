import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Destinations() {
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const regions = [
    { id: "all", name: "Tất cả vùng miền", icon: "🗺️" },
    { id: "north", name: "Miền Bắc", icon: "🏔️" },
    { id: "central", name: "Miền Trung", icon: "🏛️" },
    { id: "south", name: "Miền Nam", icon: "🌴" },
    { id: "islands", name: "Đảo & Biển", icon: "🏝️" },
    { id: "mountains", name: "Núi & Rừng", icon: "⛰️" },
    { id: "cities", name: "Thành phố", icon: "🏙️" }
  ];

  useEffect(() => {
    api
      .get("/tours")
      .then((res) => {
        const toursData = res.data || [];
        setTours(toursData);
        setFilteredTours(toursData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter tours by region and search
  useEffect(() => {
    let filtered = [...tours];

    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter((tour) => {
        const destination = tour.destination.toLowerCase();
        switch (selectedRegion) {
          case "north":
            return destination.includes("hà nội") || destination.includes("sapa") || 
                   destination.includes("hạ long") || destination.includes("ninh bình") ||
                   destination.includes("mộc châu") || destination.includes("yên bái");
          case "central":
            return destination.includes("huế") || destination.includes("đà nẵng") || 
                   destination.includes("hội an") || destination.includes("quy nhơn") ||
                   destination.includes("nha trang") || destination.includes("phú yên");
          case "south":
            return destination.includes("hồ chí minh") || destination.includes("cần thơ") || 
                   destination.includes("cà mau") || destination.includes("bến tre") ||
                   destination.includes("vũng tàu") || destination.includes("tây ninh");
          case "islands":
            return destination.includes("phú quốc") || destination.includes("côn đảo") || 
                   destination.includes("cát bà") || destination.includes("lý sơn") ||
                   destination.includes("đảo") || destination.includes("biển");
          case "mountains":
            return destination.includes("sapa") || destination.includes("đà lạt") || 
                   destination.includes("mộc châu") || destination.includes("mai châu") ||
                   destination.includes("núi") || destination.includes("rừng");
          case "cities":
            return destination.includes("hà nội") || destination.includes("hồ chí minh") || 
                   destination.includes("đà nẵng") || destination.includes("huế") ||
                   destination.includes("cần thơ") || destination.includes("nha trang");
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((tour) =>
        tour.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTours(filtered);
  }, [selectedRegion, searchTerm, tours]);

  // Get unique destinations for each region
  const getDestinationsByRegion = (regionId) => {
    if (regionId === "all") return [...new Set(tours.map(tour => tour.destination))];
    
    return [...new Set(tours.filter(tour => {
      const destination = tour.destination.toLowerCase();
      switch (regionId) {
        case "north":
          return destination.includes("hà nội") || destination.includes("sapa") || 
                 destination.includes("hạ long") || destination.includes("ninh bình") ||
                 destination.includes("mộc châu") || destination.includes("yên bái");
        case "central":
          return destination.includes("huế") || destination.includes("đà nẵng") || 
                 destination.includes("hội an") || destination.includes("quy nhơn") ||
                 destination.includes("nha trang") || destination.includes("phú yên");
        case "south":
          return destination.includes("hồ chí minh") || destination.includes("cần thơ") || 
                 destination.includes("cà mau") || destination.includes("bến tre") ||
                 destination.includes("vũng tàu") || destination.includes("tây ninh");
        case "islands":
          return destination.includes("phú quốc") || destination.includes("côn đảo") || 
                 destination.includes("cát bà") || destination.includes("lý sơn") ||
                 destination.includes("đảo") || destination.includes("biển");
        case "mountains":
          return destination.includes("sapa") || destination.includes("đà lạt") || 
                 destination.includes("mộc châu") || destination.includes("mai châu") ||
                 destination.includes("núi") || destination.includes("rừng");
        case "cities":
          return destination.includes("hà nội") || destination.includes("hồ chí minh") || 
                 destination.includes("đà nẵng") || destination.includes("huế") ||
                 destination.includes("cần thơ") || destination.includes("nha trang");
        default:
          return true;
      }
    }).map(tour => tour.destination))];
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải điểm đến...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "80px 20px",
          textAlign: "center",
          borderRadius: "12px",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
            🗺️ Khám phá điểm đến
          </h1>
          <p style={{ fontSize: "20px", margin: "0 0 30px", opacity: 0.95 }}>
            Tìm hiểu những vùng đất tuyệt vời của Việt Nam
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>
                {tours.length}+
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Tour du lịch</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>
                {[...new Set(tours.map(tour => tour.destination))].length}+
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Điểm đến</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>
                7
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Vùng miền</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          background: "#fff",
          padding: "28px",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          marginBottom: "30px",
          border: "1px solid #f1f5f9",
        }}
      >
        <h2 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "20px" }}>
          🔍 Tìm kiếm điểm đến
        </h2>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
              Tìm kiếm điểm đến:
            </label>
            <input
              type="text"
              placeholder="Nhập tên điểm đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0E7490"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "16px", fontWeight: 500, color: "#374151" }}>
            Vùng miền:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                style={{
                  padding: "16px 20px",
                  background: selectedRegion === region.id ? "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)" : "#f8fafc",
                  color: selectedRegion === region.id ? "#fff" : "#475569",
                  border: selectedRegion === region.id ? "none" : "2px solid #e2e8f0",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.3s ease",
                  boxShadow: selectedRegion === region.id ? "0 4px 12px rgba(14, 116, 144, 0.3)" : "0 2px 4px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  if (selectedRegion !== region.id) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    e.target.style.borderColor = "#0E7490";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRegion !== region.id) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    e.target.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{region.icon}</span>
                  <span>{region.name}</span>
                </div>
                <span style={{ 
                  fontSize: "12px", 
                  opacity: 0.8,
                  background: selectedRegion === region.id ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  padding: "4px 8px",
                  borderRadius: "12px",
                }}>
                  {getDestinationsByRegion(region.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ 
        marginBottom: "24px", 
        padding: "16px 20px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", color: "#1e293b", fontSize: "18px" }}>
              📍 Kết quả tìm kiếm
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Tìm thấy <strong style={{ color: "#0E7490" }}>{filteredTours.length}</strong> tour tại <strong style={{ color: "#1e293b" }}>
                {selectedRegion === "all" ? "tất cả vùng miền" : regions.find(r => r.id === selectedRegion)?.name}
              </strong>
            </p>
          </div>
          {filteredTours.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b" }}>
              <span>📊</span>
              <span>Hiển thị {filteredTours.length} tour</span>
            </div>
          )}
        </div>
      </div>

      {/* Destinations Grid */}
      {filteredTours.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: "16px" }}>🔍</div>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Không tìm thấy tour nào phù hợp với bộ lọc của bạn.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "28px",
          }}
        >
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              <Link
                to={`/tour/${tour.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
                    alt={tour.name}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {regions.find(r => {
                      const dest = tour.destination.toLowerCase();
                      switch (r.id) {
                        case "north":
                          return dest.includes("hà nội") || dest.includes("sapa") || 
                                 dest.includes("hạ long") || dest.includes("ninh bình");
                        case "central":
                          return dest.includes("huế") || dest.includes("đà nẵng") || 
                                 dest.includes("hội an") || dest.includes("nha trang");
                        case "south":
                          return dest.includes("hồ chí minh") || dest.includes("cần thơ") || 
                                 dest.includes("vũng tàu");
                        case "islands":
                          return dest.includes("phú quốc") || dest.includes("côn đảo") || 
                                 dest.includes("đảo") || dest.includes("biển");
                        case "mountains":
                          return dest.includes("sapa") || dest.includes("đà lạt") || 
                                 dest.includes("núi") || dest.includes("rừng");
                        case "cities":
                          return dest.includes("hà nội") || dest.includes("hồ chí minh") || 
                                 dest.includes("đà nẵng") || dest.includes("huế");
                        default:
                          return false;
                      }
                    })?.icon || "📍"}
                  </div>
                </div>
                <div style={{ padding: "24px" }}>
                  <h3
                    style={{
                      margin: "0 0 12px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#1e293b",
                      lineHeight: "1.3",
                    }}
                  >
                    {tour.name}
                  </h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "#64748b",
                        fontSize: "15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>📍</span> {tour.destination}
                    </p>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "#64748b",
                        fontSize: "15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>⏱️</span> {tour.duration}
                    </p>
                    {tour.averageRating > 0 && (
                      <p
                        style={{
                          margin: "0 0 8px",
                          color: "#64748b",
                          fontSize: "15px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>⭐</span> 
                        {tour.averageRating} ({tour.reviewCount} đánh giá)
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "16px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "#0ea5e9",
                          fontWeight: 700,
                          fontSize: "24px",
                        }}
                      >
                        {Number(tour.price).toLocaleString()} ₫
                      </p>
                      <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                        / người
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
                        color: "#fff",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        boxShadow: "0 2px 8px rgba(14, 116, 144, 0.3)",
                      }}
                    >
                      Xem chi tiết →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
