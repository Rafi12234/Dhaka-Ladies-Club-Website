import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ADMIN_TOKEN_KEY = "dlc_admin_token_v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value === "available") return "Available";
  if (value === "booked") return "Booked";
  if (value === "blocked") return "Blocked";
  if (value === "payment_in_progress") return "Booking In Progress";
  if (value === "pending_approval") return "Pending Approval";

  return status || "Unknown";
}

function statusBadgeStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value === "available") {
    return {
      background: "#e8f7ee",
      color: "#137333",
      border: "1px solid #b7e1c1",
    };
  }

  if (value === "booked") {
    return {
      background: "#fde8e8",
      color: "#b42318",
      border: "1px solid #f5b5b5",
    };
  }

  if (value === "blocked") {
    return {
      background: "#eef0f2",
      color: "#495057",
      border: "1px solid #ced4da",
    };
  }

  if (value === "payment_in_progress") {
    return {
      background: "#fff3cd",
      color: "#8a5a00",
      border: "1px solid #ffe08a",
    };
  }

  return {
    background: "#f1f3f5",
    color: "#343a40",
    border: "1px solid #dee2e6",
  };
}

async function adminApi(path, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const headers = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export default function AdminCalendarSlotsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [shifts, setShifts] = useState([]);
  const [slots, setSlots] = useState([]);

  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState(addDaysString(30));
  const [untilDate, setUntilDate] = useState(addDaysString(365));

  const [manualDate, setManualDate] = useState(todayString());
  const [manualShiftId, setManualShiftId] = useState("");
  const [manualStatus, setManualStatus] = useState("blocked");

  const summary = useMemo(() => {
    return slots.reduce(
      (acc, slot) => {
        const status = String(slot.slot_status || "").toLowerCase();

        if (status === "available") acc.available += 1;
        else if (status === "booked") acc.booked += 1;
        else if (status === "blocked") acc.blocked += 1;
        else if (status === "payment_in_progress") acc.paymentInProgress += 1;
        else if (status === "pending_approval") acc.pendingApproval += 1;
        else acc.other += 1;

        return acc;
      },
      {
        available: 0,
        booked: 0,
        blocked: 0,
        paymentInProgress: 0,
        pendingApproval: 0,
        other: 0,
      }
    );
  }, [slots]);

  async function loadBookingContext() {
    const data = await adminApi("/booking-context", {
      method: "GET",
    });

    const context = data?.data || data || {};
    const loadedShifts = Array.isArray(context.shifts) ? context.shifts : [];

    setShifts(loadedShifts);

    if (loadedShifts.length > 0 && !manualShiftId) {
      setManualShiftId(String(loadedShifts[0].id));
    }
  }

  async function loadSlots() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const query = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const data = await adminApi(`/admin/calendar-slots?${query.toString()}`, {
        method: "GET",
      });

      setSlots(data?.data?.slots || []);
    } catch (err) {
      if (String(err.message || "").toLowerCase().includes("unauthenticated")) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin-login");
        return;
      }

      setError(err.message || "Failed to load calendar slots.");
    } finally {
      setLoading(false);
    }
  }

  async function generateUntil() {
    const confirmed = window.confirm(
      `This will create/update all slots from today until ${untilDate}. Already booked slots will remain booked. Continue?`
    );

    if (!confirmed) return;

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const data = await adminApi("/admin/calendar-slots/generate-until", {
        method: "POST",
        body: JSON.stringify({
          until_date: untilDate,
        }),
      });

      const result = data?.data || {};

      setMessage(
        `Done. Created: ${result.created || 0}, Updated to available: ${
          result.updated_to_available || 0
        }, Kept locked: ${result.kept_locked ?? result.kept_booked ?? 0}.`
      );

      await loadSlots();
    } catch (err) {
      setError(err.message || "Failed to generate slots.");
    } finally {
      setGenerating(false);
    }
  }

  async function updateManualStatus() {
    if (!manualDate || !manualShiftId || !manualStatus) {
      setError("Please select date, shift and status.");
      return;
    }

    setSavingStatus(true);
    setError("");
    setMessage("");

    try {
      const data = await adminApi("/admin/calendar-slots/status", {
        method: "PATCH",
        body: JSON.stringify({
          slot_date: manualDate,
          shift_id: Number(manualShiftId),
          slot_status: manualStatus,
        }),
      });

      setMessage(data?.message || "Slot status updated successfully.");
      await loadSlots();
    } catch (err) {
      setError(err.message || "Failed to update slot status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function quickUpdateSlot(slot, newStatus) {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${slot.shift_name || "this shift"} on ${
        slot.slot_date
      } as ${newStatus}?`
    );

    if (!confirmed) return;

    setSavingStatus(true);
    setError("");
    setMessage("");

    try {
      const data = await adminApi("/admin/calendar-slots/status", {
        method: "PATCH",
        body: JSON.stringify({
          slot_date: slot.slot_date,
          shift_id: Number(slot.shift_id),
          slot_status: newStatus,
        }),
      });

      setMessage(data?.message || "Slot status updated successfully.");
      await loadSlots();
    } catch (err) {
      setError(err.message || "Failed to update slot status.");
    } finally {
      setSavingStatus(false);
    }
  }

  useEffect(() => {
    loadBookingContext().catch(() => {
      setError("Failed to load shift information.");
    });
  }, []);

  useEffect(() => {
    loadSlots();
  }, []);

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandBox}>
          <div style={styles.brandTitle}>Dhaka Ladies Club</div>
          <div style={styles.brandSubtitle}>Admin Panel</div>
        </div>

        <nav style={styles.nav}>
          <Link style={styles.navLink} to="/admin-dashboard">
            Dashboard
          </Link>
          <Link style={styles.navLink} to="/admin-bookings">
            Bookings
          </Link>
          <Link style={styles.navLink} to="/admin-manual-booking">
            Manual Booking
          </Link>
          <Link style={styles.navLinkActive} to="/admin-calendar-slots">
            Calendar Slots
          </Link>
          <Link style={styles.navLink} to="/admin-homepage-content">
            Homepage Content
          </Link>
          <Link to="/admin-calendar-slots">Calendar Slots</Link>
          <Link style={styles.navLink} to="/">
            View Website
          </Link>
        </nav>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Calendar Slot Management</h1>
            <p style={styles.subtitle}>
              Generate available slots, block specific dates, and keep booked
              slots protected.
            </p>
          </div>
        </div>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <section style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Generate Available Slots</h2>
            <p style={styles.cardText}>
              Select a date. All slots from today until that date will become
              available. Already booked slots will stay booked.
            </p>

            <label style={styles.label}>Available Until Date</label>
            <input
              style={styles.input}
              type="date"
              value={untilDate}
              min={todayString()}
              onChange={(e) => setUntilDate(e.target.value)}
            />

            <button
              style={styles.primaryButton}
              type="button"
              disabled={generating}
              onClick={generateUntil}
            >
              {generating ? "Updating..." : "Generate / Update Slots"}
            </button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Manual Slot Status</h2>
            <p style={styles.cardText}>
              Block or unblock a specific date and shift. Booked slots cannot be
              changed.
            </p>

            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={manualDate}
              min={todayString()}
              onChange={(e) => setManualDate(e.target.value)}
            />

            <label style={styles.label}>Shift</label>
            <select
              style={styles.input}
              value={manualShiftId}
              onChange={(e) => setManualShiftId(e.target.value)}
            >
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}{" "}
                  {shift.start_time && shift.end_time
                    ? `(${shift.start_time} - ${shift.end_time})`
                    : ""}
                </option>
              ))}
            </select>

            <label style={styles.label}>Status</label>
            <select
              style={styles.input}
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value)}
            >
              <option value="blocked">Blocked</option>
              <option value="available">Available</option>
            </select>

            <button
              style={styles.primaryButton}
              type="button"
              disabled={savingStatus}
              onClick={updateManualStatus}
            >
              {savingStatus ? "Saving..." : "Update Slot Status"}
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.cardTitle}>View Slots</h2>
              <p style={styles.cardText}>
                Filter slots by date range and update individual slots quickly.
              </p>
            </div>
          </div>

          <div style={styles.filterRow}>
            <div style={styles.field}>
              <label style={styles.label}>Start Date</label>
              <input
                style={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>End Date</label>
              <input
                style={styles.input}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button
              style={styles.secondaryButton}
              type="button"
              disabled={loading}
              onClick={loadSlots}
            >
              {loading ? "Loading..." : "Load Slots"}
            </button>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>Available: {summary.available}</div>
            <div style={styles.summaryCard}>Booked: {summary.booked}</div>
            <div style={styles.summaryCard}>Blocked: {summary.blocked}</div>
            <div style={styles.summaryCard}>
              Payment Progress: {summary.paymentInProgress}
            </div>
            <div style={styles.summaryCard}>
              Pending Approval: {summary.pendingApproval}
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Shift</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr>
                    <td style={styles.emptyTd} colSpan="5">
                      {loading ? "Loading slots..." : "No slots found."}
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => {
                    const status = String(slot.slot_status || "").toLowerCase();
                    const isLocked =
                      status === "booked" ||
                      status === "payment_in_progress" ||
                      status === "pending_approval";
                    const isBlocked = status === "blocked";

                    return (
                      <tr key={slot.id}>
                        <td style={styles.td}>{slot.slot_date}</td>
                        <td style={styles.td}>
                          {slot.shift_name || `Shift #${slot.shift_id}`}
                        </td>
                        <td style={styles.td}>
                          {slot.start_time && slot.end_time
                            ? `${slot.start_time} - ${slot.end_time}`
                            : "-"}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...statusBadgeStyle(status) }}>
                            {formatStatus(status)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {isLocked ? (
                            <span style={styles.lockedText}>
                              {formatStatus(status)} locked
                            </span>
                          ) : isBlocked ? (
                            <button
                              style={styles.smallButton}
                              type="button"
                              disabled={savingStatus}
                              onClick={() => quickUpdateSlot(slot, "available")}
                            >
                              Make Available
                            </button>
                          ) : (
                            <button
                              style={styles.dangerButton}
                              type="button"
                              disabled={savingStatus}
                              onClick={() => quickUpdateSlot(slot, "blocked")}
                            >
                              Block
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f8f5ef",
    color: "#222",
  },
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#16110b",
    color: "#fff",
    padding: "24px 18px",
    position: "sticky",
    top: 0,
  },
  brandBox: {
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    paddingBottom: "20px",
    marginBottom: "20px",
  },
  brandTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#d6a84f",
  },
  brandSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    marginTop: "4px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navLink: {
    color: "rgba(255,255,255,0.82)",
    textDecoration: "none",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "14px",
  },
  navLinkActive: {
    color: "#16110b",
    background: "#d6a84f",
    textDecoration: "none",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
  },
  main: {
    flex: 1,
    padding: "30px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    color: "#2d2418",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#6f6253",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  card: {
    background: "#fff",
    border: "1px solid #eadfce",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 10px 28px rgba(48, 35, 20, 0.07)",
    marginBottom: "20px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#2d2418",
  },
  cardText: {
    margin: "8px 0 18px",
    color: "#6f6253",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontWeight: "700",
    fontSize: "13px",
    color: "#4b3b2a",
    marginBottom: "7px",
    marginTop: "12px",
  },
  input: {
    width: "100%",
    border: "1px solid #d8c9b5",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    marginTop: "16px",
    background: "#b8860b",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    background: "#2d2418",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    alignSelf: "end",
  },
  smallButton: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#198754",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  dangerButton: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#6c757d",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "14px",
    alignItems: "end",
    marginBottom: "16px",
  },
  field: {
    minWidth: 0,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  summaryCard: {
    background: "#f8f5ef",
    border: "1px solid #eadfce",
    borderRadius: "12px",
    padding: "12px",
    fontWeight: "700",
    color: "#3a2c1c",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #eadfce",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8f5ef",
    borderBottom: "1px solid #eadfce",
    color: "#4b3b2a",
    fontSize: "13px",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #f0e7dc",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  emptyTd: {
    padding: "24px",
    textAlign: "center",
    color: "#6f6253",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  lockedText: {
    fontSize: "13px",
    color: "#b42318",
    fontWeight: "700",
  },
  successBox: {
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#e8f7ee",
    color: "#137333",
    border: "1px solid #b7e1c1",
    marginBottom: "16px",
    fontWeight: "700",
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#fde8e8",
    color: "#b42318",
    border: "1px solid #f5b5b5",
    marginBottom: "16px",
    fontWeight: "700",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
};