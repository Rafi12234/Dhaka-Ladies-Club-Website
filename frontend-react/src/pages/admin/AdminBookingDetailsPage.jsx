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

function createEmptyRow() {
  return {
    _id: Math.random().toString(36).slice(2),
    categoryId: "",
    newCategoryName: "",
    amount: "",
    paymentStatus: "due",
    notes: "",
    saving: false,
    saved: false,
    error: "",
  };
}

// ─── SVG Icon Components ───────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Print: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  X: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  RotateCcw: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v6h6" />
      <path d="M3 8a9 9 0 1 0 2.25-5.83" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Tag: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  DollarSign: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  ToggleLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
      <circle cx="8" cy="12" r="3" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Loader: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
};

export default function AdminBookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [charges, setCharges] = useState([]);
  const [categories, setCategories] = useState([]);

  const [rows, setRows] = useState([createEmptyRow()]);
  const [showFormPanel, setShowFormPanel] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const pageTotals = useMemo(() => {
    const mainAmount = Number(booking?.total_amount || 0);
    const extraTotal = charges.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const extraPaid = charges.filter((r) => r.payment_status === "paid").reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const extraDue = charges.filter((r) => r.payment_status === "due").reduce((sum, r) => sum + Number(r.amount || 0), 0);
    return { mainAmount, extraTotal, extraPaid, extraDue, grandTotal: mainAmount + extraTotal };
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

  function updateRow(id, field, value) {
    setRows((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value, error: "" } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(id) {
    setRows((prev) => {
      const next = prev.filter((r) => r._id !== id);
      return next.length === 0 ? [createEmptyRow()] : next;
    });
  }

  async function saveRow(row) {
    if (!row.categoryId) {
      setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, error: "Please select a charge type." } : r));
      return;
    }
    const isNew = row.categoryId === "__new__";
    if (isNew && !row.newCategoryName.trim()) {
      setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, error: "Please enter the new charge type name." } : r));
      return;
    }
    if (!row.amount || Number(row.amount) <= 0) {
      setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, error: "Please enter a valid amount." } : r));
      return;
    }

    setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, saving: true, error: "" } : r));

    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges`, {
        method: "POST",
        body: JSON.stringify({
          extra_charge_category_id: isNew ? null : Number(row.categoryId),
          new_category_name: isNew ? row.newCategoryName : null,
          amount: Number(row.amount),
          payment_status: row.paymentStatus,
          payment_method: "cash",
          notes: row.notes,
        }),
      });

      setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, saving: false, saved: true } : r));
      setMessage({ text: "Extra charge saved successfully.", type: "success" });
      await loadDetails();

      // after short delay remove saved row from form list
      setTimeout(() => {
        setRows((prev) => {
          const next = prev.filter((r) => r._id !== row._id);
          return next.length === 0 ? [] : next;
        });
      }, 800);
    } catch (error) {
      setRows((prev) => prev.map((r) => r._id === row._id ? { ...r, saving: false, error: error.message || "Failed to save." } : r));
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
      setMessage({ text: "Status updated successfully.", type: "success" });
      await loadDetails();
    } catch (error) {
      setMessage({ text: error.message || "Failed to update.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteCharge(charge) {
    if (!window.confirm(`Delete "${charge.title}" charge?`)) return;
    setMessage({ text: "", type: "" });
    setDeletingId(charge.id);
    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges/${charge.id}`, { method: "DELETE" });
      setMessage({ text: "Extra charge deleted.", type: "success" });
      await loadDetails();
    } catch (error) {
      setMessage({ text: error.message || "Failed to delete.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => { loadDetails(); }, [bookingId]);

  return (
    <>
      <style>{styles}</style>
      <main className="page-wrapper">

        {/* ── Top Bar ── */}
        <div className="topbar no-print">
          <Link className="back-btn" to="/admin-bookings">
            <Icon.ArrowLeft /> Back to Bookings
          </Link>
          <div className="topbar-right">
            <button className="action-btn secondary" type="button" onClick={loadDetails}>
              <Icon.Refresh /> Refresh
            </button>
            <button className="action-btn primary" type="button" onClick={() => window.print()}>
              <Icon.Print /> Print / PDF
            </button>
          </div>
        </div>

        {/* ── Alert ── */}
        {message.text && (
          <div className={`alert-banner no-print ${message.type}`}>
            <span className="alert-icon">
              {message.type === "success" ? <Icon.CheckCircle /> : <Icon.AlertCircle />}
            </span>
            {message.text}
            <button className="alert-close" onClick={() => setMessage({ text: "", type: "" })}>
              <Icon.X size={16} />
            </button>
          </div>
        )}

        {/* ── Loading / Empty ── */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading booking invoice…</p>
          </div>
        ) : !booking ? (
          <div className="empty-state">
            <div className="empty-icon-wrap"><Icon.FileText /></div>
            <h3>Booking Not Found</h3>
            <p>The requested booking could not be located.</p>
          </div>
        ) : (
          <div className="invoice-wrapper printable-area">

            {/* ══ HERO ══ */}
            <div className="invoice-hero">
              <div className="hero-left">
                <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" className="hero-logo" />
                <p className="hero-tagline">Premium Convention & Party Venue in Dhaka</p>
                <span className={`status-pill ${booking.booking_status}`}>{booking.booking_status}</span>
              </div>
              <div className="hero-right">
                <div className="invoice-stamp">
                  <p className="stamp-label">INVOICE</p>
                  <p className="stamp-number">{booking.booking_no}</p>
                  <p className="stamp-date">{fmtDateTime(booking.booked_at || booking.created_at)}</p>
                  <div className="stamp-deco" />
                </div>
              </div>
              <div className="hero-deco" />
            </div>

            {/* ══ INFO CARDS ══ */}
            <div className="info-cards-grid">
              <InfoCard icon={<Icon.User />} title="Customer">
                <InfoRow label="Name" value={booking.customer_name} />
                <InfoRow label="Email" value={booking.customer_email} />
                <InfoRow label="Phone" value={booking.customer_phone} />
                <InfoRow label="Address" value={booking.customer_address} />
              </InfoCard>
              <InfoCard icon={<Icon.FileText />} title="Booking">
                <InfoRow label="Booking No" value={booking.booking_no} />
                <InfoRow label="Status" value={booking.booking_status} />
                <InfoRow label="Source" value={booking.booking_source} />
                <InfoRow label="Booked At" value={fmtDateTime(booking.booked_at || booking.created_at)} />
              </InfoCard>
              <InfoCard icon={<Icon.Shield />} title="Event">
                <InfoRow label="Title" value={booking.event_title} />
                <InfoRow label="Type" value={booking.event_type} />
                <InfoRow label="Guests" value={booking.guest_count} />
                <InfoRow label="Details" value={booking.event_details} />
              </InfoCard>
              <InfoCard icon={<Icon.Calendar />} title="Slot">
                <InfoRow label="Date" value={booking.slot_date} />
                <InfoRow label="Hall" value={booking.hall_name} />
                <InfoRow label="Shift" value={booking.shift_name} />
                <InfoRow label="Time" value={booking.start_time && booking.end_time ? `${booking.start_time} – ${booking.end_time}` : null} />
              </InfoCard>
            </div>

            {/* ══ MAIN PAYMENT ══ */}
            <SectionDivider icon={<Icon.CreditCard />} title="Main Payment" />

            <div className="payment-card">
              <div className="payment-card-inner">
                <div className="payment-left">
                  <div className="payment-icon-wrap"><Icon.CreditCard /></div>
                  <div>
                    <p className="payment-desc">Main Hall Booking Payment</p>
                    <div className="payment-meta">
                      <span className="meta-tag">{booking.payment_method || "—"}</span>
                      <span className={`meta-tag ${booking.payment_status}`}>{booking.payment_status || booking.booking_status || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="payment-amount">{money(booking.total_amount)}</div>
              </div>
            </div>

            {/* ══ EXTRA CHARGES FORM ══ */}
            <div className="no-print">
              <div className="extra-section-header">
                <SectionDivider icon={<Icon.Tag />} title="Extra Charges" />
                <button
                  className="open-form-btn"
                  type="button"
                  onClick={() => {
                    setShowFormPanel(true);
                    if (rows.length === 0) setRows([createEmptyRow()]);
                  }}
                >
                  <Icon.Plus size={18} />
                  Add Charge
                </button>
              </div>

              {showFormPanel && (
                <div className="form-panel">
                  <div className="form-panel-header">
                    <div className="form-panel-title">
                      <Icon.Plus size={16} />
                      New Extra Charges
                    </div>
                    <button
                      className="close-panel-btn"
                      type="button"
                      onClick={() => { setShowFormPanel(false); setRows([createEmptyRow()]); }}
                    >
                      <Icon.X size={16} />
                      Close
                    </button>
                  </div>

                  <div className="rows-list">
                    {rows.map((row, idx) => (
                      <ChargeRow
                        key={row._id}
                        row={row}
                        idx={idx}
                        categories={categories}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                        onSave={saveRow}
                        canRemove={rows.length > 1 || idx > 0}
                      />
                    ))}
                  </div>

                  <button className="add-row-btn" type="button" onClick={addRow}>
                    <Icon.Plus size={15} />
                    Add Another Charge
                  </button>
                </div>
              )}
            </div>

            {/* ══ CHARGES TABLE ══ */}
            <div className="charges-section">
              {charges.length === 0 ? (
                <div className="no-charges">
                  <div className="no-charges-icon"><Icon.Tag /></div>
                  <p>No extra charges added yet</p>
                </div>
              ) : (
                <div className="charges-table-wrap">
                  <table className="charges-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>#</th>
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
                          <td><span className="method-tag">{charge.payment_method || "cash"}</span></td>
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
                                <button className="tbl-btn paid" type="button" disabled={updatingId === charge.id} onClick={() => updateChargeStatus(charge, "paid")}>
                                  {updatingId === charge.id ? <Icon.Loader /> : <Icon.Check />}
                                  {updatingId === charge.id ? "Updating…" : "Mark Paid"}
                                </button>
                              ) : (
                                <button className="tbl-btn due" type="button" disabled={updatingId === charge.id} onClick={() => updateChargeStatus(charge, "due")}>
                                  {updatingId === charge.id ? <Icon.Loader /> : <Icon.RotateCcw />}
                                  {updatingId === charge.id ? "Updating…" : "Mark Due"}
                                </button>
                              )}
                              <button className="tbl-btn delete" type="button" disabled={deletingId === charge.id} onClick={() => deleteCharge(charge)}>
                                {deletingId === charge.id ? <Icon.Loader /> : <Icon.Trash />}
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

            {/* ══ TOTALS ══ */}
            <SectionDivider icon={<Icon.TrendingUp />} title="Summary" />

            <div className="totals-panel">
              <div className="totals-grid">
                <TotalCard icon={<Icon.Building />} label="Main Booking" value={money(pageTotals.mainAmount)} variant="neutral" />
                <TotalCard icon={<Icon.Plus size={20} />} label="Extra Charges" value={money(pageTotals.extraTotal)} variant="neutral" />
                <TotalCard icon={<Icon.CheckCircle />} label="Extra Paid" value={money(pageTotals.extraPaid)} variant="success" />
                <TotalCard icon={<Icon.AlertCircle />} label="Extra Due" value={money(pageTotals.extraDue)} variant="warning" />
              </div>
              <div className="grand-total-bar">
                <div className="grand-label">
                  <span className="grand-icon-wrap"><Icon.TrendingUp /></span>
                  Grand Invoice Total
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

// ─── Sub-Components ────────────────────────────────────────────────────────

function ChargeRow({ row, idx, categories, onUpdate, onRemove, onSave, canRemove }) {
  const isNew = row.categoryId === "__new__";
  return (
    <div className={`charge-form-row ${row.saved ? "row-saved" : ""}`}>
      <div className="row-index">{idx + 1}</div>
      <div className="row-fields">
        <div className="row-fields-grid">
          {/* Charge Type */}
          <div className="form-group">
            <label>
              <Icon.Tag /> Charge Type
            </label>
            <select value={row.categoryId} onChange={(e) => onUpdate(row._id, "categoryId", e.target.value)} disabled={row.saving || row.saved}>
              <option value="">Select type…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              <option value="__new__">+ New Charge Type</option>
            </select>
          </div>

          {/* New category name */}
          {isNew && (
            <div className="form-group slide-in">
              <label>
                <Icon.Tag /> New Type Name
              </label>
              <input
                type="text"
                value={row.newCategoryName}
                onChange={(e) => onUpdate(row._id, "newCategoryName", e.target.value)}
                placeholder="e.g. Sound System"
                disabled={row.saving || row.saved}
              />
            </div>
          )}

          {/* Amount */}
          <div className="form-group">
            <label>
              <Icon.DollarSign /> Amount
            </label>
            <input
              type="number"
              min="1"
              value={row.amount}
              onChange={(e) => onUpdate(row._id, "amount", e.target.value)}
              placeholder="Enter amount"
              disabled={row.saving || row.saved}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label>
              <Icon.ToggleLeft /> Status
            </label>
            <select value={row.paymentStatus} onChange={(e) => onUpdate(row._id, "paymentStatus", e.target.value)} disabled={row.saving || row.saved}>
              <option value="due">Due</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group notes-group">
            <label>
              <Icon.MessageSquare /> Notes
            </label>
            <input
              type="text"
              value={row.notes}
              onChange={(e) => onUpdate(row._id, "notes", e.target.value)}
              placeholder="Optional notes…"
              disabled={row.saving || row.saved}
            />
          </div>
        </div>

        {/* Error */}
        {row.error && (
          <p className="row-error">
            <Icon.AlertCircle /> {row.error}
          </p>
        )}
      </div>

      {/* Row Actions */}
      <div className="row-actions">
        <button
          className={`save-row-btn ${row.saved ? "saved" : ""}`}
          type="button"
          disabled={row.saving || row.saved}
          onClick={() => onSave(row)}
        >
          {row.saved ? (
            <><Icon.Check /> Saved</>
          ) : row.saving ? (
            <><Icon.Loader /> Saving…</>
          ) : (
            <><Icon.Save /> Save</>
          )}
        </button>

        {canRemove && !row.saved && (
          <button className="remove-row-btn" type="button" disabled={row.saving} onClick={() => onRemove(row._id)}>
            <Icon.X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <div className="info-card-icon">{icon}</div>
        <h3>{title}</h3>
      </div>
      <div className="info-card-body">{children}</div>
    </div>
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

function SectionDivider({ icon, title }) {
  return (
    <div className="section-header">
      <div className="section-line" />
      <h2 className="section-title">
        <span className="section-icon">{icon}</span>
        {title}
      </h2>
      <div className="section-line" />
    </div>
  );
}

function TotalCard({ icon, label, value, variant }) {
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

// ─── Styles ────────────────────────────────────────────────────────────────
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
    --shadow: 0 4px 24px rgba(0,0,0,0.07);
    --shadow-lg: 0 12px 48px rgba(0,0,0,0.11);
    --transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
  }

  body { background: var(--bg); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInPage { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cardIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
  @keyframes rowIn { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
  @keyframes panelOpen { from { opacity:0; transform:translateY(-8px) scale(0.99); } to { opacity:1; transform:translateY(0) scale(1); } }

  /* ── PAGE ── */
  .page-wrapper {
    padding: 28px;
    font-family: 'Poppins', sans-serif;
    color: var(--text);
    max-width: 1280px;
    margin: 0 auto;
    animation: fadeInPage 0.45s ease;
  }

  /* ── TOPBAR ── */
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .topbar-right { display: flex; gap: 10px; align-items: center; }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--gold);
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    transition: var(--transition);
  }
  .back-btn:hover { background: var(--gold); color: white; transform: translateX(-3px); box-shadow: var(--shadow); }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: var(--transition);
  }
  .action-btn.primary {
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    box-shadow: 0 4px 14px rgba(143,105,8,0.32);
  }
  .action-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(143,105,8,0.42); }
  .action-btn.secondary {
    background: var(--surface);
    color: var(--gold);
    border: 1.5px solid var(--gold-border);
  }
  .action-btn.secondary:hover { background: var(--gold-pale); transform: translateY(-2px); }

  /* ── ALERT ── */
  .alert-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    border-radius: var(--radius);
    margin-bottom: 18px;
    font-weight: 600;
    font-size: 13.5px;
    animation: slideDown 0.3s ease;
  }
  .alert-banner.success { background: var(--green-bg); border: 1px solid #b7e8ce; color: #0a5c38; }
  .alert-banner.error { background: var(--red-bg); border: 1px solid #f5c6cb; color: #8b1a24; }
  .alert-icon { display: flex; align-items: center; flex-shrink: 0; }
  .alert-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    display: flex;
    align-items: center;
    transition: var(--transition);
    color: inherit;
    flex-shrink: 0;
  }
  .alert-close:hover { opacity: 1; transform: scale(1.2); }

  /* ── LOADING / EMPTY ── */
  .loading-state, .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; padding: 80px 20px;
    background: var(--surface); border-radius: 24px;
    border: 1px solid var(--gold-border); text-align: center;
  }
  .spinner {
    width: 46px; height: 46px;
    border: 4px solid var(--gold-pale);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.85s linear infinite;
  }
  .loading-state p, .empty-state p { color: var(--text-muted); font-size: 14px; }
  .empty-icon-wrap {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--gold-pale); display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }
  .empty-state h3 { font-size: 20px; color: var(--text); }

  /* ══ INVOICE WRAPPER ══ */
  .invoice-wrapper {
    background: var(--surface);
    border-radius: 28px;
    border: 1px solid var(--gold-border);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  /* ══ HERO ══ */
  .invoice-hero {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 40px 40px 34px;
    background: linear-gradient(135deg, #fffdf8 0%, #fdf3d8 55%, #faf0c8 100%);
    border-bottom: 2px solid var(--gold-border);
    overflow: hidden;
    gap: 24px;
    flex-wrap: wrap;
  }
  .hero-deco {
    position: absolute; top: -90px; right: -90px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(184,134,11,0.11) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-left { display: flex; flex-direction: column; gap: 10px; z-index: 1; }
  .hero-logo { width: 190px; max-width: 100%; transition: var(--transition); }
  .hero-logo:hover { transform: scale(1.03); }
  .hero-tagline { color: var(--text-muted); font-size: 13px; font-weight: 500; }
  .status-pill {
    display: inline-block; padding: 4px 14px; border-radius: 999px;
    font-size: 11px; font-weight: 700; text-transform: capitalize; letter-spacing: 0.5px;
    background: var(--gold-pale); color: var(--gold); border: 1px solid var(--gold-border);
  }
  .status-pill.confirmed { background: var(--green-bg); color: var(--green); border-color: #b7e8ce; }
  .status-pill.cancelled { background: var(--red-bg); color: var(--red); border-color: #f5c6cb; }
  .status-pill.pending { background: var(--amber-bg); color: var(--amber); border-color: #ffd97a; }

  .hero-right { z-index: 1; }
  .invoice-stamp {
    position: relative; overflow: hidden;
    text-align: right;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white; padding: 20px 26px; border-radius: 18px;
    box-shadow: 0 8px 28px rgba(143,105,8,0.3); min-width: 196px;
  }
  .stamp-deco {
    position: absolute; top: -22px; right: -22px;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,0.12); pointer-events: none;
  }
  .stamp-label { font-size: 11px; font-weight: 800; letter-spacing: 4px; opacity: 0.82; text-transform: uppercase; }
  .stamp-number { font-size: 21px; font-weight: 900; letter-spacing: 1px; margin: 6px 0 4px; }
  .stamp-date { font-size: 12px; opacity: 0.78; font-weight: 500; }

  /* ══ INFO CARDS ══ */
  .info-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-bottom: 1px solid var(--gold-border);
  }
  .info-card {
    padding: 22px; border-right: 1px solid var(--gold-border);
    transition: var(--transition); animation: cardIn 0.45s ease both;
  }
  .info-card:last-child { border-right: none; }
  .info-card:hover { background: #fffdf8; }
  .info-card:nth-child(1) { animation-delay: 0.08s; }
  .info-card:nth-child(2) { animation-delay: 0.16s; }
  .info-card:nth-child(3) { animation-delay: 0.24s; }
  .info-card:nth-child(4) { animation-delay: 0.32s; }
  .info-card-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px; padding-bottom: 12px;
    border-bottom: 1px solid var(--gold-border);
  }
  .info-card-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(143,105,8,0.25);
  }
  .info-card-header h3 {
    font-size: 13px; font-weight: 800; color: var(--gold);
    text-transform: uppercase; letter-spacing: 0.7px;
  }
  .info-card-body { display: flex; flex-direction: column; gap: 8px; }
  .info-row { display: flex; flex-direction: column; gap: 2px; }
  .info-label { font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 13px; font-weight: 600; color: var(--text); word-break: break-word; }

  /* ══ SECTION DIVIDER ══ */
  .section-header {
    display: flex; align-items: center; gap: 14px;
    padding: 0 40px; margin: 30px 0 18px;
  }
  .section-line {
    flex: 1; height: 1px;
    background: linear-gradient(to right, transparent, var(--gold-border), transparent);
  }
  .section-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; color: var(--gold);
    text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
  }
  .section-icon { display: flex; align-items: center; }

  /* ══ MAIN PAYMENT ══ */
  .payment-card {
    margin: 0 40px 28px;
    border-radius: 18px;
    background: linear-gradient(135deg, #fffdf8, var(--gold-pale));
    border: 1px solid var(--gold-border);
    box-shadow: var(--shadow);
    transition: var(--transition);
    animation: cardIn 0.45s ease 0.4s both;
  }
  .payment-card:hover { box-shadow: 0 8px 32px rgba(143,105,8,0.14); transform: translateY(-2px); }
  .payment-card-inner {
    display: flex; justify-content: space-between; align-items: center;
    padding: 22px 26px; gap: 20px; flex-wrap: wrap;
  }
  .payment-left { display: flex; align-items: center; gap: 16px; }
  .payment-icon-wrap {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(143,105,8,0.28);
  }
  .payment-desc { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .payment-meta { display: flex; gap: 7px; flex-wrap: wrap; }
  .meta-tag {
    display: inline-block; padding: 3px 11px; border-radius: 999px;
    font-size: 11px; font-weight: 700; text-transform: capitalize;
    background: white; border: 1px solid var(--gold-border); color: var(--gold);
  }
  .meta-tag.paid { background: var(--green-bg); color: var(--green); border-color: #b7e8ce; }
  .meta-tag.due { background: var(--amber-bg); color: var(--amber); border-color: #ffd97a; }
  .payment-amount { font-size: 30px; font-weight: 900; color: var(--gold); letter-spacing: -0.5px; }

  /* ══ EXTRA SECTION HEADER ══ */
  .extra-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 40px;
  }
  .extra-section-header .section-header {
    flex: 1;
    margin-right: 0;
  }

  .open-form-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border: none;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 4px 14px rgba(143,105,8,0.3);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .open-form-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(143,105,8,0.4); }

  /* ══ FORM PANEL ══ */
  .form-panel {
    margin: 0 40px 20px;
    background: linear-gradient(135deg, #fffdf8, #fdf8ec);
    border: 1px solid var(--gold-border);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: panelOpen 0.32s ease;
  }

  .form-panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 20px;
    background: linear-gradient(135deg, var(--gold-pale), #fdf3d8);
    border-bottom: 1px solid var(--gold-border);
  }
  .form-panel-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; color: var(--gold);
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .close-panel-btn {
    display: inline-flex; align-items: center; gap: 5px;
    background: white; border: 1px solid var(--gold-border);
    border-radius: 8px; padding: 6px 12px;
    font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 700;
    color: var(--text-muted); cursor: pointer; transition: var(--transition);
  }
  .close-panel-btn:hover { background: var(--red-bg); color: var(--red); border-color: #f5c6cb; }

  /* ── ROWS LIST ── */
  .rows-list { display: flex; flex-direction: column; gap: 0; }

  .charge-form-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid var(--gold-border);
    transition: var(--transition);
    animation: rowIn 0.3s ease both;
  }
  .charge-form-row:last-child { border-bottom: none; }
  .charge-form-row:hover { background: rgba(245, 237, 218, 0.3); }
  .charge-form-row.row-saved { background: rgba(232, 247, 238, 0.5); }

  .row-index {
    width: 28px; height: 28px; min-width: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white; display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; margin-top: 26px;
    box-shadow: 0 2px 8px rgba(143,105,8,0.25);
  }

  .row-fields { flex: 1; min-width: 0; }

  .row-fields-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 0;
  }

  .notes-group { grid-column: span 1; }

  .slide-in { animation: slideIn 0.28s ease; }

  .form-group { display: flex; flex-direction: column; gap: 5px; }
  label {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 700; color: var(--gold);
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  label svg { flex-shrink: 0; }

  input, select, textarea {
    width: 100%;
    border: 1.5px solid var(--gold-border);
    border-radius: 9px;
    padding: 9px 11px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: var(--text);
    background: white;
    transition: var(--transition);
    outline: none;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(143,105,8,0.09);
  }
  input:disabled, select:disabled { opacity: 0.6; background: #f9f9f9; cursor: not-allowed; }
  textarea { min-height: 70px; resize: vertical; }

  .row-error {
    display: flex; align-items: center; gap: 6px;
    margin-top: 8px;
    font-size: 12px; font-weight: 600; color: var(--red);
    animation: slideDown 0.25s ease;
  }

  /* ── ROW ACTIONS ── */
  .row-actions {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    margin-top: 22px; flex-shrink: 0;
  }

  .save-row-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border: none; border-radius: 9px;
    font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 12px;
    cursor: pointer; transition: var(--transition); white-space: nowrap;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: white;
    box-shadow: 0 3px 10px rgba(143,105,8,0.28);
  }
  .save-row-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(143,105,8,0.38); }
  .save-row-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .save-row-btn.saved { background: linear-gradient(135deg, #198754, #27ae60); box-shadow: 0 3px 10px rgba(25,135,84,0.28); }

  .remove-row-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border: 1px solid #f5c6cb;
    border-radius: 8px; background: var(--red-bg); color: var(--red);
    cursor: pointer; transition: var(--transition);
  }
  .remove-row-btn:hover { background: var(--red); color: white; transform: scale(1.1); }
  .remove-row-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── ADD ROW BUTTON ── */
  .add-row-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px;
    border: 2px dashed var(--gold-border); border-top: 1px solid var(--gold-border);
    border-radius: 0;
    background: transparent;
    color: var(--gold); font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 13px;
    cursor: pointer; transition: var(--transition);
  }
  .add-row-btn:hover { background: var(--gold-pale); border-color: var(--gold); }

  /* ══ CHARGES TABLE ══ */
  .charges-section { margin: 0 40px 28px; }
  .no-charges {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 38px; background: #fafafa;
    border-radius: 16px; border: 2px dashed var(--gold-border); color: var(--text-muted);
  }
  .no-charges-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--gold-pale); display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }
  .charges-table-wrap {
    border-radius: 16px; border: 1px solid var(--gold-border);
    overflow: hidden; box-shadow: var(--shadow); animation: cardIn 0.45s ease;
  }
  .charges-table { width: 100%; border-collapse: collapse; }
  .charges-table thead {
    background: linear-gradient(135deg, #fffdf8, var(--gold-pale));
  }
  .charges-table th {
    padding: 13px 15px; text-align: left;
    font-size: 11px; font-weight: 800; color: var(--gold);
    text-transform: uppercase; letter-spacing: 0.8px;
    border-bottom: 2px solid var(--gold-border);
  }
  .charges-table td {
    padding: 13px 15px; font-size: 13.5px;
    border-bottom: 1px solid #f5f0e8; vertical-align: middle;
  }
  .charge-row { transition: var(--transition); animation: rowIn 0.35s ease both; }
  .charge-row:hover { background: #fffdf8; }
  .charge-row:last-child td { border-bottom: none; }
  .charge-row.deleting { opacity: 0.45; pointer-events: none; }
  .charge-row.updating { opacity: 0.65; }
  .row-num { font-size: 12px; font-weight: 700; color: var(--text-muted); }
  .charge-title { font-weight: 700; color: var(--text); }
  .method-tag {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; text-transform: capitalize;
    background: var(--gold-pale); color: var(--gold); border: 1px solid var(--gold-border);
  }
  .status-badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px;
    border-radius: 999px; font-size: 11.5px; font-weight: 700; text-transform: capitalize;
  }
  .status-badge.paid { background: var(--green-bg); color: var(--green); }
  .status-badge.due { background: var(--amber-bg); color: var(--amber); }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .notes-cell { font-size: 13px; color: var(--text-muted); max-width: 180px; }
  .amount-cell { font-weight: 800; font-size: 14px; color: var(--gold); text-align: right; white-space: nowrap; }
  .right { text-align: right !important; }
  .center { text-align: center !important; }

  .action-group { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }

  .tbl-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border: none; border-radius: 8px;
    font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: var(--transition); white-space: nowrap;
  }
  .tbl-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .tbl-btn.paid { background: var(--green-bg); color: var(--green); border: 1px solid #b7e8ce; }
  .tbl-btn.paid:hover:not(:disabled) { background: var(--green); color: white; transform: scale(1.04); }
  .tbl-btn.due { background: var(--amber-bg); color: var(--amber); border: 1px solid #ffd97a; }
  .tbl-btn.due:hover:not(:disabled) { background: var(--amber); color: white; transform: scale(1.04); }
  .tbl-btn.delete { background: var(--red-bg); color: var(--red); border: 1px solid #f5c6cb; padding: 6px 10px; }
  .tbl-btn.delete:hover:not(:disabled) { background: var(--red); color: white; transform: scale(1.08); }

  /* ══ TOTALS ══ */
  .totals-panel { margin: 0 40px 30px; animation: cardIn 0.5s ease 0.25s both; }
  .totals-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
  .total-card {
    display: flex; align-items: center; gap: 14px;
    padding: 17px 19px; border-radius: 14px;
    border: 1px solid var(--gold-border); background: white;
    transition: var(--transition);
  }
  .total-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .total-card.success { background: linear-gradient(135deg, #f0fdf5, var(--green-bg)); border-color: #b7e8ce; }
  .total-card.warning { background: linear-gradient(135deg, #fffdf0, var(--amber-bg)); border-color: #ffd97a; }
  .total-card-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: var(--gold-pale); color: var(--gold);
    display: flex; align-items: center; justify-content: center;
  }
  .total-card.success .total-card-icon { background: var(--green-bg); color: var(--green); }
  .total-card.warning .total-card-icon { background: var(--amber-bg); color: var(--amber); }
  .total-card-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .total-card-value { font-size: 16px; font-weight: 900; color: var(--text); }
  .total-card.success .total-card-value { color: var(--green); }
  .total-card.warning .total-card-value { color: var(--amber); }

  .grand-total-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 21px 30px; border-radius: 16px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light), #d4a017);
    color: white; box-shadow: 0 8px 28px rgba(143,105,8,0.32);
    position: relative; overflow: hidden; transition: var(--transition);
  }
  .grand-total-bar::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 130px; height: 130px; border-radius: 50%;
    background: rgba(255,255,255,0.12); pointer-events: none;
  }
  .grand-total-bar:hover { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(143,105,8,0.42); }
  .grand-label { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 800; z-index: 1; }
  .grand-icon-wrap { display: flex; align-items: center; }
  .grand-value { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; z-index: 1; }

  /* ══ FOOTER ══ */
  .invoice-footer {
    display: flex; justify-content: space-between; align-items: center;
    gap: 20px; padding: 22px 40px;
    border-top: 1px solid var(--gold-border);
    background: linear-gradient(135deg, #fffdf8, #fdf8ec);
    flex-wrap: wrap;
  }
  .footer-brand { display: flex; align-items: center; gap: 14px; }
  .footer-logo { width: 90px; opacity: 0.75; }
  .footer-brand p { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .footer-meta { text-align: right; }
  .footer-meta p { font-size: 12px; color: var(--text-muted); font-weight: 500; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1100px) {
    .row-fields-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .notes-group { grid-column: span 1; }
    .info-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .info-card:nth-child(2) { border-right: none; }
    .info-card:nth-child(3) { border-right: 1px solid var(--gold-border); border-top: 1px solid var(--gold-border); }
    .info-card:nth-child(4) { border-top: 1px solid var(--gold-border); }
    .totals-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 768px) {
    .page-wrapper { padding: 14px; }
    .invoice-hero { padding: 22px; flex-direction: column; }
    .section-header, .payment-card, .form-panel, .charges-section, .totals-panel, .invoice-footer { margin-left: 16px; margin-right: 16px; }
    .row-fields-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .payment-card-inner { flex-direction: column; align-items: flex-start; }
    .payment-amount { font-size: 24px; }
    .grand-label { font-size: 13px; }
    .grand-value { font-size: 22px; }
    .footer-meta { text-align: left; }
    .invoice-footer { flex-direction: column; padding: 18px; }
    .extra-section-header { flex-direction: column; align-items: flex-start; gap: 10px; padding-right: 16px; }
    .charge-form-row { flex-direction: column; }
    .row-actions { flex-direction: row; margin-top: 6px; }
  }
  @media (max-width: 500px) {
    .info-cards-grid { grid-template-columns: 1fr; }
    .info-card { border-right: none; border-bottom: 1px solid var(--gold-border); }
    .totals-grid { grid-template-columns: 1fr; }
    .row-fields-grid { grid-template-columns: 1fr; }
    .topbar-right { width: 100%; }
    .action-btn { flex: 1; justify-content: center; }
  }

  /* ── PRINT ── */
  @media print {
    body { background: white !important; }
    .admin-sidebar, .admin-mobile-topbar, .sidebar-backdrop, .no-print { display: none !important; }
    .admin-main, .page-wrapper { margin-left: 0 !important; padding: 0 !important; }
    .invoice-wrapper { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
    .charges-table td, .charges-table th { font-size: 11px; padding: 8px 10px; }
    .grand-total-bar, .invoice-stamp, .info-card-icon, .total-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;