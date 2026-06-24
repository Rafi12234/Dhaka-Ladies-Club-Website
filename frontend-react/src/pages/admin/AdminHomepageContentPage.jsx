import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, adminHeaders } from "../../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ADMIN_TOKEN_KEY = "dlc_admin_token_v1";
const ADMIN_USER_KEY = "dlc_admin_user_v1";

const emptyContent = {
  nav: {
    logo: "/assets/img/dlclogo_long.png",
    logo_alt: "Dhaka Ladies Club Logo",
    links: [],
    booking_button_text: "Book Now",
    booking_button_link: "#calendar-booking",
    login_text: "Login",
    admin_login_text: "Admin Login",
    logout_text: "Logout",
  },
  hero: {
    title: "",
    highlight: "",
    subtitle: "",
    background_image: "",
    primary_button_text: "",
    primary_button_link: "",
    secondary_button_text: "",
    secondary_button_link: "",
  },
  stats: [],
  calendar_section: {
    eyebrow: "",
    title: "",
    description: "",
    loading_text: "",
    button_today: "",
    button_month: "",
    button_year_view: "",
    legend: [],
  },
  our_story: {
    eyebrow: "",
    title: "",
    description: "",
  },
  creating_experiences: {
    image: "",
    image_alt: "",
    badge_text: "",
    eyebrow: "",
    title: "",
    description_1: "",
    description_2: "",
    points: [],
    button_text: "",
    button_link: "",
  },
  gallery: {
    eyebrow: "",
    title: "",
    description: "",
    empty_text: "",
    images: [],
  },
  features_section: {
    eyebrow: "",
    title: "",
    description: "",
    cards: [],
  },
  booking_cta: {
    background_image: "",
    title: "",
    highlight: "",
    title_suffix: "",
    description: "",
    primary_button_text: "",
    primary_button_link: "",
    secondary_button_text: "",
    secondary_button_link: "",
  },
  footer: {
    logo: "/assets/img/dlclogo_long.png",
    logo_alt: "Dhaka Ladies Club",
    description: "",
    quick_links_title: "Quick Links",
    quick_links: [],
    contact_title: "Contact",
    address: "",
    phone: "",
    email: "",
    copyright: "",
    copyright_brand: "Dhaka Ladies Club",
    tagline: "",
  },
};

