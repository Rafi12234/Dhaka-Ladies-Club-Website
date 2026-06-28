import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ADMIN_TOKEN_KEY = "dlc_admin_token_v1";
const ADMIN_USER_KEY = "dlc_admin_user_v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "available") return "slot-available";
  if (value === "booked") return "slot-booked";
  if (value === "blocked") return "slot-blocked";
  if (value === "payment_in_progress") return "slot-progress";
  if (value === "pending_approval") return "slot-pending";
  return "slot-default";
}

async function adminApi(path, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const headers = {
    Accept: "application/json",
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
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

/* ── Icons ───────────────────────────────────────────────── */
function IconBars({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconFile({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconPlus({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCalendar({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconEdit({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconLogout({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconRefresh({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconFilter({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconShield({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCheck({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLock({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconInfo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ── Page Styles ─────────────────────────────────────────── */
const pageStyles = String.raw`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --gold: #b8860b;
    --gold-light: #d4a017;
    --gold-dark: #8f6908;
    --gold-pale: rgba(184,134,11,0.07);
    --gold-glow: rgba(184,134,11,0.22);
    --gold-border: #ead7a6;
    --bg: #faf7f2;
    --white: #ffffff;
    --text: #1a1a2e;
    --muted: #6b7280;
    --red: #dc3545;
    --green: #198754;
    --transition: 0.32s cubic-bezier(0.4,0,0.2,1);
    --shadow-card: 0 4px 24px rgba(0,0,0,0.07);
    --shadow-hover: 0 12px 40px rgba(184,134,11,0.18);
    --radius: 20px;
  }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  body.slots-layout {
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 7px; height: 7px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: rgba(184,134,11,0.3); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

  /* ── Sidebar ── */
  .slots-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 286px;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-right: 1px solid var(--gold-border);
    box-shadow: 8px 0 32px rgba(0,0,0,0.06);
    z-index: 500;
    padding: 22px 18px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .slots-sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    padding: 8px 8px 18px;
    border-bottom: 1px solid var(--gold-border);
  }

  .slots-sidebar-brand img {
    width: 154px;
    max-width: 100%;
    height: auto;
    display: block;
  }

  .slots-sidebar-brand-title {
    display: block;
    margin-top: 6px;
    color: var(--gold-dark);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }

  .slots-admin-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--gold-pale), rgba(255,255,255,0.9));
    border: 1px solid var(--gold-border);
  }

  .slots-admin-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .slots-admin-label {
    display: block;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 3px;
  }

  .slots-admin-name {
    display: block;
    color: var(--gold-dark);
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .slots-sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .slots-sidebar-section-title {
    margin: 8px 10px 4px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.9px;
  }

  .slots-sidebar-link {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 16px;
    text-decoration: none;
    border: 1px solid transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    background: transparent;
    transition: all var(--transition);
  }

  .slots-sidebar-link:hover {
    color: var(--gold-dark);
    background: var(--gold-pale);
    border-color: var(--gold-border);
    transform: translateX(3px);
  }

  .slots-sidebar-link.active {
    color: white;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    box-shadow: 0 10px 26px rgba(184,134,11,0.26);
    border-color: transparent;
  }

  .slots-sidebar-footer {
    padding-top: 14px;
    border-top: 1px solid var(--gold-border);
  }

  .slots-sidebar-logout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 16px;
    border: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    color: white;
    background: linear-gradient(135deg, #c0392b, var(--red));
    box-shadow: 0 8px 22px rgba(220,53,69,0.2);
    transition: all var(--transition);
  }

  .slots-sidebar-logout:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(220,53,69,0.32);
  }

  /* ── Mobile Topbar ── */
  .slots-mobile-topbar {
    display: none;
    position: sticky;
    top: 0;
    z-index: 450;
    height: 64px;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--gold-border);
    padding: 0 16px;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 18px rgba(0,0,0,0.05);
  }

  .slots-mobile-topbar img { height: 36px; }

  .slots-sidebar-toggle {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid var(--gold-border);
    background: var(--gold-pale);
    color: var(--gold-dark);
    font-size: 22px;
    cursor: pointer;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slots-sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 480;
  }

  .slots-sidebar-backdrop.show { display: block; }

  /* ── Main ── */
  .slots-main {
    margin-left: 286px;
    min-height: 100vh;
  }

  .slots-container {
    width: 92%;
    max-width: 1280px;
    margin: auto;
    padding: 36px 0 60px;
  }

  /* ── Page Header ── */
  .slots-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .slots-page-title h1 {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .slots-page-title .muted {
    font-size: 13.5px;
    color: var(--muted);
    font-weight: 400;
  }

  /* ── Banner ── */
  .slots-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 14px;
    margin-bottom: 22px;
    font-size: 13.5px;
    font-weight: 600;
  }

  .slots-banner.success {
    background: rgba(25,135,84,0.08);
    color: #137333;
    border: 1px solid #b7e1c1;
  }

  .slots-banner.error {
    background: rgba(220,53,69,0.08);
    color: #b42318;
    border: 1px solid #f5b5b5;
  }

  /* ── Section Label ── */
  .slots-section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slots-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--gold-border), transparent);
  }

  /* ── Two-col grid ── */
  .slots-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  /* ── Panel / Card ── */
  .slots-panel {
    background: var(--white);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius);
    padding: 28px;
    box-shadow: var(--shadow-card);
    transition: box-shadow var(--transition);
  }

  .slots-panel:hover {
    box-shadow: var(--shadow-hover);
  }

  .slots-panel-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(184,134,11,0.12);
  }

  .slots-panel-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 3px 10px var(--gold-glow);
  }

  .slots-panel-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .slots-panel-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin: 14px 0 20px;
    line-height: 1.6;
  }

  /* ── Form Fields ── */
  .slots-field {
    margin-bottom: 16px;
  }

  .slots-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--gold-dark);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }

  .slots-input,
  .slots-select {
    width: 100%;
    border: 1.5px solid #e0e0e0;
    border-radius: 12px;
    padding: 11px 14px;
    font-family: inherit;
    font-size: 13.5px;
    color: var(--text);
    background: var(--bg);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .slots-input:focus,
  .slots-select:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-glow);
    background: var(--white);
  }

  /* ── Buttons ── */
  .slots-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 20px;
    margin-top: 6px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    font-family: inherit;
    font-weight: 700;
    font-size: 13.5px;
    cursor: pointer;
    transition: box-shadow var(--transition), transform var(--transition), opacity var(--transition);
    position: relative;
    overflow: hidden;
  }

  .slots-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
    transform: skewX(-20deg) translateX(-150%);
    transition: transform 0.6s ease;
  }

  .slots-btn-primary:hover::before {
    transform: skewX(-20deg) translateX(250%);
  }

  .slots-btn-primary:hover:not(:disabled) {
    box-shadow: 0 8px 24px var(--gold-glow);
    transform: translateY(-1px);
  }

  .slots-btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .slots-btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 22px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    font-family: inherit;
    font-weight: 700;
    font-size: 13.5px;
    cursor: pointer;
    white-space: nowrap;
    align-self: flex-end;
    transition: box-shadow var(--transition), transform var(--transition), opacity var(--transition);
    position: relative;
    overflow: hidden;
  }

  .slots-btn-secondary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
    transform: skewX(-20deg) translateX(-150%);
    transition: transform 0.6s ease;
  }

  .slots-btn-secondary:hover::before {
    transform: skewX(-20deg) translateX(250%);
  }

  .slots-btn-secondary:hover:not(:disabled) {
    box-shadow: 0 8px 24px var(--gold-glow);
    transform: translateY(-1px);
  }

  .slots-btn-secondary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .slots-btn-action-green {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    border: none;
    border-radius: 8px;
    background: rgba(25,135,84,0.1);
    color: #137333;
    font-family: inherit;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #b7e1c1;
    transition: background var(--transition), transform var(--transition);
  }

  .slots-btn-action-green:hover:not(:disabled) {
    background: rgba(25,135,84,0.18);
    transform: translateY(-1px);
  }

  .slots-btn-action-green:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .slots-btn-action-red {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    border: none;
    border-radius: 8px;
    background: rgba(220,53,69,0.08);
    color: #b42318;
    font-family: inherit;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #f5b5b5;
    transition: background var(--transition), transform var(--transition);
  }

  .slots-btn-action-red:hover:not(:disabled) {
    background: rgba(220,53,69,0.15);
    transform: translateY(-1px);
  }

  .slots-btn-action-red:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Summary cards ── */
  .slots-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  .slots-summary-card {
    background: var(--bg);
    border: 1px solid var(--gold-border);
    border-radius: 14px;
    padding: 16px 14px;
    text-align: center;
  }

  .slots-summary-card .sum-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    line-height: 1;
    margin-bottom: 5px;
    transition: color var(--transition);
  }

  .slots-summary-card:hover .sum-value {
    color: var(--gold);
  }

  .slots-summary-card .sum-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .slots-summary-card.avail  { border-top: 3px solid #137333; }
  .slots-summary-card.booked { border-top: 3px solid #b42318; }
  .slots-summary-card.blockd { border-top: 3px solid #6b7280; }
  .slots-summary-card.progrs { border-top: 3px solid #856404; }
  .slots-summary-card.pendng { border-top: 3px solid #0a58ca; }

  /* ── Filter row ── */
  .slots-filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 20px;
  }

  /* ── Table ── */
  .slots-table-wrap {
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid rgba(234,215,166,0.5);
  }

  .slots-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }

  .slots-table thead tr {
    background: linear-gradient(135deg, rgba(184,134,11,0.07), rgba(184,134,11,0.03));
  }

  .slots-table th {
    padding: 13px 16px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--gold-dark);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 2px solid rgba(184,134,11,0.15);
  }

  .slots-table td {
    padding: 13px 16px;
    font-size: 13px;
    color: var(--text);
    border-bottom: 1px solid rgba(234,215,166,0.35);
    vertical-align: middle;
  }

  .slots-table tbody tr {
    transition: background var(--transition);
  }

  .slots-table tbody tr:hover {
    background: rgba(184,134,11,0.04);
  }

  .slots-table tbody tr:last-child td {
    border-bottom: none;
  }

  .slots-table .td-empty {
    text-align: center;
    color: var(--muted);
    font-style: italic;
    padding: 32px;
  }

  /* ── Status Badges ── */
  .slot-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 50px;
    font-size: 11.5px;
    font-weight: 700;
  }

  .slot-available   { background: rgba(25,135,84,0.1);   color: #137333; border: 1px solid #b7e1c1; }
  .slot-booked      { background: rgba(180,35,24,0.09);  color: #b42318; border: 1px solid #f5b5b5; }
  .slot-blocked     { background: rgba(108,114,125,0.1); color: #495057; border: 1px solid #ced4da; }
  .slot-progress    { background: rgba(133,90,0,0.1);    color: #856404; border: 1px solid #ffe08a; }
  .slot-pending     { background: rgba(10,88,202,0.09);  color: #0a58ca; border: 1px solid #b6d4fe; }
  .slot-default     { background: rgba(108,117,125,0.1); color: #495057; border: 1px solid #dee2e6; }

  /* locked text */
  .slots-locked-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--muted);
    font-weight: 600;
  }

  /* date cell */
  .slots-date-cell {
    font-family: 'Courier New', monospace;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--gold-dark);
    background: var(--gold-pale);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--gold-border);
    white-space: nowrap;
    display: inline-block;
  }

  /* shift cell */
  .slots-shift-name { font-weight: 600; }
  .slots-shift-time { font-size: 12px; color: var(--muted); margin-top: 3px; }

  /* ── Responsive ── */
  @media (max-width: 980px) {
    .slots-sidebar {
      transform: translateX(-105%);
      transition: transform var(--transition);
    }
    .slots-sidebar.open { transform: translateX(0); }
    .slots-main { margin-left: 0; }
    .slots-mobile-topbar { display: flex; }
  }

  @media (max-width: 860px) {
    .slots-two-col { grid-template-columns: 1fr; }
    .slots-summary-grid { grid-template-columns: repeat(3, 1fr); }
    .slots-filter-row { grid-template-columns: 1fr 1fr; }
    .slots-btn-secondary { grid-column: 1 / -1; }
  }

  @media (max-width: 560px) {
    .slots-summary-grid { grid-template-columns: repeat(2, 1fr); }
    .slots-page-title h1 { font-size: 26px; }
    .slots-container { padding: 20px 0 40px; }
  }
`;

/* ── Component ────────────────────────────────────────────── */
export default function AdminCalendarSlotsPage() {
  const navigate = useNavigate();

  const [admin] = useState(() => getStoredAdmin() || {});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const adminName = admin?.name || "Admin";
  const adminInitial = (adminName || "A").charAt(0).toUpperCase();

  /* ── Summary ── */
  const summary = useMemo(() => {
    return slots.reduce(
      (acc, slot) => {
        const s = String(slot.slot_status || "").toLowerCase();
        if (s === "available") acc.available += 1;
        else if (s === "booked") acc.booked += 1;
        else if (s === "blocked") acc.blocked += 1;
        else if (s === "payment_in_progress") acc.paymentInProgress += 1;
        else if (s === "pending_approval") acc.pendingApproval += 1;
        else acc.other += 1;
        return acc;
      },
      { available: 0, booked: 0, blocked: 0, paymentInProgress: 0, pendingApproval: 0, other: 0 }
    );
  }, [slots]);

  /* ── API calls ── */
  async function loadBookingContext() {
    const data = await adminApi("/booking-context", { method: "GET" });
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
      const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const data = await adminApi(`/admin/calendar-slots?${query.toString()}`, { method: "GET" });
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
      `This will create/update all slots from today until ${untilDate}.\nAlready booked slots will remain booked.\n\nContinue?`
    );
    if (!confirmed) return;

    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const data = await adminApi("/admin/calendar-slots/generate-until", {
        method: "POST",
        body: JSON.stringify({ until_date: untilDate }),
      });
      const result = data?.data || {};
      setMessage(
        `Done — Created: ${result.created || 0} · Updated to available: ${result.updated_to_available || 0} · Kept locked: ${result.kept_locked ?? result.kept_booked ?? 0}`
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
      `Mark "${slot.shift_name || "this shift"}" on ${slot.slot_date} as ${newStatus}?`
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

  async function logoutAdmin() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await adminApi("/admin/logout", { method: "POST", body: JSON.stringify({}) });
    } catch { /* ignore */ } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      setIsLoggingOut(false);
      navigate("/admin-login");
    }
  }

  /* ── Effects ── */
  useEffect(() => {
    document.body.classList.add("slots-layout");
    return () => document.body.classList.remove("slots-layout");
  }, []);

  useEffect(() => {
    loadBookingContext().catch(() => setError("Failed to load shift information."));
  }, []);

  useEffect(() => {
    loadSlots();
  }, []);

  /* ── Render ── */
  return (
    <>
      <style>{pageStyles}</style>

      {/* ── Sidebar ── */}
      <aside className={`slots-sidebar${sidebarOpen ? " open" : ""}`}>
        <Link to="/" className="slots-sidebar-brand">
          <div>
            <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
            <span className="slots-sidebar-brand-title">Admin Portal</span>
          </div>
        </Link>

        <div className="slots-admin-card">
          <div className="slots-admin-avatar">{adminInitial}</div>
          <div>
            <span className="slots-admin-label">Signed in as</span>
            <span className="slots-admin-name">{adminName}</span>
          </div>
        </div>

        <div className="slots-sidebar-menu">
          <div className="slots-sidebar-section-title">Dashboard</div>

          <Link to="/admin-dashboard" className="slots-sidebar-link"
            onClick={() => setSidebarOpen(false)}>
            <IconBars size={15} /> Overview
          </Link>

          <Link to="/admin-bookings" className="slots-sidebar-link"
            onClick={() => setSidebarOpen(false)}>
            <IconFile size={15} /> Bookings
          </Link>

          <Link to="/admin-manual-booking" className="slots-sidebar-link"
            onClick={() => setSidebarOpen(false)}>
            <IconPlus size={15} /> Manual Booking
          </Link>

          <Link to="/admin-homepage-content" className="slots-sidebar-link"
            onClick={() => setSidebarOpen(false)}>
            <IconEdit size={15} /> Homepage Content
          </Link>

          <Link to="/admin-calendar-slots" className="slots-sidebar-link active"
            onClick={() => setSidebarOpen(false)}>
            <IconCalendar size={15} /> Calendar Slots
          </Link>

          <div className="slots-sidebar-section-title">Website</div>

          <Link to="/" className="slots-sidebar-link"
            onClick={() => setSidebarOpen(false)}>
            <IconCalendar size={15} /> Public Website
          </Link>
        </div>

        <div className="slots-sidebar-footer">
          <button className="slots-sidebar-logout" type="button"
            onClick={logoutAdmin} disabled={isLoggingOut}>
            <IconLogout size={15} />
            {isLoggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      <div className={`slots-sidebar-backdrop${sidebarOpen ? " show" : ""}`}
        onClick={() => setSidebarOpen(false)} />

      {/* ── Main ── */}
      <main className="slots-main">

        {/* Mobile topbar */}
        <div className="slots-mobile-topbar">
          <button className="slots-sidebar-toggle" type="button"
            onClick={() => setSidebarOpen(true)}>☰</button>
          <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
        </div>

        <div className="slots-container">

          {/* Page header */}
          <div className="slots-page-header">
            <div className="slots-page-title">
              <h1>Calendar Slot Management</h1>
              <p className="muted">
                Generate available slots, block specific dates and protect booked slots.
              </p>
            </div>
          </div>

          {/* Banners */}
          {message && (
            <div className="slots-banner success">
              <IconCheck size={16} />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="slots-banner error">
              <IconInfo size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ── Section 1: Generate + Manual ── */}
          <p className="slots-section-label">Slot Configuration</p>

          <div className="slots-two-col">

            {/* Generate Panel */}
            <div className="slots-panel">
              <div className="slots-panel-header">
                <div className="slots-panel-icon">
                  <IconRefresh size={16} />
                </div>
                <h2>Generate Available Slots</h2>
              </div>

              <p className="slots-panel-subtitle">
                Select a target date. All slots from today until that date will be
                marked available. Slots that are already booked will remain unchanged.
              </p>

              <div className="slots-field">
                <label className="slots-label">Available Until Date</label>
                <input
                  className="slots-input"
                  type="date"
                  value={untilDate}
                  min={todayString()}
                  onChange={(e) => setUntilDate(e.target.value)}
                />
              </div>

              <button
                className="slots-btn-primary"
                type="button"
                disabled={generating}
                onClick={generateUntil}
              >
                <IconRefresh size={14} />
                {generating ? "Updating…" : "Generate / Update Slots"}
              </button>
            </div>

            {/* Manual Panel */}
            <div className="slots-panel">
              <div className="slots-panel-header">
                <div className="slots-panel-icon">
                  <IconShield size={16} />
                </div>
                <h2>Manual Slot Status</h2>
              </div>

              <p className="slots-panel-subtitle">
                Override a specific date and shift. You can block or unblock any slot.
                Booked slots are protected and cannot be changed.
              </p>

              <div className="slots-field">
                <label className="slots-label">Date</label>
                <input
                  className="slots-input"
                  type="date"
                  value={manualDate}
                  min={todayString()}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div className="slots-field">
                <label className="slots-label">Shift</label>
                <select
                  className="slots-select"
                  value={manualShiftId}
                  onChange={(e) => setManualShiftId(e.target.value)}
                >
                  {shifts.length === 0 && (
                    <option value="">Loading shifts…</option>
                  )}
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                      {shift.start_time && shift.end_time
                        ? ` (${shift.start_time} – ${shift.end_time})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="slots-field">
                <label className="slots-label">Status</label>
                <select
                  className="slots-select"
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                >
                  <option value="blocked">Blocked</option>
                  <option value="available">Available</option>
                </select>
              </div>

              <button
                className="slots-btn-primary"
                type="button"
                disabled={savingStatus}
                onClick={updateManualStatus}
              >
                <IconShield size={14} />
                {savingStatus ? "Saving…" : "Update Slot Status"}
              </button>
            </div>
          </div>

          {/* ── Section 2: View Slots ── */}
          <p className="slots-section-label">Slot Overview</p>

          <div className="slots-panel">

            {/* Filter row */}
            <div className="slots-panel-header">
              <div className="slots-panel-icon">
                <IconCalendar size={16} />
              </div>
              <h2>View &amp; Manage Slots</h2>
            </div>

            <p className="slots-panel-subtitle">
              Filter by date range to view and quickly update individual slot statuses.
            </p>

            <div className="slots-filter-row">
              <div>
                <label className="slots-label">Start Date</label>
                <input
                  className="slots-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="slots-label">End Date</label>
                <input
                  className="slots-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button
                className="slots-btn-secondary"
                type="button"
                disabled={loading}
                onClick={loadSlots}
              >
                <IconFilter size={14} />
                {loading ? "Loading…" : "Load Slots"}
              </button>
            </div>

            {/* Summary */}
            <div className="slots-summary-grid">
              <div className="slots-summary-card avail">
                <div className="sum-value">{summary.available}</div>
                <div className="sum-label">Available</div>
              </div>
              <div className="slots-summary-card booked">
                <div className="sum-value">{summary.booked}</div>
                <div className="sum-label">Booked</div>
              </div>
              <div className="slots-summary-card blockd">
                <div className="sum-value">{summary.blocked}</div>
                <div className="sum-label">Blocked</div>
              </div>
              <div className="slots-summary-card progrs">
                <div className="sum-value">{summary.paymentInProgress}</div>
                <div className="sum-label">In Progress</div>
              </div>
              <div className="slots-summary-card pendng">
                <div className="sum-value">{summary.pendingApproval}</div>
                <div className="sum-label">Pending</div>
              </div>
            </div>

            {/* Table */}
            <div className="slots-table-wrap">
              <table className="slots-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.length === 0 ? (
                    <tr>
                      <td className="td-empty" colSpan="5">
                        {loading ? "Loading slots…" : "No slots found for the selected date range."}
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
                          <td>
                            <span className="slots-date-cell">{slot.slot_date}</span>
                          </td>
                          <td>
                            <div className="slots-shift-name">
                              {slot.shift_name || `Shift #${slot.shift_id}`}
                            </div>
                          </td>
                          <td>
                            <div className="slots-shift-time">
                              {slot.start_time && slot.end_time
                                ? `${slot.start_time} – ${slot.end_time}`
                                : "—"}
                            </div>
                          </td>
                          <td>
                            <span className={`slot-badge ${statusClass(status)}`}>
                              {formatStatus(status)}
                            </span>
                          </td>
                          <td>
                            {isLocked ? (
                              <span className="slots-locked-label">
                                <IconLock size={12} /> Locked
                              </span>
                            ) : isBlocked ? (
                              <button
                                className="slots-btn-action-green"
                                type="button"
                                disabled={savingStatus}
                                onClick={() => quickUpdateSlot(slot, "available")}
                              >
                                <IconCheck size={12} /> Make Available
                              </button>
                            ) : (
                              <button
                                className="slots-btn-action-red"
                                type="button"
                                disabled={savingStatus}
                                onClick={() => quickUpdateSlot(slot, "blocked")}
                              >
                                <IconX size={12} /> Block
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
          </div>
        </div>
      </main>
    </>
  );
}