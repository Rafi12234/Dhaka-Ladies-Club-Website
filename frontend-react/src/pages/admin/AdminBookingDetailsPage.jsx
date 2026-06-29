import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

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
  const [message, setMessage] = useState("");

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
    setMessage("");

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

      setMessage(error.message || "Failed to load booking details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function addCharge() {
    setMessage("");

    if (!categoryId) {
      setMessage("Please select an extra charge category.");
      return;
    }

    if (selectedNewCategory && !newCategoryName.trim()) {
      setMessage("Please enter the new extra charge name.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage("Please enter a valid amount.");
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
      setMessage("Extra charge added successfully.");

      await loadDetails();
    } catch (error) {
      setMessage(error.message || "Failed to add extra charge.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateChargeStatus(charge, newStatus) {
    setMessage("");

    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges/${charge.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          payment_status: newStatus,
        }),
      });

      setMessage("Extra charge status updated successfully.");
      await loadDetails();
    } catch (error) {
      setMessage(error.message || "Failed to update extra charge.");
    }
  }

  async function deleteCharge(charge) {
    const ok = window.confirm(`Delete "${charge.title}" charge?`);

    if (!ok) return;

    setMessage("");

    try {
      await adminApi(`/admin/bookings/${bookingId}/extra-charges/${charge.id}`, {
        method: "DELETE",
      });

      setMessage("Extra charge deleted successfully.");
      await loadDetails();
    } catch (error) {
      setMessage(error.message || "Failed to delete extra charge.");
    }
  }

  useEffect(() => {
    loadDetails();
  }, [bookingId]);

  return (
    <>
      <style>{styles}</style>
      <Sidebar />

      <main className="admin-main invoice-page">
        <div className="invoice-actions no-print">
          <Link className="back-link" to="/admin-bookings">
            ← Back to Bookings
          </Link>

          <button className="print-btn" type="button" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>

        {message ? <div className="message no-print">{message}</div> : null}

        {isLoading ? (
          <div className="invoice-card">Loading booking invoice...</div>
        ) : !booking ? (
          <div className="invoice-card">Booking not found.</div>
        ) : (
          <div className="invoice-card printable-area">
            <div className="invoice-header">
              <div>
                <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
                <p>Premium Convention & Party Venue in Dhaka</p>
              </div>

              <div className="invoice-title">
                <h1>INVOICE</h1>
                <p>{booking.booking_no}</p>
              </div>
            </div>

            <div className="info-grid">
              <section>
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {booking.customer_name || "—"}</p>
                <p><strong>Email:</strong> {booking.customer_email || "—"}</p>
                <p><strong>Phone:</strong> {booking.customer_phone || "—"}</p>
                <p><strong>Address:</strong> {booking.customer_address || "—"}</p>
              </section>

              <section>
                <h3>Booking Information</h3>
                <p><strong>Booking No:</strong> {booking.booking_no || "—"}</p>
                <p><strong>Status:</strong> {booking.booking_status || "—"}</p>
                <p><strong>Source:</strong> {booking.booking_source || "—"}</p>
                <p><strong>Booked At:</strong> {fmtDateTime(booking.booked_at || booking.created_at)}</p>
              </section>

              <section>
                <h3>Event Information</h3>
                <p><strong>Title:</strong> {booking.event_title || "—"}</p>
                <p><strong>Type:</strong> {booking.event_type || "—"}</p>
                <p><strong>Guests:</strong> {booking.guest_count || "—"}</p>
                <p><strong>Details:</strong> {booking.event_details || "—"}</p>
              </section>

              <section>
                <h3>Slot Information</h3>
                <p><strong>Date:</strong> {booking.slot_date || "—"}</p>
                <p><strong>Hall:</strong> {booking.hall_name || "—"}</p>
                <p><strong>Shift:</strong> {booking.shift_name || "—"}</p>
                <p><strong>Time:</strong> {booking.start_time || "—"} - {booking.end_time || "—"}</p>
              </section>
            </div>

            <h2>Main Payment</h2>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Main hall booking payment</td>
                  <td>{booking.payment_method || "—"}</td>
                  <td>{booking.payment_status || booking.booking_status || "—"}</td>
                  <td className="right">{money(booking.total_amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="extra-section no-print">
              <h2>Add Extra Cash Charge</h2>

              <div className="form-grid">
                <div>
                  <label>Charge Type</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select charge type</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__new__">+ Add New Charge Type</option>
                  </select>
                </div>

                {selectedNewCategory ? (
                  <div>
                    <label>New Charge Type</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Example: Sound System Charge"
                    />
                  </div>
                ) : null}

                <div>
                  <label>Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label>Status</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="due">Due</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="full">
                  <label>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <button className="add-btn" type="button" disabled={isSaving} onClick={addCharge}>
                {isSaving ? "Saving..." : "Add Extra Charge"}
              </button>
            </div>

            <h2>Extra Charges</h2>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Charge</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th className="right">Amount</th>
                  <th className="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {charges.length === 0 ? (
                  <tr>
                    <td colSpan="6">No extra charges added.</td>
                  </tr>
                ) : (
                  charges.map((charge) => (
                    <tr key={charge.id}>
                      <td>{charge.title}</td>
                      <td>{charge.payment_method || "cash"}</td>
                      <td>
                        <span className={`status ${charge.payment_status}`}>
                          {charge.payment_status}
                        </span>
                      </td>
                      <td>{charge.notes || "—"}</td>
                      <td className="right">{money(charge.amount)}</td>
                      <td className="no-print">
                        <div className="row-actions">
                          {charge.payment_status === "due" ? (
                            <button type="button" onClick={() => updateChargeStatus(charge, "paid")}>
                              Mark Paid
                            </button>
                          ) : (
                            <button type="button" onClick={() => updateChargeStatus(charge, "due")}>
                              Mark Due
                            </button>
                          )}

                          <button className="delete" type="button" onClick={() => deleteCharge(charge)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="totals-box">
              <div>
                <span>Main Booking Amount</span>
                <strong>{money(pageTotals.mainAmount)}</strong>
              </div>

              <div>
                <span>Extra Charges Total</span>
                <strong>{money(pageTotals.extraTotal)}</strong>
              </div>

              <div>
                <span>Extra Paid</span>
                <strong>{money(pageTotals.extraPaid)}</strong>
              </div>

              <div>
                <span>Extra Due</span>
                <strong>{money(pageTotals.extraDue)}</strong>
              </div>

              <div className="grand">
                <span>Grand Invoice Total</span>
                <strong>{money(pageTotals.grandTotal)}</strong>
              </div>
            </div>

            <div className="invoice-footer">
              <p>Generated by Dhaka Ladies Club Admin Panel</p>
              <p>Printed at: {new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

const styles = `
  body {
    background: #faf7f2;
  }

  .invoice-page {
    padding: 28px;
    font-family: 'Poppins', sans-serif;
    color: #1a1a2e;
  }

  .invoice-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    gap: 12px;
  }

  .back-link {
    color: #8f6908;
    text-decoration: none;
    font-weight: 800;
  }

  .print-btn,
  .add-btn {
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #8f6908, #b8860b);
    color: white;
    padding: 12px 18px;
    font-weight: 800;
    cursor: pointer;
  }

  .message {
    background: #fff3cd;
    border: 1px solid #ffe08a;
    color: #7a5200;
    padding: 12px 14px;
    border-radius: 12px;
    margin-bottom: 16px;
    font-weight: 700;
  }

  .invoice-card {
    background: white;
    border: 1px solid #ead7a6;
    border-radius: 22px;
    padding: 28px;
    box-shadow: 0 10px 35px rgba(0,0,0,0.07);
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 2px solid #ead7a6;
    padding-bottom: 18px;
    margin-bottom: 22px;
  }

  .invoice-header img {
    width: 180px;
    max-width: 100%;
  }

  .invoice-header p {
    margin-top: 8px;
    color: #6b7280;
  }

  .invoice-title {
    text-align: right;
  }

  .invoice-title h1 {
    font-size: 38px;
    color: #8f6908;
    margin: 0;
  }

  .invoice-title p {
    font-size: 16px;
    font-weight: 800;
    color: #1a1a2e;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 24px;
  }

  .info-grid section {
    border: 1px solid #ead7a6;
    border-radius: 16px;
    padding: 16px;
    background: #fffdf8;
  }

  h2 {
    margin: 24px 0 12px;
    color: #8f6908;
  }

  h3 {
    margin: 0 0 10px;
    color: #8f6908;
  }

  p {
    margin: 6px 0;
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  .invoice-table th,
  .invoice-table td {
    border: 1px solid #ead7a6;
    padding: 12px;
    text-align: left;
    vertical-align: top;
  }

  .invoice-table th {
    background: #faf7f2;
    color: #8f6908;
  }

  .right {
    text-align: right !important;
  }

  .extra-section {
    border: 1px solid #ead7a6;
    border-radius: 18px;
    padding: 18px;
    margin: 24px 0;
    background: #fffdf8;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .form-grid .full {
    grid-column: 1 / -1;
  }

  label {
    display: block;
    font-weight: 800;
    color: #8f6908;
    margin-bottom: 7px;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #ead7a6;
    border-radius: 12px;
    padding: 11px 12px;
    font-family: inherit;
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  .add-btn {
    margin-top: 14px;
  }

  .status {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 999px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .status.paid {
    background: #e8f7ee;
    color: #198754;
  }

  .status.due {
    background: #fff3cd;
    color: #8a5a00;
  }

  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .row-actions button {
    border: none;
    border-radius: 8px;
    padding: 7px 10px;
    font-weight: 800;
    cursor: pointer;
    background: #e8f7ee;
    color: #198754;
  }

  .row-actions .delete {
    background: #fde8e8;
    color: #dc3545;
  }

  .totals-box {
    margin-left: auto;
    max-width: 430px;
    border: 1px solid #ead7a6;
    border-radius: 18px;
    overflow: hidden;
  }

  .totals-box div {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #ead7a6;
  }

  .totals-box div:last-child {
    border-bottom: none;
  }

  .totals-box .grand {
    background: linear-gradient(135deg, #8f6908, #b8860b);
    color: white;
    font-size: 17px;
  }

  .invoice-footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #ead7a6;
    color: #6b7280;
    font-size: 13px;
  }

  @media (max-width: 800px) {
    .info-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .invoice-header {
      flex-direction: column;
    }

    .invoice-title {
      text-align: left;
    }
  }

  @media print {
    body {
      background: white !important;
    }

    .admin-sidebar,
    .admin-mobile-topbar,
    .sidebar-backdrop,
    .no-print {
      display: none !important;
    }

    .admin-main,
    .invoice-page {
      margin-left: 0 !important;
      padding: 0 !important;
    }

    .invoice-card {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }

    .invoice-table th,
    .invoice-table td {
      font-size: 12px;
    }
  }
`;