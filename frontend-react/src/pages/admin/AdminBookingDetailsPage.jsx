import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const ADMIN_TOKEN_KEY = "dlc_admin_token_v1";

function money(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

function fmtDateTime(value) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function adminApi(endpoint, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    const error = new Error("Unauthenticated admin.");
    error.status = 401;
    throw error;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      result?.message ||
      (result?.errors ? Object.values(result.errors).flat().join("\n") : "") ||
      "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return result;
}

export default function AdminBookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [charges, setCharges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totals, setTotals] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("due");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const selectedNewCategory = categoryId === "__new__";

  const pageTotals = useMemo(() => {
    const mainAmount = Number(booking?.total_amount || 0);
    const extraTotal = charges.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const extraPaid = charges
      .filter((row) => row.payment_status === "paid")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const extraDue = charges
      .filter((row) => row.payment_status === "due")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return {
      mainAmount,
      extraTotal,
      extraPaid,
      extraDue,
      grandTotal: mainAmount + extraTotal,
      grandPaid: mainAmount + extraPaid,
      grandDue: extraDue,
    };
  }, [booking, charges]);

  async function loadDetails() {
    setIsLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const result = await adminApi(`/admin/bookings/${bookingId}/details`);
      const data = result.data || {};
      setBooking(data.booking || null);
      setCharges(data.extra_charges || []);
      setCategories(data.extra_charge_categories || []);
      setTotals(data.totals || null);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin-login", { replace: true });
        return;
      }
      setMessage({ text: error.message || "Failed to load booking details.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function addCharge() {
    setMessage({ text: "", type: "" });
    if (!categoryId) {
      setMessage({ text: "Please select an extra charge category.", type: "error" });
      return;
    }
    if (selectedNewCategory && !newCategoryName.trim()) {
      setMessage({ text: "Please enter the new extra charge name.", type: "error" });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setMessage({ text: "Please enter a valid amount.", type: "error" });
      return;
    }
    setIsSaving(true);
    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges`, {
        method: "POST",
        body: JSON.stringify({
          extra_charge_category_id: selectedNewCategory ? null : Number(categoryId),
          new_category_name: selectedNewCategory ? newCategoryName : null,
          amount: Number(amount),
          payment_status: paymentStatus,
          payment_method: "cash",
          notes,
        }),
      });
      setCategoryId("");
      setNewCategoryName("");
      setAmount("");
      setPaymentStatus("due");
      setNotes("");
      setMessage({ text: "Extra charge added successfully.", type: "success" });
      setShowForm(false);
      await loadDetails();
    } catch (error) {
      setMessage({ text: error.message || "Failed to add extra charge.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  async function updateChargeStatus(charge, newStatus) {
    setMessage({ text: "", type: "" });
    setUpdatingId(charge.id);
    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges/${charge.id}`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: newStatus }),
      });
      setMessage({ text: "Extra charge status updated successfully.", type: "success" });
      await loadDetails();
    } catch (error) {
      setMessage({ text: error.message || "Failed to update extra charge.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteCharge(charge) {
    const ok = window.confirm(`Delete "${charge.title}" charge?`);
    if (!ok) return;
    setMessage({ text: "", type: "" });
    setDeletingId(charge.id);
    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges/${charge.id}`, {
        method: "DELETE",
      });
      setMessage({ text: "Extra charge deleted successfully.", type: "success" });
      await loadDetails();
    } catch (error) {
      setMessage({ text: error.message || "Failed to delete extra charge.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [bookingId]);

  return (
    <>
      <style>{styles}</style>
      <main className="page-wrapper">
        {/* ── Top Action Bar ── */}
        <div className="topbar no-print">
          <Link className="back-btn" to="/admin-bookings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Bookings
          </Link>

          <div className="topbar-right">
            <button
              className="action-btn secondary"
              type="button"
              onClick={loadDetails}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
            <button
              className="action-btn primary"
              type="button"
              onClick={() => window.print()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </svg>
              Print / PDF
            </button>
          </div>
        </div>

        {/* ── Alert Message ── */}
        {message.text && (
          <div className={`alert-banner no-print ${message.type}`}>
            <div className="alert-icon">
              {message.type === "success" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            {message.text}
            <button className="alert-close" onClick={() => setMessage({ text: "", type: "" })}>×</button>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading booking invoice...</p>
          </div>
        ) : !booking ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Booking Not Found</h3>
            <p>The requested booking could not be located.</p>
          </div>
        ) : (
          <div className="invoice-wrapper printable-area">

            {/* ══ INVOICE HERO HEADER ══ */}
            <div className="invoice-hero">
              <div className="hero-left">
                <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" className="hero-logo" />
                <p className="hero-tagline">Premium Convention & Party Venue in Dhaka</p>
                <div className="hero-badge">
                  <span className={`status-pill ${booking.booking_status}`}>
                    {booking.booking_status}
                  </span>
                </div>
              </div>
              <div className="hero-right">
                <div className="invoice-stamp">
                  <p className="stamp-label">INVOICE</p>
                  <p className="stamp-number">{booking.booking_no}</p>
                  <p className="stamp-date">{fmtDateTime(booking.booked_at || booking.created_at)}</p>
                </div>
              </div>
              <div className="hero-decoration" />
            </div>

            {/* ══ INFO CARDS GRID ══ */}
            <div className="info-cards-grid">
              {/* Customer */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3>Customer</h3>
                </div>
                <div className="info-card-body">
                  <InfoRow label="Name" value={booking.customer_name} />
                  <InfoRow label="Email" value={booking.customer_email} />
                  <InfoRow label="Phone" value={booking.customer_phone} />
                  <InfoRow label="Address" value={booking.customer_address} />
                </div>
              </div>

              {/* Booking */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                  </div>
                  <h3>Booking</h3>
                </div>
                <div className="info-card-body">
                  <InfoRow label="Booking No" value={booking.booking_no} />
                  <InfoRow label="Status" value={booking.booking_status} />
                  <InfoRow label="Source" value={booking.booking_source} />
                  <InfoRow label="Booked At" value={fmtDateTime(booking.booked_at || booking.created_at)} />
                </div>
              </div>

              {/* Event */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3>Event</h3>
                </div>
                <div className="info-card-body">
                  <InfoRow label="Title" value={booking.event_title} />
                  <InfoRow label="Type" value={booking.event_type} />
                  <InfoRow label="Guests" value={booking.guest_count} />
                  <InfoRow label="Details" value={booking.event_details} />
                </div>
              </div>

              {/* Slot */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3>Slot</h3>
                </div>
                <div className="info-card-body">
                  <InfoRow label="Date" value={booking.slot_date} />
                  <InfoRow label="Hall" value={booking.hall_name} />
                  <InfoRow label="Shift" value={booking.shift_name} />
                  <InfoRow label="Time" value={booking.start_time && booking.end_time ? `${booking.start_time} – ${booking.end_time}` : null} />
                </div>
              </div>
            </div>

            {/* ══ MAIN PAYMENT SECTION ══ */}
            <div className="section-header">
              <div className="section-line" />
              <h2 className="section-title">
                <span className="section-icon">💳</span>
                Main Payment
              </h2>
              <div className="section-line" />
            </div>

            <div className="payment-card">
              <div className="payment-card-inner">
                <div className="payment-info">
                  <p className="payment-desc">Main Hall Booking Payment</p>
                  <div className="payment-meta">
                    <span className="meta-tag">{booking.payment_method || "—"}</span>
                    <span className={`meta-tag ${booking.payment_status}`}>{booking.payment_status || booking.booking_status || "—"}</span>
                  </div>
                </div>
                <div className="payment-amount">{money(booking.total_amount)}</div>
              </div>
            </div>

            {/* ══ ADD EXTRA CHARGE FORM ══ */}
            <div className="no-print">
              <div className="section-header">
                <div className="section-line" />
                <h2 className="section-title">
                  <span className="section-icon">➕</span>
                  Extra Charges
                </h2>
                <div className="section-line" />
              </div>

              <div className="form-toggle-bar">
                <p className="form-toggle-desc">Manage additional charges for this booking</p>
                <button
                  className={`toggle-btn ${showForm ? "active" : ""}`}
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Cancel
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add New Charge
                    </>
                  )}
                </button>
              </div>

              <div className={`charge-form-container ${showForm ? "open" : ""}`}>
                <div className="charge-form">
                  <div className="charge-form-grid">
                    <div className="form-group">
                      <label>
                        <span className="label-icon">🏷️</span>
                        Charge Type
                      </label>
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">Select charge type</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        <option value="__new__">+ Add New Charge Type</option>
                      </select>
                    </div>

                    {selectedNewCategory && (
                      <div className="form-group slide-in">
                        <label>
                          <span className="label-icon">✏️</span>
                          New Charge Type Name
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Sound System Charge"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>
                        <span className="label-icon">৳</span>
                        Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <span className="label-icon">📌</span>
                        Payment Status
                      </label>
                      <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                        <option value="due">Due</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>

                    <div className="form-group full-col">
                      <label>
                        <span className="label-icon">📝</span>
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>

                  <div className="form-footer">
                    <button
                      className="cancel-form-btn"
                      type="button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-charge-btn"
                      type="button"
                      disabled={isSaving}
                      onClick={addCharge}
                    >
                      {isSaving ? (
                        <>
                          <span className="btn-spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <path d="M17 21v-8H7v8M7 3v5h8" />
                          </svg>
                          Save Charge
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ CHARGES TABLE ══ */}
            <div className="charges-section">
              {charges.length === 0 ? (
                <div className="no-charges">
                  <div className="no-charges-icon">🧾</div>
                  <p>No extra charges added yet</p>
                </div>
              ) : (
                <div className="charges-table-wrap">
                  <table className="charges-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Charge</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th className="right">Amount</th>
                        <th className="no-print center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charges.map((charge, idx) => (
                        <tr
                          key={charge.id}
                          className={`charge-row ${deletingId === charge.id ? "deleting" : ""} ${updatingId === charge.id ? "updating" : ""}`}
                        >
                          <td className="row-num">{idx + 1}</td>
                          <td className="charge-title">{charge.title}</td>
                          <td>
                            <span className="method-tag">{charge.payment_method || "cash"}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${charge.payment_status}`}>
                              <span className="badge-dot" />
                              {charge.payment_status}
                            </span>
                          </td>
                          <td className="notes-cell">{charge.notes || "—"}</td>
                          <td className="right amount-cell">{money(charge.amount)}</td>
                          <td className="no-print center">
                            <div className="action-group">
                              {charge.payment_status === "due" ? (
                                <button
                                  className="tbl-btn paid"
                                  type="button"
                                  disabled={updatingId === charge.id}
                                  onClick={() => updateChargeStatus(charge, "paid")}
                                >
                                  {updatingId === charge.id ? "..." : "✓ Mark Paid"}
                                </button>
                              ) : (
                                <button
                                  className="tbl-btn due"
                                  type="button"
                                  disabled={updatingId === charge.id}
                                  onClick={() => updateChargeStatus(charge, "due")}
                                >
                                  {updatingId === charge.id ? "..." : "↩ Mark Due"}
                                </button>
                              )}
                              <button
                                className="tbl-btn delete"
                                type="button"
                                disabled={deletingId === charge.id}
                                onClick={() => deleteCharge(charge)}
                              >
                                {deletingId === charge.id ? "..." : "🗑"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ══ TOTALS PANEL ══ */}
            <div className="section-header">
              <div className="section-line" />
              <h2 className="section-title">
                <span className="section-icon">📊</span>
                Summary
              </h2>
              <div className="section-line" />
            </div>

            <div className="totals-panel">
              <div className="totals-grid">
                <TotalCard
                  label="Main Booking"
                  value={money(pageTotals.mainAmount)}
                  icon="🏛️"
                  variant="neutral"
                />
                <TotalCard
                  label="Extra Charges"
                  value={money(pageTotals.extraTotal)}
                  icon="➕"
                  variant="neutral"
                />
                <TotalCard
                  label="Extra Paid"
                  value={money(pageTotals.extraPaid)}
                  icon="✅"
                  variant="success"
                />
                <TotalCard
                  label="Extra Due"
                  value={money(pageTotals.extraDue)}
                  icon="⏳"
                  variant="warning"
                />
              </div>

              <div className="grand-total-bar">
                <div className="grand-label">
                  <span className="grand-icon">💰</span>
                  <span>Grand Invoice Total</span>
                </div>
                <span className="grand-value">{money(pageTotals.grandTotal)}</span>
              </div>
            </div>

            {/* ══ FOOTER ══ */}
            <div className="invoice-footer">
              <div className="footer-brand">
                <img src="/assets/img/dlclogo_long.png" alt="DLC" className="footer-logo" />
                <p>Premium Convention & Party Venue in Dhaka</p>
              </div>
              <div className="footer-meta">
                <p>Generated by Dhaka Ladies Club Admin Panel</p>
                <p>Printed at: {new Date().toLocaleString()}</p>
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || "—"}</span>
    </div>
  );
}

