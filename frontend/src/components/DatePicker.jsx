import React, { useState, useRef, useEffect } from "react";

export default function DatePicker({ value, onChange, min, placeholder = "dd/mm/yyyy", style = {} }) {
  const [displayValue, setDisplayValue] = useState("");
  const [iconHovered, setIconHovered] = useState(false);
  const dateInputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Format date to dd/mm/yyyy
  const formatDateToVN = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Initialize display value
  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateToVN(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleDateChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  const openCalendar = () => {
    // Trigger click on hidden date input to open calendar
    if (dateInputRef.current) {
      // Try showPicker() method (modern browsers)
      if (dateInputRef.current.showPicker) {
        try {
          dateInputRef.current.showPicker();
        } catch (err) {
          // Fallback: trigger click
          dateInputRef.current.click();
        }
      } else {
        // Fallback: trigger click
        dateInputRef.current.click();
      }
    }
  };

  const handleWrapperClick = (e) => {
    // Only trigger if clicking on the wrapper itself, not on icon
    if (e.target === wrapperRef.current || e.target.tagName === 'INPUT') {
      openCalendar();
    }
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    openCalendar();
  };

  // Extract padding from style and ensure left padding is sufficient
  const getInputPadding = () => {
    const minLeftPadding = 50; // Minimum left padding to avoid icon overlap
    
    if (style.padding) {
      // If padding is a string like "10px" or "12px 14px", parse it
      const paddingStr = String(style.padding);
      const paddingParts = paddingStr.split(' ');
      
      if (paddingParts.length === 1) {
        // Single value: use it for all sides but ensure left is at least minLeftPadding
        const paddingValue = paddingParts[0];
        return `${paddingValue} ${paddingValue} ${paddingValue} ${minLeftPadding}px`;
      } else if (paddingParts.length === 2) {
        // Two values: vertical horizontal, ensure left is at least minLeftPadding
        return `${paddingParts[0]} ${paddingParts[1]} ${paddingParts[0]} ${minLeftPadding}px`;
      } else if (paddingParts.length === 4) {
        // Four values: top right bottom left, ensure left is at least minLeftPadding
        const leftPadding = parseInt(paddingParts[3]) || 0;
        return `${paddingParts[0]} ${paddingParts[1]} ${paddingParts[2]} ${Math.max(leftPadding, minLeftPadding)}px`;
      }
    }
    return `12px 12px 12px ${minLeftPadding}px`;
  };

  const defaultStyle = {
    position: "relative",
    cursor: "pointer",
    ...style
  };

  // Remove padding from style to avoid conflicts
  const { padding, ...inputStyle } = style;

  return (
    <div ref={wrapperRef} style={defaultStyle} onClick={handleWrapperClick}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        readOnly
        style={{
          width: "100%",
          padding: getInputPadding(),
          border: style.border !== undefined ? style.border : "1px solid #e5e7eb",
          borderRadius: style.borderRadius || "8px",
          fontSize: "14px",
          outline: "none",
          cursor: "pointer",
          background: style.background !== undefined ? style.background : "#fff",
          boxSizing: "border-box",
          minHeight: style.minHeight || "auto",
          boxShadow: style.boxShadow !== undefined ? style.boxShadow : "0 2px 4px rgba(0,0,0,0.05)",
          ...inputStyle
        }}
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value || ""}
        onChange={handleDateChange}
        min={min}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          zIndex: 2,
          boxSizing: "border-box"
        }}
      />
      <span 
        onClick={handleIconClick}
        onMouseEnter={() => setIconHovered(true)}
        onMouseLeave={() => setIconHovered(false)}
        style={{ 
          position: "absolute", 
          left: "14px", 
          top: "50%", 
          transform: iconHovered ? "translateY(-50%) scale(1.1)" : "translateY(-50%)", 
          color: iconHovered ? "#0E7490" : "#64748b", 
          fontSize: "18px", 
          zIndex: 1,
          cursor: "pointer",
          transition: "color 0.2s, transform 0.2s",
          userSelect: "none",
          pointerEvents: "auto",
          width: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        📅
      </span>
    </div>
  );
}

