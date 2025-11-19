import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function TourMap({ latitude, longitude, destination, tourName }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Kiểm tra tọa độ hợp lệ
  if (!latitude || !longitude || isNaN(lat) || isNaN(lng)) {
    const mapsUrl = destination 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
      : '#';
    
    return (
      <div style={{
        padding: '20px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
          📍 Chưa có thông tin vị trí chính xác
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>
          Địa điểm: {destination || tourName}
        </p>
        {destination && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#0E7490',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            🗺️ Tìm kiếm trên Google Maps
          </a>
        )}
      </div>
    );
  }

  const position = [lat, lng];
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid #e5e7eb',
        height: '400px'
      }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>{tourName || destination}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Link to Google Maps */}
      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#fff',
            color: '#0E7490',
            border: '1px solid #0E7490',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#0E7490';
            e.target.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#fff';
            e.target.style.color = '#0E7490';
          }}
        >
          🗺️ Xem trên Google Maps
        </a>
      </div>
    </div>
  );
}


