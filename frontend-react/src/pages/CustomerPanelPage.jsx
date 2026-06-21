import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, customerHeaders } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CUSTOMER_TOKEN_KEY = "dlc_customer_token_v1";
const CUSTOMER_USER_KEY = "dlc_customer_user_v1";

const customerPanelStyles = String.raw`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --gold: #b8860b;
    --gold-dark: #8f6908;
    --gold-light: #d4a017;
    --gold-pale: rgba(184,134,11,0.08);
    --gold-border: #ead7a6;
    --bg: #faf7f2;
    --white: #ffffff;
    --text: #1a1a2e;
    --muted: #6b7280;
    --green: #198754;
    --red: #dc3545;
    --orange: #fd7e14;
    --shadow: 0 6px 28px rgba(0,0,0,0.08);
    --radius: 20px;
  }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .topbar {
    background: rgba(255,255,255,0.96);
    border-bottom: 1px solid var(--gold-border);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 4px 22px rgba(0,0,0,0.05);
  }

  .topbar-inner {
    width: 92%;
    max-width: 1280px;
    margin: auto;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .logo img {
    height: 38px;
    display: block;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    border: none;
    border-radius: 999px;
    padding: 11px 18px;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    transition: 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(184,134,11,0.24);
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-outline {
    background: white;
    color: var(--gold-dark);
    border: 1px solid var(--gold-border);
  }

  .btn-danger {
    background: linear-gradient(135deg, #b91c1c, var(--red));
  }

  .container {
    width: 92%;
    max-width: 1280px;
    margin: auto;
    padding: 34px 0 70px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 34px;
    font-weight: 800;
    color: var(--gold-dark);
    margin-bottom: 6px;
  }

  .muted {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.7;
  }

  .message {
    display: none;
    padding: 13px 16px;
    border-radius: 14px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
    white-space: pre-line;
  }

  .message.show {
    display: block;
  }

  .message.success {
    background: rgba(25,135,84,0.1);
    color: #166534;
    border: 1px solid rgba(25,135,84,0.2);
  }

  .message.error {
    background: rgba(220,53,69,0.09);
    color: #991b1b;
    border: 1px solid rgba(220,53,69,0.2);
  }

  .grid {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 22px;
    align-items: start;
  }

  .card {
    background: var(--white);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .card-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(234,215,166,0.6);
    background: linear-gradient(135deg, rgba(184,134,11,0.08), transparent);
  }

  .card-header h2 {
    font-size: 18px;
    color: var(--text);
    margin-bottom: 4px;
  }

  .card-body {
    padding: 24px;
  }

  .profile-avatar {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 16px;
    box-shadow: 0 8px 26px rgba(184,134,11,0.24);
  }

  .field {
    margin-bottom: 15px;
  }

  .field label {
    display: block;
    font-size: 12px;
    color: var(--gold-dark);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }

  input,
  textarea {
    width: 100%;
    border: 1.5px solid #e5e7eb;
    border-radius: 13px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 14px;
    color: var(--text);
    background: #fffdf9;
    outline: none;
  }

  input:focus,
  textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 4px rgba(184,134,11,0.12);
    background: white;
  }

  textarea {
    resize: vertical;
    min-height: 90px;
  }

  .booking-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .booking-card {
    border: 1px solid var(--gold-border);
    border-radius: 18px;
    background: white;
    overflow: hidden;
  }

  .booking-top {
    padding: 18px 20px;
    background: var(--gold-pale);
    border-bottom: 1px solid var(--gold-border);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .booking-no {
    display: inline-block;
    font-family: 'Courier New', monospace;
    font-weight: 800;
    color: var(--gold-dark);
    background: white;
    border: 1px solid var(--gold-border);
    border-radius: 8px;
    padding: 4px 9px;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .badge.confirmed {
    background: rgba(25,135,84,0.12);
    color: #166534;
  }

  .badge.pending {
    background: rgba(253,126,20,0.13);
    color: #9a4b00;
  }

  .badge.rejected,
  .badge.cancelled,
  .badge.failed {
    background: rgba(220,53,69,0.1);
    color: #991b1b;
  }

  .badge.default {
    background: #f1f5f9;
    color: #475569;
  }

  .booking-body {
    padding: 20px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }

  .info-item {
    background: #fffdf9;
    border: 1px solid #f0e6c8;
    border-radius: 14px;
    padding: 13px 14px;
  }

  .info-item.full {
    grid-column: 1 / -1;
  }

  .info-item strong {
    display: block;
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  .info-item span {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    word-break: break-word;
  }

  .section-title {
    font-size: 12px;
    color: var(--gold-dark);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 18px 0 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--gold-border), transparent);
  }

  .empty {
    padding: 30px;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
  }

  .modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.48);
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal.show {
    display: flex;
  }

  .modal-card {
    width: 100%;
    max-width: 560px;
    background: white;
    border-radius: 22px;
    border: 1px solid var(--gold-border);
    box-shadow: 0 24px 70px rgba(0,0,0,0.24);
    padding: 24px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .modal-header h3 {
    color: var(--gold-dark);
    font-size: 20px;
  }

  .close-btn {
    border: none;
    background: #fee2e2;
    color: #991b1b;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    font-weight: 800;
  }

  @media (max-width: 940px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .topbar-inner {
      height: auto;
      padding: 14px 0;
      flex-direction: column;
      align-items: flex-start;
    }

    .nav-actions {
      width: 100%;
    }

    .btn {
      width: 100%;
    }
  }
`;

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

