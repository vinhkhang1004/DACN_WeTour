import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatSupport from "./components/ChatSupport.jsx";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";

export default function App() {
  const { user } = useContext(AuthContext);
  
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px" }}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <ChatSupport user={user} />
    </div>
  );
}
