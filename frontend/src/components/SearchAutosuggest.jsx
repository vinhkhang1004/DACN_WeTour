import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { matchesSearch } from "../utils/vietnameseUtils";

export default function SearchAutosuggest({ value, onChange, onSelect, placeholder = "Tên tour hoặc địa điểm" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const q = value?.trim();
    if (!q) { setItems([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/tours?suggest=${encodeURIComponent(q)}`);
        let data = Array.isArray(res.data) ? res.data : [];
        
        // Lọc và sắp xếp: ưu tiên tour có tên khớp (hỗ trợ không dấu)
        const searchLower = q.toLowerCase();
        data = data.filter((tour) => {
          const tourName = tour.name || "";
          const tourDest = tour.destination || "";
          
          // Tìm kiếm có dấu
          const nameMatch = tourName.toLowerCase().includes(searchLower);
          const destMatch = tourDest.toLowerCase().includes(searchLower);
          
          // Tìm kiếm không dấu
          const nameMatchNoAccent = matchesSearch(tourName, q);
          const destMatchNoAccent = matchesSearch(tourDest, q);
          
          return nameMatch || destMatch || nameMatchNoAccent || destMatchNoAccent;
        });
        
        // Sắp xếp: tour có tên khớp hiển thị trước
        data.sort((a, b) => {
          const aNameMatch = a.name?.toLowerCase().includes(searchLower) || matchesSearch(a.name || "", q);
          const bNameMatch = b.name?.toLowerCase().includes(searchLower) || matchesSearch(b.name || "", q);
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          return 0;
        });
        
        setItems(data.slice(0, 8));
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{ 
          width: "100%", 
          padding: "16px 20px", 
          border: "none", 
          borderRadius: "8px",
          fontSize: "16px",
          color: "#1e293b",
          backgroundColor: "#fff",
          outline: "none",
          transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        onFocus={(e)=>{
          if(items.length) setOpen(true);
          e.target.style.boxShadow = "0 4px 12px rgba(14, 116, 144, 0.2)";
        }}
        onBlur={(e)=>{
          setTimeout(() => {
            e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }, 200);
        }}
      />
      {open && (items.length>0 || loading) && (
        <div style={{ 
          position: "absolute", 
          top: "100%", 
          left: 0, 
          right: 0, 
          background: "#fff", 
          border: "1px solid #e5e7eb", 
          borderRadius: "12px", 
          marginTop: "8px", 
          zIndex: 50, 
          boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          {loading && (
            <div style={{ padding: "16px", fontSize: "14px", color: "#64748b", textAlign: "center" }}>
              ⏳ Đang tìm kiếm...
            </div>
          )}
          {!loading && items.map(item => (
            <div
              key={item.id}
              onClick={()=>{ onSelect?.(item); setOpen(false); }}
              style={{ 
                padding: "12px 16px", 
                fontSize: "14px", 
                cursor: "pointer", 
                display: "flex", 
                gap: "12px", 
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e)=> e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e)=> e.currentTarget.style.background = "transparent"}
            >
              <img 
                src={item.image || "https://via.placeholder.com/60x40?text=Tour"} 
                alt={item.name} 
                style={{ 
                  width: 60, 
                  height: 40, 
                  objectFit: "cover", 
                  borderRadius: "6px",
                  flexShrink: 0
                }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#1e293b", fontWeight: 600, marginBottom: "4px", fontSize: "15px" }}>
                  {item.name}
                </div>
                <div style={{ color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                  📍 {item.destination}
                  {item.duration && <span> • ⏱️ {item.duration}</span>}
                </div>
              </div>
              <div style={{ color: "#0E7490", fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
                {new Intl.NumberFormat("vi-VN").format(item.price)} ₫
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