const emptyEditBooking = {
  id: "",
  event_title: "",
  event_type: "",
  event_details: "",
  guest_count: "",
};

function getToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function money(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

function fmtDateTime(value) {
  if (!value) return "—";

  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function fmtDate(value) {
  return value || "—";
}

function getStatusClass(status) {
  const value = String(status || "default").toLowerCase();

  return ["confirmed", "pending", "rejected", "cancelled", "failed"].includes(value)
    ? value
    : "default";
}

function canEditBooking(row) {
  return (
    String(row?.booking_status || "").toLowerCase() === "pending" &&
    String(row?.booking_source || "").toLowerCase() === "online"
  );
}

function normalizeApiData(payload) {
  return payload?.data !== undefined ? payload.data : payload;
}

function getCustomerHeaders() {
  const token = getToken();

  let helperHeaders = {};

  try {
    helperHeaders = typeof customerHeaders === "function" ? customerHeaders(token) : {};
  } catch {
    try {
      helperHeaders = typeof customerHeaders === "function" ? customerHeaders() : {};
    } catch {
      helperHeaders = {};
    }
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(helperHeaders || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestCustomerApi(path, options = {}) {
  const token = getToken();

  if (!token) {
    const unauthorizedError = new Error("Unauthorized");
    unauthorizedError.status = 401;
    throw unauthorizedError;
  }

  if (typeof apiRequest === "function") {
    return apiRequest(path, {
      ...options,
      headers: {
        ...getCustomerHeaders(),
        ...(options.headers || {}),
      },
    });
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getCustomerHeaders(),
      ...(options.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 401) {
    const unauthorizedError = new Error("Unauthorized");
    unauthorizedError.status = 401;
    throw unauthorizedError;
  }

  if (!response.ok) {
    const errors = result.errors ? Object.values(result.errors).flat().join("\n") : "";
    throw new Error(errors || result.message || "Request failed.");
  }

  return result;
}

export default function CustomerPanelPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(emptyProfile);
  const [bookings, setBookings] = useState([]);
  const [isLoadingPanel, setIsLoadingPanel] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessageState] = useState({
    text: "",
    type: "success",
    show: false,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState(emptyEditBooking);

  const profileInitial = useMemo(() => {
    return (profile.name || "U").charAt(0).toUpperCase();
  }, [profile.name]);

  const showMessage = useCallback((text, type = "success") => {
    setMessageState({
      text,
      type,
      show: true,
    });

    window.clearTimeout(showMessage.hideTimer);

    showMessage.hideTimer = window.setTimeout(() => {
      setMessageState({
        text: "",
        type: "success",
        show: false,
      });
    }, 4500);
  }, []);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    navigate("/login?redirect=customer-panel");
  }, [navigate]);

  const handleRequestError = useCallback(
    (error, fallbackMessage) => {
      if (error?.status === 401 || String(error?.message || "").toLowerCase().includes("unauthorized")) {
        redirectToLogin();
        return;
      }

      showMessage(error.message || fallbackMessage, "error");
    },
    [redirectToLogin, showMessage]
  );

  const loadPanel = useCallback(async () => {
    setIsLoadingPanel(true);

    try {
      const result = await requestCustomerApi("/auth/panel", {
        method: "GET",
      });

      const data = normalizeApiData(result) || {};
      const nextProfile = data.profile || data.user || data.customer || {};
      const nextBookings = data.bookings || [];

      setProfile({
        name: nextProfile.name || "",
        email: nextProfile.email || "",
        phone: nextProfile.phone || "",
        address: nextProfile.address || "",
      });

      setBookings(Array.isArray(nextBookings) ? nextBookings : []);

      localStorage.setItem(
        CUSTOMER_USER_KEY,
        JSON.stringify({
          name: nextProfile.name || "",
          email: nextProfile.email || "",
          phone: nextProfile.phone || "",
          address: nextProfile.address || "",
        })
      );
    } catch (error) {
      handleRequestError(error, "Unable to load customer panel.");
    } finally {
      setIsLoadingPanel(false);
    }
  }, [handleRequestError]);

  const updateProfileField = useCallback((field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const updateEditBookingField = useCallback((field, value) => {
    setEditBookingForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const updateProfile = useCallback(
    async (event) => {
      event.preventDefault();

      setIsSavingProfile(true);

      try {
        const payload = {
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
        };

        const result = await requestCustomerApi("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        showMessage(result.message || "Profile updated successfully.", "success");
        await loadPanel();
      } catch (error) {
        handleRequestError(error, "Unable to update profile.");
      } finally {
        setIsSavingProfile(false);
      }
    },
    [handleRequestError, loadPanel, profile.address, profile.email, profile.name, profile.phone, showMessage]
  );

  const openEditModal = useCallback(
    (bookingId) => {
      const row = bookings.find((item) => Number(item.id) === Number(bookingId));

      if (!row) {
        showMessage("Booking not found.", "error");
        return;
      }

      setEditBookingForm({
        id: row.id || "",
        event_title: row.event_title || "",
        event_type: row.event_type || "",
        event_details: row.event_details || "",
        guest_count: row.guest_count || "",
      });

      setEditModalOpen(true);
    },
    [bookings, showMessage]
  );

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditBookingForm(emptyEditBooking);
  }, []);

  const updateBooking = useCallback(
    async (event) => {
      event.preventDefault();

      if (!editBookingForm.id) {
        showMessage("Booking not found.", "error");
        return;
      }

      setIsUpdatingBooking(true);

      try {
        const payload = {
          event_title: editBookingForm.event_title.trim(),
          event_type: editBookingForm.event_type.trim(),
          event_details: editBookingForm.event_details.trim(),
          guest_count: Number(editBookingForm.guest_count),
        };

        const result = await requestCustomerApi(`/auth/bookings/${editBookingForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        closeEditModal();
        showMessage(result.message || "Booking updated successfully.", "success");
        await loadPanel();
      } catch (error) {
        handleRequestError(error, "Unable to update booking.");
      } finally {
        setIsUpdatingBooking(false);
      }
    },
    [
      closeEditModal,
      editBookingForm.event_details,
      editBookingForm.event_title,
      editBookingForm.event_type,
      editBookingForm.guest_count,
      editBookingForm.id,
      handleRequestError,
      loadPanel,
      showMessage,
    ]
  );

  const logoutCustomer = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await requestCustomerApi("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {
      // Logout should still clear the local session even if the backend request fails.
    } finally {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      setIsLoggingOut(false);
      navigate("/login");
    }
  }, [isLoggingOut, navigate]);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin();
      return;
    }

    loadPanel();
  }, [loadPanel, redirectToLogin]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeEditModal();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.clearTimeout(showMessage.hideTimer);
    };
  }, [closeEditModal]);

  return (
    <>
      <style>{customerPanelStyles}</style>

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">
            <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
          </Link>

          <div className="nav-actions">
            <Link className="btn btn-outline" to="/">
              Home
            </Link>

            <button className="btn btn-danger" type="button" onClick={logoutCustomer} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="page-header">
          <h1>Customer Panel</h1>
          <p className="muted">View your profile, booking history, event details, selected slots, and payment information.</p>
        </div>

        <div className={`message ${message.show ? `show ${message.type}` : ""}`.trim()}>{message.text}</div>

        <div className="grid">
          <aside className="card">
            <div className="card-header">
              <h2>Profile Information</h2>
              <p className="muted">You can update your name, email, phone and address.</p>
            </div>

            <div className="card-body">
              <div className="profile-avatar">{profileInitial}</div>

              <form onSubmit={updateProfile}>
                <div className="field">
                  <label htmlFor="profileName">Name</label>
                  <input
                    type="text"
                    id="profileName"
                    required
                    value={profile.name}
                    onChange={(event) => updateProfileField("name", event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="profileEmail">Email</label>
                  <input
                    type="email"
                    id="profileEmail"
                    required
                    value={profile.email}
                    onChange={(event) => updateProfileField("email", event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="profilePhone">Phone</label>
                  <input
                    type="text"
                    id="profilePhone"
                    required
                    value={profile.phone}
                    onChange={(event) => updateProfileField("phone", event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="profileAddress">Address</label>
                  <textarea
                    id="profileAddress"
                    value={profile.address}
                    onChange={(event) => updateProfileField("address", event.target.value)}
                  />
                </div>

                <button className="btn" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </aside>

          <section className="card">
            <div className="card-header">
              <h2>My Activities</h2>
              <p className="muted">All your bookings, selected slots, event details and payment records.</p>
            </div>

            <div className="card-body">
              <div className="booking-list">
                {isLoadingPanel ? (
                  <div className="empty">Loading your activities...</div>
                ) : bookings.length === 0 ? (
                  <div className="empty">No booking activity found yet.</div>
                ) : (
                  bookings.map((row) => (
                    <div className="booking-card" key={row.id || row.booking_no}>
                      <div className="booking-top">
                        <div>
                          <span className="booking-no">{row.booking_no || "—"}</span>
                          <div className="muted">Source: {row.booking_source || "—"}</div>
                        </div>

                        <div>
                          <span className={`badge ${getStatusClass(row.booking_status)}`}>
                            {row.booking_status || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="booking-body">
                        <div className="section-title">Event Information</div>

                        <div className="info-grid">
                          <div className="info-item">
                            <strong>Event Title</strong>
                            <span>{row.event_title || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Event Type</strong>
                            <span>{row.event_type || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Guest Count</strong>
                            <span>{row.guest_count || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Booked At</strong>
                            <span>{fmtDateTime(row.booked_at || row.created_at)}</span>
                          </div>

                          <div className="info-item full">
                            <strong>Event Details</strong>
                            <span>{row.event_details || "—"}</span>
                          </div>
                        </div>

                        <div className="section-title">Selected Slot Information</div>

                        <div className="info-grid">
                          <div className="info-item">
                            <strong>Selected Date</strong>
                            <span>{fmtDate(row.slot_date)}</span>
                          </div>

                          <div className="info-item">
                            <strong>Hall</strong>
                            <span>{row.hall_name || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Shift</strong>
                            <span>{row.shift_name || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Time</strong>
                            <span>
                              {row.start_time || "—"}
                              {row.end_time ? ` - ${row.end_time}` : ""}
                            </span>
                          </div>

                          <div className="info-item">
                            <strong>Slot Status</strong>
                            <span>{row.slot_status || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Total Amount</strong>
                            <span>{money(row.total_amount)}</span>
                          </div>
                        </div>

                        <div className="section-title">Payment Information</div>

                        <div className="info-grid">
                          <div className="info-item">
                            <strong>Cardholder Name</strong>
                            <span>{row.cardholder_name || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Card Last Four</strong>
                            <span>{row.card_last_four ? `•••• ${row.card_last_four}` : "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Billing Address</strong>
                            <span>{row.billing_address || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Payment Method</strong>
                            <span>{row.payment_method || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Payment Status</strong>
                            <span>{row.payment_status || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Paid Amount</strong>
                            <span>{money(row.amount)}</span>
                          </div>

                          <div className="info-item">
                            <strong>Transaction Reference</strong>
                            <span>{row.transaction_reference || "—"}</span>
                          </div>

                          <div className="info-item">
                            <strong>Paid At</strong>
                            <span>{fmtDateTime(row.paid_at)}</span>
                          </div>
                        </div>

                        {canEditBooking(row) ? (
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => openEditModal(row.id)}
                          >
                            Edit Pending Booking
                          </button>
                        ) : (
                          <p className="muted">Booking editing is available only for pending online bookings.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <div
        className={`modal ${editModalOpen ? "show" : ""}`.trim()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeEditModal();
          }
        }}
      >
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <h3>Edit Pending Booking</h3>
              <p className="muted">Only pending online bookings can be edited before admin approval.</p>
            </div>

            <button className="close-btn" type="button" onClick={closeEditModal}>
              ×
            </button>
          </div>

          <form onSubmit={updateBooking}>
            <input type="hidden" value={editBookingForm.id} readOnly />

            <div className="field">
              <label htmlFor="editEventTitle">Event Title</label>
              <input
                type="text"
                id="editEventTitle"
                required
                value={editBookingForm.event_title}
                onChange={(event) => updateEditBookingField("event_title", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="editEventType">Event Type</label>
              <input
                type="text"
                id="editEventType"
                required
                value={editBookingForm.event_type}
                onChange={(event) => updateEditBookingField("event_type", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="editEventDetails">Event Details</label>
              <textarea
                id="editEventDetails"
                value={editBookingForm.event_details}
                onChange={(event) => updateEditBookingField("event_details", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="editGuestCount">Guest Count</label>
              <input
                type="number"
                id="editGuestCount"
                min="1"
                required
                value={editBookingForm.guest_count}
                onChange={(event) => updateEditBookingField("guest_count", event.target.value)}
              />
            </div>

            <button className="btn" type="submit" disabled={isUpdatingBooking}>
              {isUpdatingBooking ? "Updating..." : "Update Booking"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}