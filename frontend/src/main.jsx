import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./styles/global.css";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
const Homepage = lazy(() => import("./pages/Homepage.jsx"));
const TourList = lazy(() => import("./pages/TourListEnhanced.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
const TourDetail = lazy(() => import("./pages/TourDetailEnhanced.jsx"));
const BookingHistory = lazy(() => import("./pages/BookingHistory.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboardEnhanced.jsx"));
const AdminManage = lazy(() => import("./pages/AdminManage"));
const AdminTours = lazy(() => import("./pages/AdminTours"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const AdminStats = lazy(() => import("./pages/AdminStats"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
import RequireAdmin from "./components/RequireAdmin";
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Blog = lazy(() => import("./pages/Blog.jsx"));
const BlogDetail = lazy(() => import("./pages/BlogDetail.jsx"));
const CreateBlog = lazy(() => import("./pages/CreateBlog.jsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.jsx"));
const AITourRecommendation = lazy(() => import("./pages/AITourRecommendation.jsx"));
const FAQ = lazy(() => import("./pages/FAQ.jsx"));
const Destinations = lazy(() => import("./pages/Destinations.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const TourComparison = lazy(() => import("./pages/TourComparisonEnhanced.jsx"));
const AdminDashboardPro = lazy(() => import("./pages/AdminDashboardPro.jsx"));
const AdminTourManagement = lazy(() => import("./pages/AdminTourManagement.jsx"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement.jsx"));
const AdminAnalyticsPro = lazy(() => import("./pages/AdminAnalyticsPro.jsx"));
const AdminPromotions = lazy(() => import("./pages/AdminPromotions.jsx"));
const AdminPosts = lazy(() => import("./pages/AdminPosts.jsx"));
const AdminChatManagement = lazy(() => import("./pages/AdminChatManagement.jsx"));
const CustomTourDesign = lazy(() => import("./pages/CustomTourDesign.jsx"));
const AdminCustomTours = lazy(() => import("./pages/AdminCustomTours.jsx"));
const HotelSearch = lazy(() => import("./pages/HotelSearch.jsx"));
const HotelDetail = lazy(() => import("./pages/HotelDetail.jsx"));
const HotelBooking = lazy(() => import("./pages/HotelBooking.jsx"));
const AdminHotelManagement = lazy(() => import("./pages/AdminHotelManagement.jsx"));
const AdminHotelBookings = lazy(() => import("./pages/AdminHotelBookings.jsx"));
const AdminFlightManagement = lazy(() => import("./pages/AdminFlightManagement.jsx"));
const AdminFlightBookings = lazy(() => import("./pages/AdminFlightBookings.jsx"));
const CheckoutInfo = lazy(() => import("./pages/CheckoutInfo.jsx"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment.jsx"));
const CheckoutConfirm = lazy(() => import("./pages/CheckoutConfirm.jsx"));
const PaymentResult = lazy(() => import("./pages/PaymentResult.jsx"));
const Newsletter = lazy(() => import("./pages/Newsletter.jsx"));
const Promotions = lazy(() => import("./pages/Promotions.jsx"));
const UserDashboard = lazy(() => import("./pages/UserDashboardEnhanced.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const AdminLayout = lazy(() => import("./components/AdminLayout.jsx"));
const FlightSearch = lazy(() => import("./pages/FlightSearch.jsx"));
const FlightDetail = lazy(() => import("./pages/FlightDetail.jsx"));
const FlightBooking = lazy(() => import("./pages/FlightBooking.jsx"));
const FlightConfirmation = lazy(() => import("./pages/FlightConfirmation.jsx"));
const TourConfirmation = lazy(() => import("./pages/TourConfirmation.jsx"));
const HotelConfirmation = lazy(() => import("./pages/HotelConfirmation.jsx"));



// Google Client ID - Lấy từ Google Console hoặc sử dụng demo
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <ToastProvider>
        <HelmetProvider>
          <BrowserRouter>
          <Suspense fallback={<div style={{padding:20}}>Đang tải...</div>}>
            <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Homepage />} />
          <Route path="tours" element={<TourList />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="compare" element={<TourComparison />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="tour/:id" element={<TourDetail />} />
          <Route path="my-bookings" element={<BookingHistory />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<BlogDetail />} />
          <Route path="blog/create" element={<CreateBlog />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="ai-recommend" element={<AITourRecommendation />} />
          <Route path="custom-tour" element={<CustomTourDesign />} />
          <Route path="hotels" element={<HotelSearch />} />
          <Route path="hotels/:id" element={<HotelDetail />} />
          <Route path="hotels/:id/book" element={<HotelBooking />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="flights" element={<FlightSearch />} />
          <Route path="flights/:id" element={<FlightDetail />} />
          <Route path="flights/:id/book" element={<FlightBooking />} />
          <Route path="flights/booking/:id/confirm" element={<FlightConfirmation />} />
          <Route path="tour/booking/:id/confirm" element={<TourConfirmation />} />
          <Route path="hotel/booking/:id/confirm" element={<HotelConfirmation />} />
            <Route path="checkout/info" element={<CheckoutInfo />} />
            <Route path="checkout/payment" element={<CheckoutPayment />} />
            <Route path="checkout/confirm" element={<CheckoutConfirm />} />
            <Route path="payment/result" element={<PaymentResult />} />
          </Route>
          
          {/* Admin Routes với AdminLayout - Ẩn Navbar và Footer */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard-pro" replace />} />
            <Route path="dashboard-pro" element={<AdminDashboardPro />} />
            <Route path="tours-pro" element={<AdminTourManagement />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users-pro" element={<AdminUserManagement />} />
            <Route path="tours" element={<Navigate to="/admin/tours-pro" replace />} />
            <Route path="manage" element={<Navigate to="/admin/tours-pro" replace />} />
            <Route path="stats" element={<Navigate to="/admin/analytics-pro" replace />} />
            <Route path="analytics" element={<Navigate to="/admin/analytics-pro" replace />} />
            <Route path="analytics-pro" element={<AdminAnalyticsPro />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="chat" element={<AdminChatManagement />} />
            <Route path="custom-tours" element={<AdminCustomTours />} />
            <Route path="hotels" element={<AdminHotelManagement />} />
            <Route path="hotel-bookings" element={<AdminHotelBookings />} />
            <Route path="flights" element={<AdminFlightManagement />} />
            <Route path="flight-bookings" element={<AdminFlightBookings />} />
            <Route
              path="users"
              element={
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              }
            />
          </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
      </ToastProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