const adminHomepageStyles = String.raw`
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

  ::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(184,134,11,0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--gold);
  }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  body.admin-layout {
    overflow-x: hidden;
  }

  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
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

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    padding: 8px 8px 18px;
    border-bottom: 1px solid var(--gold-border);
  }

  .sidebar-brand img {
    width: 154px;
    max-width: 100%;
    height: auto;
    display: block;
  }

  .sidebar-title {
    display: block;
    margin-top: 6px;
    color: var(--gold-dark);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }

  .sidebar-admin-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--gold-pale), rgba(255,255,255,0.9));
    border: 1px solid var(--gold-border);
  }

  .admin-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .sidebar-admin-meta {
    min-width: 0;
  }

  .sidebar-admin-label {
    display: block;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 3px;
  }

  .sidebar-admin-name {
    display: block;
    color: var(--gold-dark);
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .sidebar-section-title {
    margin: 8px 10px 4px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.9px;
  }

  .sidebar-link,
  .sidebar-logout {
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
    transition: all var(--transition);
  }

  .sidebar-link {
    color: var(--muted);
    background: transparent;
  }

  .sidebar-link svg,
  .sidebar-logout svg {
    flex-shrink: 0;
  }

  .sidebar-link:hover {
    color: var(--gold-dark);
    background: var(--gold-pale);
    border-color: var(--gold-border);
    transform: translateX(3px);
  }

  .sidebar-link.active {
    color: white;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    box-shadow: 0 10px 26px rgba(184,134,11,0.26);
  }

  .sidebar-footer {
    padding-top: 14px;
    border-top: 1px solid var(--gold-border);
  }

  .sidebar-logout {
    cursor: pointer;
    justify-content: center;
    color: white;
    background: linear-gradient(135deg, #c0392b, var(--red));
    box-shadow: 0 8px 22px rgba(220,53,69,0.2);
  }

  .sidebar-logout:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(220,53,69,0.32);
  }

  .admin-main {
    margin-left: 286px;
    min-height: 100vh;
    transition: margin-left var(--transition);
  }

  .admin-mobile-topbar {
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

  .sidebar-toggle {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid var(--gold-border);
    background: var(--gold-pale);
    color: var(--gold-dark);
    font-size: 22px;
    cursor: pointer;
    font-weight: 800;
  }

  .admin-mobile-topbar img {
    height: 36px;
  }

  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 480;
  }

  .sidebar-backdrop.show {
    display: block;
  }

  .container {
    width: 92%;
    max-width: 1320px;
    margin: auto;
    padding: 36px 0 60px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 22px;
    flex-wrap: wrap;
    animation: fadeDown 0.55s 0.1s both;
  }

  .page-title h1 {
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

  .page-title .muted {
    font-size: 13.5px;
    color: var(--muted);
    font-weight: 400;
  }

  .top-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .message-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: #fff8e1;
    color: #664d03;
    border: 1px solid #ffecb5;
    border-radius: 14px;
    margin-bottom: 22px;
    font-size: 13.5px;
    font-weight: 500;
    animation: slideDown 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  .message-banner.success {
    background: #ecfdf3;
    border-color: #bbf7d0;
    color: #166534;
  }

  .message-banner.error {
    background: #fff1f2;
    border-color: #fecdd3;
    color: #991b1b;
  }

  .message-banner.hidden {
    display: none;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }

  .tab-btn {
    border: 1px solid var(--gold-border);
    background: white;
    color: var(--gold-dark);
    font-family: inherit;
    font-weight: 800;
    font-size: 12.5px;
    padding: 10px 15px;
    border-radius: 999px;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: var(--shadow-card);
  }

  .tab-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    border-color: transparent;
  }

  .editor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .panel {
    background: var(--white);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow-card);
    overflow: hidden;
    transition: box-shadow var(--transition);
    animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }

  .panel.full {
    grid-column: 1 / -1;
  }

  .panel:hover {
    box-shadow: var(--shadow-hover);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(184,134,11,0.12);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .panel-title-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 10px var(--gold-glow);
    color: white;
  }

  .panel h2 {
    font-size: 16px;
    font-weight: 800;
    color: var(--text);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 14px;
  }

  .field span {
    font-size: 12px;
    font-weight: 800;
    color: var(--gold-dark);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .field input,
  .field textarea,
  .field select,
  .plain-input {
    width: 100%;
    border: 1.5px solid #e0e0e0;
    border-radius: 13px;
    padding: 11px 13px;
    font-family: inherit;
    font-size: 13.5px;
    color: var(--text);
    background: var(--bg);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
  }

  .field textarea {
    resize: vertical;
    min-height: 95px;
    line-height: 1.6;
  }

  .field input:focus,
  .field textarea:focus,
  .field select:focus,
  .plain-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-glow);
    background: var(--white);
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .three-col {
    display: grid;
    grid-template-columns: 1fr 120px 100px;
    gap: 12px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 18px;
    border: none;
    border-radius: 13px;
    font-family: inherit;
    font-weight: 800;
    font-size: 13.5px;
    cursor: pointer;
    transition: box-shadow var(--transition), transform var(--transition), opacity var(--transition);
  }

  .btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
  }

  .btn-secondary {
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    color: var(--gold-dark);
  }

  .btn-danger {
    background: rgba(220,53,69,0.10);
    color: #b02a37;
    border: 1px solid rgba(220,53,69,0.20);
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .array-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }

  .array-row.two {
    grid-template-columns: 1fr 1fr auto;
  }

  .array-row.stats {
    grid-template-columns: 1.1fr 100px 80px 1.3fr auto;
  }

  .array-row.feature {
    grid-template-columns: 90px 1fr auto;
  }

  .image-preview {
    width: 100%;
    min-height: 220px;
    border-radius: 18px;
    border: 1px dashed var(--gold-border);
    background: var(--bg);
    overflow: hidden;
    display: grid;
    place-items: center;
    color: var(--muted);
    margin-bottom: 14px;
  }

  .image-preview.hero {
    min-height: 300px;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .hint {
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.6;
    margin: 8px 0 14px;
  }

  .selected-count {
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    border-radius: 14px;
    color: var(--gold-dark);
    padding: 12px 14px;
    font-weight: 800;
    margin: 14px 0;
  }

  .gallery-admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 16px;
  }

  .gallery-admin-item {
    border: 2px solid rgba(234,215,166,0.75);
    border-radius: 18px;
    padding: 12px;
    background: #fff;
    transition: all var(--transition);
  }

  .gallery-admin-item.selected {
    border-color: var(--gold);
    background: #fffaf0;
    box-shadow: 0 10px 28px rgba(184,134,11,0.14);
  }

  .gallery-admin-item img {
    width: 100%;
    height: 142px;
    object-fit: cover;
    border-radius: 14px;
    display: block;
    margin-bottom: 10px;
    background: var(--bg);
  }

  .gallery-admin-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--gold-dark);
    margin-bottom: 8px;
  }

  .gallery-admin-item p {
    font-size: 11.5px;
    color: var(--muted);
    word-break: break-all;
    margin-bottom: 10px;
  }

  .json-editor {
    width: 100%;
    min-height: 660px;
    border-radius: 16px;
    border: 1px solid #111827;
    background: #0f172a;
    color: #e5e7eb;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.65;
    padding: 18px;
    outline: none;
  }

  @keyframes fadeDown {
    from {
      opacity: 0;
      transform: translateY(-16px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 980px) {
    .admin-sidebar {
      transform: translateX(-105%);
      transition: transform var(--transition);
    }

    .admin-sidebar.open {
      transform: translateX(0);
    }

    .admin-main {
      margin-left: 0;
    }

    .admin-mobile-topbar {
      display: flex;
    }
  }

  @media (max-width: 760px) {
    .container {
      padding: 24px 0 40px;
    }

    .page-title h1 {
      font-size: 25px;
    }

    .editor-grid,
    .two-col,
    .three-col,
    .array-row,
    .array-row.two,
    .array-row.stats,
    .array-row.feature {
      grid-template-columns: 1fr;
    }
  }
`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function buildAdminHeaders(json = true) {
  const token = getAdminToken();
  let helperHeaders = {};

  try {
    helperHeaders = typeof adminHeaders === "function" ? adminHeaders(token) : {};
  } catch {
    try {
      helperHeaders = typeof adminHeaders === "function" ? adminHeaders() : {};
    } catch {
      helperHeaders = {};
    }
  }

  const headers = {
    Accept: "application/json",
    ...(helperHeaders || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  } else {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  return headers;
}

function normalizeApiData(payload) {
  return payload?.data !== undefined ? payload.data : payload;
}

async function requestAdminApi(endpoint, options = {}) {
  const token = getAdminToken();

  if (!token) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const headers = {
    ...buildAdminHeaders(true),
    ...(options.headers || {}),
  };

  if (typeof apiRequest === "function") {
    return apiRequest(endpoint, {
      ...options,
      headers,
    });
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    const error = new Error(result.message || "Unauthorized");
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const validationErrors = result.errors ? Object.values(result.errors).flat().join("\n") : "";
    throw new Error(result.error || validationErrors || result.message || "Request failed.");
  }

  return result;
}

async function requestAdminForm(endpoint, formData) {
  const token = getAdminToken();

  if (!token) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: buildAdminHeaders(false),
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    const error = new Error(result.message || "Unauthorized");
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const validationErrors = result.errors ? Object.values(result.errors).flat().join("\n") : "";
    throw new Error(result.error || validationErrors || result.message || "Upload failed.");
  }

  return result;
}

function mergeContent(content) {
  const incoming = content && typeof content === "object" ? content : {};

  return {
    ...clone(emptyContent),
    ...incoming,
    nav: { ...emptyContent.nav, ...(incoming.nav || {}) },
    hero: { ...emptyContent.hero, ...(incoming.hero || {}) },
    calendar_section: { ...emptyContent.calendar_section, ...(incoming.calendar_section || {}) },
    our_story: { ...emptyContent.our_story, ...(incoming.our_story || {}) },
    creating_experiences: { ...emptyContent.creating_experiences, ...(incoming.creating_experiences || {}) },
    gallery: { ...emptyContent.gallery, ...(incoming.gallery || {}) },
    features_section: { ...emptyContent.features_section, ...(incoming.features_section || {}) },
    booking_cta: { ...emptyContent.booking_cta, ...(incoming.booking_cta || {}) },
    footer: { ...emptyContent.footer, ...(incoming.footer || {}) },
    stats: Array.isArray(incoming.stats) ? incoming.stats : [],
  };
}

function resolveAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function getPath(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}

function setPath(object, path, value) {
  const next = clone(object);
  const keys = path.split(".");
  let current = next;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }

    current = current[key];
  });

  return next;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Panel({ title, icon, children, full = false, action = null }) {
  return (
    <section className={`panel ${full ? "full" : ""}`.trim()}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function IconBars({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconFile({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export default function AdminHomepageContentPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(() => getStoredAdmin() || {});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent] = useState(() => clone(emptyContent));
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [advancedJson, setAdvancedJson] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const adminName = admin?.name || "Admin";
  const adminInitial = useMemo(() => (adminName || "A").charAt(0).toUpperCase(), [adminName]);

  const selectedGalleryFiles = useMemo(() => {
    return selectedGalleryUrls
      .map((url) => galleryFiles.find((file) => file.url === url))
      .filter(Boolean);
  }, [galleryFiles, selectedGalleryUrls]);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    navigate("/admin-login");
  }, [navigate]);

  const handleError = useCallback(
    (error, fallback = "Something went wrong.") => {
      if (error?.status === 401 || error?.status === 403 || String(error?.message || "").toLowerCase().includes("unauthorized")) {
        redirectToLogin();
        return;
      }

      setMessage({ type: "error", text: error.message || fallback });
    },
    [redirectToLogin]
  );

  const updateField = useCallback((path, value) => {
    setContent((previous) => setPath(previous, path, value));
  }, []);

  const updateArrayItem = useCallback((path, index, key, value) => {
    setContent((previous) => {
      const items = arrayValue(getPath(previous, path));
      const nextItems = items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return { ...item, [key]: value };
      });

      return setPath(previous, path, nextItems);
    });
  }, []);

  const addArrayItem = useCallback((path, item) => {
    setContent((previous) => {
      const items = arrayValue(getPath(previous, path));
      return setPath(previous, path, [...items, item]);
    });
  }, []);

  const removeArrayItem = useCallback((path, index) => {
    setContent((previous) => {
      const items = arrayValue(getPath(previous, path));
      return setPath(
        previous,
        path,
        items.filter((_, itemIndex) => itemIndex !== index)
      );
    });
  }, []);

  const loadEditorData = useCallback(async () => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await requestAdminApi(`/admin/homepage-content?t=${Date.now()}`, {
        method: "GET",
      });

      const data = normalizeApiData(result);
      const nextContent = mergeContent(data?.content || data || {});
      const files = data?.gallery_files || [];

      setContent(nextContent);
      setGalleryFiles(files);
      setSelectedGalleryUrls(arrayValue(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));
    } catch (error) {
      handleError(error, "Homepage content loading failed.");
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const saveContent = useCallback(
    async (customContent = content) => {
      setIsSaving(true);
      setMessage({ type: "", text: "" });

      try {
        const result = await requestAdminApi("/admin/homepage-content", {
          method: "PUT",
          body: JSON.stringify(customContent),
        });

        const nextContent = mergeContent(normalizeApiData(result));

        setContent(nextContent);
        setSelectedGalleryUrls(arrayValue(nextContent.gallery.images).map((image) => image.url));
        setAdvancedJson(JSON.stringify(nextContent, null, 2));
        setMessage({ type: "success", text: "Homepage content saved successfully." });
      } catch (error) {
        handleError(error, "Homepage content save failed.");
      } finally {
        setIsSaving(false);
      }
    },
    [content, handleError]
  );

  const uploadSectionImage = useCallback(
    async (target, file) => {
      if (!file) return;

      setIsSaving(true);
      setMessage({ type: "", text: "" });

      try {
        const formData = new FormData();
        formData.append("target", target);
        formData.append("image", file);

        const result = await requestAdminForm("/admin/homepage-content/upload-section-image", formData);
        const nextContent = mergeContent(normalizeApiData(result));

        setContent(nextContent);
        setAdvancedJson(JSON.stringify(nextContent, null, 2));
        setMessage({ type: "success", text: "Image uploaded and JSON updated successfully." });
      } catch (error) {
        handleError(error, "Image upload failed.");
      } finally {
        setIsSaving(false);
      }
    },
    [handleError]
  );

  const uploadGalleryImages = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      setIsSaving(true);
      setMessage({ type: "", text: "" });

      try {
        const formData = new FormData();

        Array.from(files).forEach((file) => {
          formData.append("images[]", file);
        });

        const result = await requestAdminForm("/admin/homepage-content/gallery/upload", formData);

        setGalleryFiles(result.gallery_files || []);
        setMessage({
          type: "success",
          text: "Gallery images uploaded successfully. Now select which images should show on homepage.",
        });
      } catch (error) {
        handleError(error, "Gallery upload failed.");
      } finally {
        setIsSaving(false);
      }
    },
    [handleError]
  );

  const saveGallerySelection = useCallback(async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await requestAdminApi("/admin/homepage-content/gallery/select", {
        method: "POST",
        body: JSON.stringify({
          selected_urls: selectedGalleryUrls,
        }),
      });

      const nextContent = mergeContent(normalizeApiData(result));

      setContent(nextContent);
      setGalleryFiles(result.gallery_files || galleryFiles);
      setSelectedGalleryUrls(arrayValue(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));
      setMessage({ type: "success", text: "Selected homepage gallery images saved successfully." });
    } catch (error) {
      handleError(error, "Gallery selection save failed.");
    } finally {
      setIsSaving(false);
    }
  }, [galleryFiles, handleError, selectedGalleryUrls]);

  const deleteGalleryFile = useCallback(
    async (file) => {
      const confirmed = window.confirm(`Delete ${file.name} from hosting and remove it from homepage JSON?`);
      if (!confirmed) return;

      setIsSaving(true);
      setMessage({ type: "", text: "" });

      try {
        const result = await requestAdminApi("/admin/homepage-content/gallery/file", {
          method: "DELETE",
          body: JSON.stringify({ url: file.url }),
        });

        const nextContent = mergeContent(normalizeApiData(result));

        setContent(nextContent);
        setGalleryFiles(result.gallery_files || []);
        setSelectedGalleryUrls(arrayValue(nextContent.gallery.images).map((image) => image.url));
        setAdvancedJson(JSON.stringify(nextContent, null, 2));
        setMessage({ type: "success", text: "Gallery image deleted from hosting successfully." });
      } catch (error) {
        handleError(error, "Gallery image delete failed.");
      } finally {
        setIsSaving(false);
      }
    },
    [handleError]
  );

  const toggleGallerySelection = useCallback((url) => {
    setSelectedGalleryUrls((previous) => {
      if (previous.includes(url)) {
        return previous.filter((item) => item !== url);
      }

      return [...previous, url];
    });
  }, []);

  const logoutAdmin = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await requestAdminApi("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {
      // Local session will still be removed.
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      setIsLoggingOut(false);
      navigate("/admin-login");
    }
  }, [isLoggingOut, navigate]);

  useEffect(() => {
    if (!getAdminToken()) {
      redirectToLogin();
      return;
    }

    document.body.classList.add("admin-layout");
    loadEditorData();

    return () => {
      document.body.classList.remove("admin-layout");
    };
  }, [loadEditorData, redirectToLogin]);

  useEffect(() => {
    setAdvancedJson(JSON.stringify(content, null, 2));
  }, [content]);

  if (isLoading) {
    return (
      <>
        <style>{adminHomepageStyles}</style>
        <main className="admin-main" style={{ marginLeft: 0 }}>
          <div className="container">
            <div className="panel">Loading homepage editor...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{adminHomepageStyles}</style>

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`.trim()}>
        <Link to="/" className="sidebar-brand">
          <div>
            <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
            <span className="sidebar-title">Admin Portal</span>
          </div>
        </Link>

        <div className="sidebar-admin-card">
          <div className="admin-avatar">{adminInitial}</div>
          <div className="sidebar-admin-meta">
            <span className="sidebar-admin-label">Signed in as</span>
            <span className="sidebar-admin-name">{adminName}</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="sidebar-section-title">Dashboard</div>

          <Link to="/admin-dashboard" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <IconBars size={15} />
            Overview
          </Link>

          <Link to="/admin-bookings" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <IconFile size={15} />
            Bookings
          </Link>

          <Link to="/admin-manual-booking" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <IconPlus />
            Manual Booking
          </Link>

          <div className="sidebar-section-title">Website</div>

          <Link to="/admin-homepage-content" className="sidebar-link active" onClick={() => setSidebarOpen(false)}>
            <IconEdit />
            Homepage Content
          </Link>

          <Link to="/" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <IconCalendar />
            Public Website
          </Link>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout" type="button" onClick={logoutAdmin} disabled={isLoggingOut}>
            <IconLogout />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`.trim()} onClick={() => setSidebarOpen(false)} />

      <main className="admin-main">
        <div className="admin-mobile-topbar">
          <button className="sidebar-toggle" type="button" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
        </div>

        <div className="container">
          <div className="page-header">
            <div className="page-title">
              <h1>Homepage Content Editor</h1>
              <p className="muted">Edit homepage text, images, gallery selection, and footer information from hosting JSON.</p>
            </div>

            <div className="top-actions">
              <button className="btn btn-secondary" type="button" onClick={loadEditorData} disabled={isSaving}>
                Refresh
              </button>
              <button className="btn btn-primary" type="button" onClick={() => saveContent()} disabled={isSaving}>
                <IconSave />
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>

          <div className={`message-banner ${message.text ? message.type : "hidden"}`.trim()}>
            <span>{message.text}</span>
          </div>

          <div className="tabs">
            {[
              ["hero", "Hero"],
              ["story", "Story & Experience"],
              ["gallery", "Gallery"],
              ["nav", "Navigation"],
              ["stats", "Stats"],
              ["calendar", "Calendar Text"],
              ["features", "Features"],
              ["cta", "CTA"],
              ["footer", "Footer"],
              ["advanced", "Advanced JSON"],
            ].map(([key, label]) => (
              <button
                className={`tab-btn ${activeTab === key ? "active" : ""}`}
                type="button"
                key={key}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "hero" && (
            <div className="editor-grid">
              <Panel title="Hero Section Content" icon={<IconEdit />}>
                <Field label="Hero Title" value={content.hero.title} onChange={(value) => updateField("hero.title", value)} />
                <Field label="Highlighted Text" value={content.hero.highlight} onChange={(value) => updateField("hero.highlight", value)} />
                <TextArea label="Subtitle" value={content.hero.subtitle} onChange={(value) => updateField("hero.subtitle", value)} />

                <div className="two-col">
                  <Field label="Primary Button Text" value={content.hero.primary_button_text} onChange={(value) => updateField("hero.primary_button_text", value)} />
                  <Field label="Primary Button Link" value={content.hero.primary_button_link} onChange={(value) => updateField("hero.primary_button_link", value)} />
                </div>

                <div className="two-col">
                  <Field label="Secondary Button Text" value={content.hero.secondary_button_text} onChange={(value) => updateField("hero.secondary_button_text", value)} />
                  <Field label="Secondary Button Link" value={content.hero.secondary_button_link} onChange={(value) => updateField("hero.secondary_button_link", value)} />
                </div>
              </Panel>

              <Panel title="Hero Background Image" icon={<IconImage />}>
                <div className="image-preview hero">
                  {content.hero.background_image ? (
                    <img src={resolveAssetUrl(content.hero.background_image)} alt="Hero background" />
                  ) : (
                    <span>No image selected</span>
                  )}
                </div>

                <p className="hint">Upload saves to hosting: /uploads/homepage/hero-background.ext and updates homepage-content.json automatically.</p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadSectionImage("hero_background", event.target.files?.[0])}
                />
              </Panel>
            </div>
          )}

          {activeTab === "story" && (
            <div className="editor-grid">
              <Panel title="Our Story Section" icon={<IconEdit />}>
                <Field label="Eyebrow" value={content.our_story.eyebrow} onChange={(value) => updateField("our_story.eyebrow", value)} />
                <Field label="Title" value={content.our_story.title} onChange={(value) => updateField("our_story.title", value)} />
                <TextArea label="Description" value={content.our_story.description} onChange={(value) => updateField("our_story.description", value)} />
              </Panel>

              <Panel title="Creating Experiences Image" icon={<IconImage />}>
                <div className="image-preview">
                  {content.creating_experiences.image ? (
                    <img src={resolveAssetUrl(content.creating_experiences.image)} alt="Creating Experiences" />
                  ) : (
                    <span>No image selected</span>
                  )}
                </div>

                <p className="hint">Upload saves to hosting: /uploads/homepage/creating-experiences.ext and updates JSON automatically.</p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadSectionImage("creating_experiences_image", event.target.files?.[0])}
                />
              </Panel>

              <Panel title="Creating Experiences Content" icon={<IconEdit />} full>
                <div className="two-col">
                  <Field label="Image Alt Text" value={content.creating_experiences.image_alt} onChange={(value) => updateField("creating_experiences.image_alt", value)} />
                  <Field label="Badge Text" value={content.creating_experiences.badge_text} onChange={(value) => updateField("creating_experiences.badge_text", value)} />
                </div>

                <Field label="Eyebrow" value={content.creating_experiences.eyebrow} onChange={(value) => updateField("creating_experiences.eyebrow", value)} />
                <Field label="Title" value={content.creating_experiences.title} onChange={(value) => updateField("creating_experiences.title", value)} />
                <TextArea label="Description 1" value={content.creating_experiences.description_1} onChange={(value) => updateField("creating_experiences.description_1", value)} />
                <TextArea label="Description 2" value={content.creating_experiences.description_2} onChange={(value) => updateField("creating_experiences.description_2", value)} />

                <div className="two-col">
                  <Field label="Button Text" value={content.creating_experiences.button_text} onChange={(value) => updateField("creating_experiences.button_text", value)} />
                  <Field label="Button Link" value={content.creating_experiences.button_link} onChange={(value) => updateField("creating_experiences.button_link", value)} />
                </div>
              </Panel>

              <Panel
                title="Experience Points"
                icon={<IconPlus />}
                full
                action={
                  <button className="btn btn-secondary" type="button" onClick={() => addArrayItem("creating_experiences.points", "New Point")}>
                    + Add Point
                  </button>
                }
              >
                {arrayValue(content.creating_experiences.points).map((point, index) => (
                  <div className="array-row" key={`${point}-${index}`}>
                    <input
                      className="plain-input"
                      value={point}
                      onChange={(event) => {
                        const points = [...arrayValue(content.creating_experiences.points)];
                        points[index] = event.target.value;
                        updateField("creating_experiences.points", points);
                      }}
                    />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("creating_experiences.points", index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="editor-grid">
              <Panel title="Gallery Section Text" icon={<IconEdit />}>
                <Field label="Eyebrow" value={content.gallery.eyebrow} onChange={(value) => updateField("gallery.eyebrow", value)} />
                <Field label="Title" value={content.gallery.title} onChange={(value) => updateField("gallery.title", value)} />
                <TextArea label="Description" value={content.gallery.description} onChange={(value) => updateField("gallery.description", value)} />
                <Field label="Empty Gallery Text" value={content.gallery.empty_text} onChange={(value) => updateField("gallery.empty_text", value)} />
              </Panel>

              <Panel title="Upload Gallery Images" icon={<IconImage />}>
                <p className="hint">Images are saved in hosting folder: /uploads/homepage/gallery/ as gallery_1, gallery_2, gallery_3 and so on.</p>

                <input type="file" accept="image/*" multiple onChange={(event) => uploadGalleryImages(event.target.files)} />

                <div className="selected-count">
                  Selected for homepage: <strong>{selectedGalleryUrls.length}</strong>
                </div>

                <button className="btn btn-primary" type="button" disabled={isSaving} onClick={saveGallerySelection}>
                  Save Selected Gallery Images
                </button>
              </Panel>

              <Panel title="All Gallery Images From Hosting Folder" icon={<IconImage />} full>
                <div className="gallery-admin-grid">
                  {galleryFiles.map((file) => (
                    <div className={`gallery-admin-item ${selectedGalleryUrls.includes(file.url) ? "selected" : ""}`} key={file.url}>
                      <img src={file.url} alt={file.name} />

                      <label>
                        <input
                          type="checkbox"
                          checked={selectedGalleryUrls.includes(file.url)}
                          onChange={() => toggleGallerySelection(file.url)}
                        />
                        Show on homepage
                      </label>

                      <p>{file.name}</p>

                      <button className="btn btn-danger" type="button" onClick={() => deleteGalleryFile(file)}>
                        Delete from Hosting
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Selected Homepage Gallery Preview" icon={<IconImage />} full>
                <div className="gallery-admin-grid">
                  {selectedGalleryFiles.map((file) => (
                    <div className="gallery-admin-item selected" key={file.url}>
                      <img src={file.url} alt={file.name} />
                      <p>{file.name}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "nav" && (
            <div className="editor-grid">
              <Panel title="Navigation Settings" icon={<IconEdit />}>
                <Field label="Logo Path" value={content.nav.logo} onChange={(value) => updateField("nav.logo", value)} />
                <input type="file" accept="image/*" onChange={(event) => uploadSectionImage("nav_logo", event.target.files?.[0])} />

                <Field label="Logo Alt" value={content.nav.logo_alt} onChange={(value) => updateField("nav.logo_alt", value)} />

                <div className="two-col">
                  <Field label="Booking Button Text" value={content.nav.booking_button_text} onChange={(value) => updateField("nav.booking_button_text", value)} />
                  <Field label="Booking Button Link" value={content.nav.booking_button_link} onChange={(value) => updateField("nav.booking_button_link", value)} />
                </div>

                <div className="two-col">
                  <Field label="Login Text" value={content.nav.login_text} onChange={(value) => updateField("nav.login_text", value)} />
                  <Field label="Admin Login Text" value={content.nav.admin_login_text} onChange={(value) => updateField("nav.admin_login_text", value)} />
                </div>

                <Field label="Logout Text" value={content.nav.logout_text} onChange={(value) => updateField("nav.logout_text", value)} />
              </Panel>

              <Panel
                title="Navbar Links"
                icon={<IconFile />}
                action={
                  <button className="btn btn-secondary" type="button" onClick={() => addArrayItem("nav.links", { label: "New Link", href: "#" })}>
                    + Add Link
                  </button>
                }
              >
                {arrayValue(content.nav.links).map((link, index) => (
                  <div className="array-row two" key={`${link.label}-${index}`}>
                    <input className="plain-input" value={link.label || ""} onChange={(event) => updateArrayItem("nav.links", index, "label", event.target.value)} />
                    <input className="plain-input" value={link.href || ""} onChange={(event) => updateArrayItem("nav.links", index, "href", event.target.value)} />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("nav.links", index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="editor-grid">
              <Panel
                title="Stats Section"
                icon={<IconBars />}
                full
                action={
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      addArrayItem("stats", {
                        id: `stat_${Date.now()}`,
                        count: 0,
                        suffix: "+",
                        label: "New Stat",
                        delay: "",
                      })
                    }
                  >
                    + Add Stat
                  </button>
                }
              >
                {arrayValue(content.stats).map((stat, index) => (
                  <div className="array-row stats" key={stat.id || index}>
                    <input className="plain-input" value={stat.id || ""} onChange={(event) => updateArrayItem("stats", index, "id", event.target.value)} placeholder="ID" />
                    <input className="plain-input" type="number" value={stat.count || 0} onChange={(event) => updateArrayItem("stats", index, "count", Number(event.target.value))} placeholder="Count" />
                    <input className="plain-input" value={stat.suffix || ""} onChange={(event) => updateArrayItem("stats", index, "suffix", event.target.value)} placeholder="Suffix" />
                    <input className="plain-input" value={stat.label || ""} onChange={(event) => updateArrayItem("stats", index, "label", event.target.value)} placeholder="Label" />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("stats", index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="editor-grid">
              <Panel title="Calendar Section Text" icon={<IconCalendar />}>
                <Field label="Eyebrow" value={content.calendar_section.eyebrow} onChange={(value) => updateField("calendar_section.eyebrow", value)} />
                <Field label="Title" value={content.calendar_section.title} onChange={(value) => updateField("calendar_section.title", value)} />
                <TextArea label="Description" value={content.calendar_section.description} onChange={(value) => updateField("calendar_section.description", value)} />
                <Field label="Loading Text" value={content.calendar_section.loading_text} onChange={(value) => updateField("calendar_section.loading_text", value)} />
              </Panel>

              <Panel title="Calendar Buttons & Legend" icon={<IconEdit />}>
                <div className="three-col">
                  <Field label="Today" value={content.calendar_section.button_today} onChange={(value) => updateField("calendar_section.button_today", value)} />
                  <Field label="Month" value={content.calendar_section.button_month} onChange={(value) => updateField("calendar_section.button_month", value)} />
                  <Field label="Year View" value={content.calendar_section.button_year_view} onChange={(value) => updateField("calendar_section.button_year_view", value)} />
                </div>

                {arrayValue(content.calendar_section.legend).map((item, index) => (
                  <div className="array-row two" key={`${item.label}-${index}`}>
                    <input className="plain-input" value={item.label || ""} onChange={(event) => updateArrayItem("calendar_section.legend", index, "label", event.target.value)} />
                    <input className="plain-input" value={item.color || ""} onChange={(event) => updateArrayItem("calendar_section.legend", index, "color", event.target.value)} />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("calendar_section.legend", index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "features" && (
            <div className="editor-grid">
              <Panel title="Features Section Text" icon={<IconEdit />}>
                <Field label="Eyebrow" value={content.features_section.eyebrow} onChange={(value) => updateField("features_section.eyebrow", value)} />
                <Field label="Title" value={content.features_section.title} onChange={(value) => updateField("features_section.title", value)} />
                <TextArea label="Description" value={content.features_section.description} onChange={(value) => updateField("features_section.description", value)} />
              </Panel>

              <Panel
                title="Feature Cards"
                icon={<IconFile />}
                full
                action={
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      addArrayItem("features_section.cards", {
                        id: `feature_${Date.now()}`,
                        icon: "⭐",
                        title: "New Feature",
                        text: "Feature description",
                        delay: "",
                      })
                    }
                  >
                    + Add Feature
                  </button>
                }
              >
                {arrayValue(content.features_section.cards).map((card, index) => (
                  <div className="panel" key={card.id || index} style={{ marginBottom: 14 }}>
                    <div className="two-col">
                      <Field label="Icon" value={card.icon} onChange={(value) => updateArrayItem("features_section.cards", index, "icon", value)} />
                      <Field label="Title" value={card.title} onChange={(value) => updateArrayItem("features_section.cards", index, "title", value)} />
                    </div>
                    <TextArea label="Text" value={card.text} onChange={(value) => updateArrayItem("features_section.cards", index, "text", value)} />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("features_section.cards", index)}>
                      Remove Feature
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "cta" && (
            <div className="editor-grid">
              <Panel title="CTA Section Content" icon={<IconEdit />}>
                <div className="three-col">
                  <Field label="Title" value={content.booking_cta.title} onChange={(value) => updateField("booking_cta.title", value)} />
                  <Field label="Highlight" value={content.booking_cta.highlight} onChange={(value) => updateField("booking_cta.highlight", value)} />
                  <Field label="Title Suffix" value={content.booking_cta.title_suffix} onChange={(value) => updateField("booking_cta.title_suffix", value)} />
                </div>

                <TextArea label="Description" value={content.booking_cta.description} onChange={(value) => updateField("booking_cta.description", value)} />

                <div className="two-col">
                  <Field label="Primary Button Text" value={content.booking_cta.primary_button_text} onChange={(value) => updateField("booking_cta.primary_button_text", value)} />
                  <Field label="Primary Button Link" value={content.booking_cta.primary_button_link} onChange={(value) => updateField("booking_cta.primary_button_link", value)} />
                </div>

                <div className="two-col">
                  <Field label="Secondary Button Text" value={content.booking_cta.secondary_button_text} onChange={(value) => updateField("booking_cta.secondary_button_text", value)} />
                  <Field label="Secondary Button Link" value={content.booking_cta.secondary_button_link} onChange={(value) => updateField("booking_cta.secondary_button_link", value)} />
                </div>
              </Panel>

              <Panel title="CTA Background Image" icon={<IconImage />}>
                <div className="image-preview">
                  {content.booking_cta.background_image ? (
                    <img src={resolveAssetUrl(content.booking_cta.background_image)} alt="CTA background" />
                  ) : (
                    <span>No image selected</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadSectionImage("booking_cta_background", event.target.files?.[0])}
                />
              </Panel>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="editor-grid">
              <Panel title="Footer Brand" icon={<IconEdit />}>
                <Field label="Footer Logo Path" value={content.footer.logo} onChange={(value) => updateField("footer.logo", value)} />
                <input type="file" accept="image/*" onChange={(event) => uploadSectionImage("footer_logo", event.target.files?.[0])} />

                <Field label="Logo Alt" value={content.footer.logo_alt} onChange={(value) => updateField("footer.logo_alt", value)} />
                <TextArea label="Description" value={content.footer.description} onChange={(value) => updateField("footer.description", value)} />
              </Panel>

              <Panel title="Footer Contact" icon={<IconFile />}>
                <Field label="Contact Title" value={content.footer.contact_title} onChange={(value) => updateField("footer.contact_title", value)} />
                <Field label="Address" value={content.footer.address} onChange={(value) => updateField("footer.address", value)} />
                <Field label="Phone" value={content.footer.phone} onChange={(value) => updateField("footer.phone", value)} />
                <Field label="Email" value={content.footer.email} onChange={(value) => updateField("footer.email", value)} />
                <Field label="Copyright" value={content.footer.copyright} onChange={(value) => updateField("footer.copyright", value)} />
                <Field label="Copyright Brand" value={content.footer.copyright_brand} onChange={(value) => updateField("footer.copyright_brand", value)} />
                <Field label="Tagline" value={content.footer.tagline} onChange={(value) => updateField("footer.tagline", value)} />
              </Panel>

              <Panel
                title="Footer Quick Links"
                icon={<IconPlus />}
                full
                action={
                  <button className="btn btn-secondary" type="button" onClick={() => addArrayItem("footer.quick_links", { label: "New Link", href: "#" })}>
                    + Add Link
                  </button>
                }
              >
                {arrayValue(content.footer.quick_links).map((link, index) => (
                  <div className="array-row two" key={`${link.label}-${index}`}>
                    <input className="plain-input" value={link.label || ""} onChange={(event) => updateArrayItem("footer.quick_links", index, "label", event.target.value)} />
                    <input className="plain-input" value={link.href || ""} onChange={(event) => updateArrayItem("footer.quick_links", index, "href", event.target.value)} />
                    <button className="btn btn-danger" type="button" onClick={() => removeArrayItem("footer.quick_links", index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="editor-grid">
              <Panel title="Advanced JSON Editor" icon={<IconFile />} full>
                <p className="hint">Use this only if you need to directly edit the full homepage-content.json structure.</p>

                <textarea
                  className="json-editor"
                  value={advancedJson}
                  onChange={(event) => setAdvancedJson(event.target.value)}
                />

                <br />
                <br />

                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(advancedJson);
                      setContent(mergeContent(parsed));
                      setMessage({ type: "success", text: "JSON applied locally. Click Save All Changes to update hosting JSON." });
                    } catch {
                      setMessage({ type: "error", text: "Invalid JSON format." });
                    }
                  }}
                >
                  Apply JSON Locally
                </button>
              </Panel>
            </div>
          )}
        </div>
      </main>
    </>
  );
}