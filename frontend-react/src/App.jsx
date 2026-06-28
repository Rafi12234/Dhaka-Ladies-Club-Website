import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import CongratulationsPage from "./pages/CongratulationsPage";
import CustomerPanelPage from "./pages/CustomerPanelPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminManualBookingPage from "./pages/admin/AdminManualBookingPage";
import AdminHomepageContentPage from "./pages/admin/AdminHomepageContentPage";
import AdminCalendarSlotsPage from "./pages/admin/AdminCalendarSlotsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Customer */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/congratulations" element={<CongratulationsPage />} />
        <Route path="/customer-panel" element={<CustomerPanelPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Admin */}
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin-bookings" element={<AdminBookingsPage />} />
        <Route path="/admin-manual-booking" element={<AdminManualBookingPage />} />
        <Route path="/admin-homepage-content" element={<AdminHomepageContentPage />} />
        <Route path="/admin-calendar-slots" element={<AdminCalendarSlotsPage />} />

        {/* Fallback: prevent white blank screen */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}