function TotalCard({ label, value, icon, variant }) {
  return (
    <div className={`total-card ${variant}`}>
      <div className="total-card-icon">{icon}</div>
      <div>
        <p className="total-card-label">{label}</p>
        <p className="total-card-value">{value}</p>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold: #8f6908;
    --gold-light: #b8860b;
    --gold-pale: #f5edda;
    --gold-border: #ead7a6;
    --bg: #faf7f2;
    --surface: #ffffff;
    --text: #1a1a2e;
    --text-muted: #6b7280;
    --green: #198754;
    --green-bg: #e8f7ee;
    --amber: #8a5a00;
    --amber-bg: #fff3cd;
    --red: #dc3545;
    --red-bg: #fde8e8;
    --radius: 16px;
    --radius-sm: 10px;
    --shadow: 0 4px 24px rgba(0,0,0,0.08);
    --shadow-lg: 0 12px 48px rgba(0,0,0,0.12);
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  body { background: var(--bg); }

  .page-wrapper {
    padding: 28px;
    font-family: 'Poppins', sans-serif;
    color: var(--text);
    max-width: 1280px;
    margin: 0 auto;
    animation: fadeInPage 0.5s ease;
  }

  @keyframes fadeInPage {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── TOP BAR ── */
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .topbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--gold);
    text-decoration: none;
    font-weight: 700;
    font-size: 15px;
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    transition: var(--transition);
  }

  .back-btn:hover {
    background: var(--gold);
    color: white;
    transform: translateX(-3px);
    box-shadow: var(--shadow);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 18px;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    box-shadow: 0 4px 14px rgba(143,105,8,0.35);
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(143,105,8,0.45);
  }

  .action-btn.secondary {
    background: var(--surface);
    color: var(--gold);
    border: 1.5px solid var(--gold-border);
  }

  .action-btn.secondary:hover {
    background: var(--gold-pale);
    transform: translateY(-2px);
  }

  /* ── ALERT BANNER ── */
  .alert-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: var(--radius);
    margin-bottom: 20px;
    font-weight: 600;
    font-size: 14px;
    animation: slideDown 0.3s ease;
    position: relative;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .alert-banner.success {
    background: var(--green-bg);
    border: 1px solid #b7e8ce;
    color: #0a5c38;
  }

  .alert-banner.error {
    background: var(--red-bg);
    border: 1px solid #f5c6cb;
    color: #8b1a24;
  }

  .alert-icon { display: flex; align-items: center; flex-shrink: 0; }

  .alert-close {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.6;
    line-height: 1;
    transition: var(--transition);
    color: inherit;
    flex-shrink: 0;
  }

  .alert-close:hover { opacity: 1; transform: scale(1.2); }

  /* ── LOADING / EMPTY ── */
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 20px;
    background: var(--surface);
    border-radius: 24px;
    border: 1px solid var(--gold-border);
    text-align: center;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--gold-pale);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-state p, .empty-state p { color: var(--text-muted); font-size: 15px; }
  .empty-icon { font-size: 56px; }
  .empty-state h3 { font-size: 22px; color: var(--text); }

  /* ══ INVOICE WRAPPER ══ */
  .invoice-wrapper {
    background: var(--surface);
    border-radius: 28px;
    border: 1px solid var(--gold-border);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  /* ══ HERO HEADER ══ */
  .invoice-hero {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 40px 40px 36px;
    background: linear-gradient(135deg, #fffdf8 0%, #fdf3d8 50%, #faf0c8 100%);
    border-bottom: 2px solid var(--gold-border);
    overflow: hidden;
    gap: 24px;
    flex-wrap: wrap;
  }

  .hero-decoration {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184,134,11,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-left { display: flex; flex-direction: column; gap: 10px; z-index: 1; }

  .hero-logo {
    width: 200px;
    max-width: 100%;
    transition: var(--transition);
  }

  .hero-logo:hover { transform: scale(1.03); }

  .hero-tagline {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
  }

  .hero-badge { margin-top: 4px; }

  .status-pill {
    display: inline-block;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: capitalize;
    letter-spacing: 0.5px;
    background: var(--gold-pale);
    color: var(--gold);
    border: 1px solid var(--gold-border);
  }

  .status-pill.confirmed { background: var(--green-bg); color: var(--green); border-color: #b7e8ce; }
  .status-pill.cancelled { background: var(--red-bg); color: var(--red); border-color: #f5c6cb; }
  .status-pill.pending { background: var(--amber-bg); color: var(--amber); border-color: #ffd97a; }

  .hero-right { z-index: 1; }

  .invoice-stamp {
    text-align: right;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    padding: 20px 28px;
    border-radius: 18px;
    box-shadow: 0 8px 28px rgba(143,105,8,0.3);
    min-width: 200px;
    position: relative;
    overflow: hidden;
  }

  .invoice-stamp::after {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
  }

  .stamp-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 4px;
    opacity: 0.85;
    text-transform: uppercase;
  }

  .stamp-number {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 1px;
    margin: 6px 0 4px;
  }

  .stamp-date {
    font-size: 12px;
    opacity: 0.8;
    font-weight: 500;
  }

  /* ══ INFO CARDS GRID ══ */
  .info-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    border-bottom: 1px solid var(--gold-border);
  }

  .info-card {
    padding: 24px;
    border-right: 1px solid var(--gold-border);
    transition: var(--transition);
    animation: cardFadeIn 0.5s ease both;
  }

  .info-card:last-child { border-right: none; }

  .info-card:hover {
    background: #fffdf8;
  }

  @keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .info-card:nth-child(1) { animation-delay: 0.1s; }
  .info-card:nth-child(2) { animation-delay: 0.2s; }
  .info-card:nth-child(3) { animation-delay: 0.3s; }
  .info-card:nth-child(4) { animation-delay: 0.4s; }

  .info-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--gold-border);
  }

  .info-card-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(143,105,8,0.25);
  }

  .info-card-header h3 {
    font-size: 14px;
    font-weight: 800;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .info-card-body { display: flex; flex-direction: column; gap: 8px; }

  .info-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    word-break: break-word;
  }

  /* ══ SECTION HEADER ══ */
  .section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 40px;
    margin: 32px 0 20px;
  }

  .section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold-border), transparent);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 800;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    white-space: nowrap;
  }

  .section-icon { font-size: 18px; }

  /* ══ MAIN PAYMENT CARD ══ */
  .payment-card {
    margin: 0 40px 28px;
    border-radius: 18px;
    background: linear-gradient(135deg, #fffdf8, var(--gold-pale));
    border: 1px solid var(--gold-border);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
    animation: cardFadeIn 0.5s ease 0.5s both;
  }

  .payment-card:hover {
    box-shadow: 0 8px 32px rgba(143,105,8,0.15);
    transform: translateY(-2px);
  }

  .payment-card-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    gap: 20px;
    flex-wrap: wrap;
  }

  .payment-info { display: flex; flex-direction: column; gap: 10px; }

  .payment-desc {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  .payment-meta { display: flex; gap: 8px; flex-wrap: wrap; }

  .meta-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: capitalize;
    background: white;
    border: 1px solid var(--gold-border);
    color: var(--gold);
  }

  .meta-tag.paid { background: var(--green-bg); color: var(--green); border-color: #b7e8ce; }
  .meta-tag.due { background: var(--amber-bg); color: var(--amber); border-color: #ffd97a; }

  .payment-amount {
    font-size: 32px;
    font-weight: 900;
    color: var(--gold);
    letter-spacing: -0.5px;
  }

  /* ══ FORM TOGGLE BAR ══ */
  .form-toggle-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 40px 12px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .form-toggle-desc {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    box-shadow: 0 4px 14px rgba(143,105,8,0.3);
  }

  .toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(143,105,8,0.4);
  }

  .toggle-btn.active {
    background: linear-gradient(135deg, #9c1a1a, #c0392b);
    box-shadow: 0 4px 14px rgba(220,53,69,0.3);
  }

  /* ══ CHARGE FORM ══ */
  .charge-form-container {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
    opacity: 0;
    margin: 0 40px;
  }

  .charge-form-container.open {
    max-height: 700px;
    opacity: 1;
    margin-bottom: 24px;
  }

  .charge-form {
    background: linear-gradient(135deg, #fffdf8, #fdf8ec);
    border: 1px solid var(--gold-border);
    border-radius: 20px;
    padding: 28px;
    box-shadow: var(--shadow);
    margin-top: 8px;
  }

  .charge-form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-group { display: flex; flex-direction: column; gap: 7px; }

  .full-col { grid-column: 1 / -1; }

  .slide-in {
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--gold);
  }

  .label-icon { font-size: 14px; }

  input,
  select,
  textarea {
    width: 100%;
    border: 1.5px solid var(--gold-border);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: var(--text);
    background: white;
    transition: var(--transition);
    outline: none;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(143,105,8,0.1);
    transform: translateY(-1px);
  }

  textarea { min-height: 80px; resize: vertical; }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--gold-border);
  }

  .cancel-form-btn {
    padding: 11px 22px;
    border: 1.5px solid var(--gold-border);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--text-muted);
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
  }

  .cancel-form-btn:hover {
    background: #f5f5f5;
    color: var(--text);
  }

  .submit-charge-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 26px;
    border: none;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    font-family: 'Poppins', sans-serif;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 4px 14px rgba(143,105,8,0.3);
  }

  .submit-charge-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(143,105,8,0.4);
  }

  .submit-charge-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  /* ══ CHARGES SECTION ══ */
  .charges-section {
    margin: 0 40px 32px;
  }

  .no-charges {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px;
    background: #fafafa;
    border-radius: 18px;
    border: 2px dashed var(--gold-border);
    color: var(--text-muted);
  }

  .no-charges-icon { font-size: 40px; }

  .charges-table-wrap {
    border-radius: 18px;
    border: 1px solid var(--gold-border);
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: cardFadeIn 0.5s ease;
  }

  .charges-table {
    width: 100%;
    border-collapse: collapse;
  }

  .charges-table thead {
    background: linear-gradient(135deg, #fffdf8, var(--gold-pale));
  }

  .charges-table th {
    padding: 14px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 800;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 2px solid var(--gold-border);
  }

  .charges-table td {
    padding: 14px 16px;
    font-size: 14px;
    border-bottom: 1px solid #f5f0e8;
    vertical-align: middle;
  }

  .charge-row {
    transition: var(--transition);
    animation: rowFadeIn 0.4s ease both;
  }

  @keyframes rowFadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .charge-row:hover { background: #fffdf8; }
  .charge-row:last-child td { border-bottom: none; }

  .charge-row.deleting { opacity: 0.5; pointer-events: none; }
  .charge-row.updating { opacity: 0.7; }

  .row-num {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    width: 32px;
  }

  .charge-title { font-weight: 700; color: var(--text); }

  .method-tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    background: var(--gold-pale);
    color: var(--gold);
    border: 1px solid var(--gold-border);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .status-badge.paid {
    background: var(--green-bg);
    color: var(--green);
  }

  .status-badge.due {
    background: var(--amber-bg);
    color: var(--amber);
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .notes-cell { font-size: 13px; color: var(--text-muted); max-width: 200px; }

  .amount-cell {
    font-weight: 800;
    font-size: 15px;
    color: var(--gold);
    text-align: right;
    white-space: nowrap;
  }

  .right { text-align: right !important; }
  .center { text-align: center !important; }

  .action-group {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .tbl-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
  }

  .tbl-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .tbl-btn.paid {
    background: var(--green-bg);
    color: var(--green);
    border: 1px solid #b7e8ce;
  }

  .tbl-btn.paid:hover:not(:disabled) {
    background: var(--green);
    color: white;
    transform: scale(1.05);
  }

  .tbl-btn.due {
    background: var(--amber-bg);
    color: var(--amber);
    border: 1px solid #ffd97a;
  }

  .tbl-btn.due:hover:not(:disabled) {
    background: var(--amber);
    color: white;
    transform: scale(1.05);
  }

  .tbl-btn.delete {
    background: var(--red-bg);
    color: var(--red);
    border: 1px solid #f5c6cb;
    font-size: 14px;
    padding: 6px 10px;
  }

  .tbl-btn.delete:hover:not(:disabled) {
    background: var(--red);
    color: white;
    transform: scale(1.1);
  }

  /* ══ TOTALS PANEL ══ */
  .totals-panel {
    margin: 0 40px 32px;
    animation: cardFadeIn 0.6s ease 0.3s both;
  }

  .totals-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .total-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-radius: 16px;
    border: 1px solid var(--gold-border);
    background: white;
    transition: var(--transition);
  }

  .total-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow);
  }

  .total-card.success {
    background: linear-gradient(135deg, #f0fdf5, var(--green-bg));
    border-color: #b7e8ce;
  }

  .total-card.warning {
    background: linear-gradient(135deg, #fffdf0, var(--amber-bg));
    border-color: #ffd97a;
  }

  .total-card-icon { font-size: 26px; flex-shrink: 0; }

  .total-card-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .total-card-value {
    font-size: 17px;
    font-weight: 900;
    color: var(--text);
  }

  .total-card.success .total-card-value { color: var(--green); }
  .total-card.warning .total-card-value { color: var(--amber); }

  .grand-total-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 22px 32px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light), #d4a017);
    color: white;
    box-shadow: 0 8px 28px rgba(143,105,8,0.35);
    position: relative;
    overflow: hidden;
    transition: var(--transition);
  }

  .grand-total-bar::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
  }

  .grand-total-bar::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: 60px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }

  .grand-total-bar:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 40px rgba(143,105,8,0.45);
  }

  .grand-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.5px;
    z-index: 1;
  }

  .grand-icon { font-size: 22px; }

  .grand-value {
    font-size: 30px;
    font-weight: 900;
    letter-spacing: -0.5px;
    z-index: 1;
  }

  /* ══ INVOICE FOOTER ══ */
  .invoice-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 24px 40px;
    border-top: 1px solid var(--gold-border);
    background: linear-gradient(135deg, #fffdf8, #fdf8ec);
    flex-wrap: wrap;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .footer-logo {
    width: 100px;
    opacity: 0.8;
  }

  .footer-brand p {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .footer-meta {
    text-align: right;
  }

  .footer-meta p {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .info-cards-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .info-card:nth-child(2) { border-right: none; }
    .info-card:nth-child(3) { border-right: 1px solid var(--gold-border); }

    .info-card:nth-child(3),
    .info-card:nth-child(4) {
      border-top: 1px solid var(--gold-border);
    }

    .totals-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 768px) {
    .page-wrapper { padding: 16px; }
    .invoice-hero { padding: 24px; flex-direction: column; }
    .invoice-stamp { text-align: left; min-width: unset; }
    .stamp-label, .stamp-number, .stamp-date { text-align: left; }

    .info-cards-grid { grid-template-columns: 1fr; }
    .info-card { border-right: none; border-bottom: 1px solid var(--gold-border); }
    .info-card:last-child { border-bottom: none; }

    .section-header, .form-toggle-bar, .charges-section,
    .totals-panel, .payment-card { margin-left: 20px; margin-right: 20px; }

    .charge-form-container { margin-left: 20px; margin-right: 20px; }
    .charge-form-grid { grid-template-columns: 1fr; }
    .payment-card-inner { flex-direction: column; align-items: flex-start; }
    .payment-amount { font-size: 24px; }
    .totals-grid { grid-template-columns: 1fr 1fr; }
    .grand-label { font-size: 14px; }
    .grand-value { font-size: 22px; }
    .invoice-footer { flex-direction: column; padding: 20px; }
    .footer-meta { text-align: left; }
  }

  @media (max-width: 500px) {
    .totals-grid { grid-template-columns: 1fr; }
    .topbar-right { width: 100%; }
    .action-btn { flex: 1; justify-content: center; }
  }

  /* ── PRINT ── */
  @media print {
    body { background: white !important; }

    .admin-sidebar,
    .admin-mobile-topbar,
    .sidebar-backdrop,
    .no-print { display: none !important; }

    .admin-main,
    .page-wrapper {
      margin-left: 0 !important;
      padding: 0 !important;
    }

    .invoice-wrapper {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }

    .charges-table td,
    .charges-table th { font-size: 11px; padding: 8px 10px; }

    .charge-form-container,
    .form-toggle-bar { display: none !important; }

    .grand-total-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice-stamp { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .info-card-icon { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .total-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;