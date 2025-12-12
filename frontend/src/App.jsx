import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatSupport from "./components/ChatSupport.jsx";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";

export default function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  // Hide navbar and footer on login and register pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";
  
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!hideNavbar && <Navbar />}
      <main style={{ flex: 1 }}>
        {hideNavbar ? (
          <Outlet />
        ) : (
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px" }}>
            <Outlet />
          </div>
        )}
      </main>
      {!hideNavbar && <Footer />}
      {!hideNavbar && <ChatSupport user={user} />}
    </div>
  );
}
