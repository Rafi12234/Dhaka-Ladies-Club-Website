import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { apiRequest, customerHeaders } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_HALL_ID = 1;

const CUSTOMER_TOKEN_KEY = "dlc_customer_token_v1";
const CUSTOMER_USER_KEY = "dlc_customer_user_v1";
const SELECTED_SLOT_KEY = "dlc_selected_slot_v2";
const BOOKING_DRAFT_KEY = "dlc_booking_draft_v2";
const ACTIVE_HOLD_KEY = "dlc_active_hold_v2";

// ─── Styles ───────────────────────────────────────────────────────────────────
const homePageStyles = String.raw`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  [data-aos] {
    opacity: 0;
    transition-property: opacity, transform;
    transition-duration: 1000ms;
    transition-timing-function: ease;
  }

  [data-aos-delay="100"] { transition-delay: 100ms; }
  [data-aos-delay="150"] { transition-delay: 150ms; }
  [data-aos-delay="200"] { transition-delay: 200ms; }
  [data-aos-delay="250"] { transition-delay: 250ms; }
  [data-aos-delay="300"] { transition-delay: 300ms; }
  [data-aos-delay="450"] { transition-delay: 450ms; }
  [data-aos-delay="500"] { transition-delay: 500ms; }
  [data-aos-delay="550"] { transition-delay: 550ms; }

  [data-aos="fade-up"]    { transform: translateY(35px); }
  [data-aos="fade-right"] { transform: translateX(-35px); }
  [data-aos="fade-left"]  { transform: translateX(35px); }
  [data-aos="zoom-in"]    { transform: scale(0.94); }

  [data-aos].aos-animate {
    opacity: 1;
    transform: none;
  }

  .calendar-loading {
    padding: 80px 20px;
    text-align: center;
    color: var(--text-muted);
    font-weight: 600;
  }

  .popup { transition: opacity 0.28s ease; }
  .popup.closing { opacity: 0; }

  .fc .fc-daygrid-day { cursor: pointer; }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --gold: #b8860b;
    --gold-light: #d4a017;
    --gold-dark: #8f6908;
    --gold-pale: #fdf6e3;
    --gold-border: #ead7a6;
    --bg: #faf7f2;
    --white: #ffffff;
    --text: #1a1a2e;
    --text-muted: #6b7280;
    --shadow-sm: 0 2px 10px rgba(0,0,0,0.06);
    --shadow-md: 0 8px 30px rgba(0,0,0,0.10);
    --shadow-lg: 0 20px 60px rgba(0,0,0,0.14);
    --radius: 20px;
    --radius-lg: 28px;
    --transition: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  a { text-decoration: none; color: inherit; }

  .badge-pending {
    background: rgba(184,134,11,0.12);
    color: #8f6908;
    border: 1px solid rgba(184,134,11,0.28);
  }
  .slot-pending_approval { opacity: 0.95; }

  .container { width: 90%; max-width: 1200px; margin: auto; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px; }

  nav {
    width: 100%;
    position: fixed;
    top: 0; left: 0;
    z-index: 1000;
    transition: var(--transition);
  }

  nav.scrolled .nav-inner {
    background: rgba(255,255,255,0.97);
    box-shadow: 0 4px 30px rgba(184,134,11,0.12);
    border-bottom-color: var(--gold-border);
  }

  .nav-inner {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(234,215,166,0.3);
    transition: var(--transition);
  }

  .nav-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }

  .logo img {
    height: 38px;
    width: auto;
    max-width: 160px;
    object-fit: contain;
    display: block;
    transition: var(--transition);
  }
  .logo img:hover { transform: scale(1.04); }

  .nav-links { display: flex; gap: 8px; align-items: center; }

  .nav-links a {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    padding: 8px 18px;
    border-radius: 50px;
    transition: var(--transition);
    position: relative;
  }

  .nav-links a::after {
    content: '';
    position: absolute;
    bottom: 4px; left: 50%;
    transform: translateX(-50%);
    width: 0; height: 2px;
    background: var(--gold);
    border-radius: 2px;
    transition: var(--transition);
  }

  .nav-links a:hover { color: var(--gold); }
  .nav-links a:hover::after { width: 40%; }

  .login-link {
    background: var(--gold);
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px rgba(184,134,11,0.25);
  }
  .login-link:hover { background: var(--gold-dark); transform: translateY(-2px); }
  .login-link::after { display: none !important; }

  .nav-cta {
    background: var(--gold) !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 15px rgba(184,134,11,0.3);
  }
  .nav-cta:hover {
    background: var(--gold-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(184,134,11,0.4) !important;
  }
  .nav-cta::after { display: none !important; }

  .admin-login-link {
    background: #1a1a2e;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px rgba(26,26,46,0.25);
  }
  .admin-login-link:hover { background: #b8860b; transform: translateY(-2px); }
  .admin-login-link::after { display: none !important; }

  .logout-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: var(--transition);
  }
  .logout-btn:hover { background: #b02a37; transform: translateY(-2px); }

  .profile-icon-link {
    width: 42px; height: 42px;
    border-radius: 50%;
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    color: var(--gold-dark) !important;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 18px !important;
    padding: 0 !important;
    font-weight: 800 !important;
    transition: var(--transition);
  }
  .profile-icon-link svg { width: 20px; height: 20px; }
  .profile-icon-link:hover {
    background: var(--gold);
    color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(184,134,11,0.28);
  }
  .profile-icon-link::after { display: none !important; }

  .hero {
    height: 100vh;
    min-height: 700px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: white;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: url('/assets/img/BG-01.jpeg') center/cover no-repeat;
    transform: scale(1.05);
    animation: heroZoom 20s ease-in-out infinite alternate;
    will-change: transform;
  }

  @keyframes heroZoom {
    from { transform: scale(1.05); }
    to   { transform: scale(1.12); }
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,rgba(0,0,0,0.65) 0%,rgba(184,134,11,0.25) 50%,rgba(0,0,0,0.65) 100%);
  }

  .hero-particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 4px; height: 4px;
    background: rgba(212,160,23,0.6);
    border-radius: 50%;
    animation: particleFloat linear infinite;
    will-change: transform, opacity;
  }

  @keyframes particleFloat {
    0%   { transform: translateY(100vh) rotate(0deg);   opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-20px) rotate(720deg); opacity: 0; }
  }

  .hero-content {
    position: relative;
    z-index: 2;
    padding: 20px;
    max-width: 900px;
  }

  .hero-content h1 {
    font-size: clamp(42px, 8vw, 76px);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 24px;
    animation: fadeSlideUp 1s ease 0.2s both;
  }

  .hero-content h1 span {
    background: linear-gradient(135deg,#f0d080,#b8860b,#d4a017);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  .hero-content p {
    max-width: 650px;
    margin: 0 auto 40px;
    line-height: 1.9;
    font-size: 18px;
    color: rgba(255,255,255,0.88);
    animation: fadeSlideUp 1s ease 0.4s both;
  }

  .hero-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    animation: fadeSlideUp 1s ease 0.6s both;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--gold);
    color: white;
    padding: 16px 36px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 15px;
    font-family: 'Poppins', sans-serif;
    transition: var(--transition);
    cursor: pointer;
    border: none;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.3px;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,rgba(255,255,255,0.2) 0%,transparent 100%);
    opacity: 0;
    transition: var(--transition);
  }
  .btn:hover::before { opacity: 1; }
  .btn:hover { background: var(--gold-dark); transform: translateY(-4px); box-shadow: 0 15px 40px rgba(184,134,11,0.45); }

  .btn-outline {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.8);
    color: white;
  }
  .btn-outline:hover { background: white; color: var(--gold); transform: translateY(-4px); box-shadow: 0 15px 40px rgba(0,0,0,0.2); }

  .hero-scroll {
    position: absolute;
    bottom: 40px; left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    animation: bounceDown 2s ease infinite;
    cursor: pointer;
  }

  .scroll-indicator {
    width: 32px; height: 52px;
    border: 2px solid rgba(255,255,255,0.6);
    border-radius: 20px;
    display: flex;
    justify-content: center;
    padding-top: 8px;
  }

  .scroll-dot {
    width: 6px; height: 6px;
    background: white;
    border-radius: 50%;
    animation: scrollDot 1.5s ease infinite;
  }

  @keyframes scrollDot {
    0%   { transform: translateY(0);    opacity: 1; }
    100% { transform: translateY(18px); opacity: 0; }
  }

  @keyframes bounceDown {
    0%,100% { transform: translateX(-50%) translateY(0);  }
    50%      { transform: translateX(-50%) translateY(8px); }
  }

  .stats-strip { background: white; padding: 0; box-shadow: var(--shadow-md); position: relative; z-index: 10; }

  .stats-inner { display: grid; grid-template-columns: repeat(4,1fr); }

  .stat-item {
    padding: 35px 20px;
    text-align: center;
    border-right: 1px solid var(--gold-border);
    transition: var(--transition);
    cursor: default;
  }
  .stat-item:last-child { border-right: none; }
  .stat-item:hover { background: var(--gold-pale); }

  .stat-number { font-size: 36px; font-weight: 800; color: var(--gold); display: block; line-height: 1; margin-bottom: 6px; }
  .stat-label  { font-size: 13px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px; }

  section { padding: 110px 0; }

  .section-title { text-align: center; margin-bottom: 65px; }

  .section-eyebrow {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
    position: relative;
    padding: 0 20px;
  }
  .section-eyebrow::before,
  .section-eyebrow::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 30px; height: 1px;
    background: var(--gold);
  }
  .section-eyebrow::before { right: 100%; margin-right: -20px; }
  .section-eyebrow::after  { left:  100%; margin-left:  -20px; }

  .section-title h2 {
    font-size: clamp(30px,5vw,46px);
    font-weight: 800;
    color: var(--text);
    margin-bottom: 16px;
    line-height: 1.2;
  }

  .section-title p {
    max-width: 680px;
    margin: auto;
    color: var(--text-muted);
    line-height: 1.85;
    font-size: 16px;
  }

  .calendar-section { background: linear-gradient(180deg,#fdf6e3 0%,var(--white) 100%); }

  #calendar {
    width: 100%;
    max-width: 1100px;
    margin: auto;
    background: white;
    padding: 35px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--gold-border);
    box-sizing: border-box;
    overflow: hidden;
  }

  #calendar .fc { width: 100% !important; }

  #calendar .fc-view-harness,
  #calendar .fc-view,
  #calendar .fc-scrollgrid,
  #calendar .fc-daygrid,
  #calendar .fc-daygrid-body,
  #calendar .fc-daygrid-body table,
  #calendar .fc-col-header,
  #calendar .fc-scrollgrid-sync-table { width: 100% !important; }

  #calendar table { table-layout: fixed !important; }

  .fc-toolbar-title { font-size: 26px !important; color: var(--text) !important; font-weight: 800 !important; font-family: 'Poppins',sans-serif !important; }

  .fc-button-primary {
    background: var(--gold) !important;
    border-color: var(--gold) !important;
    font-family: 'Poppins',sans-serif !important;
    font-weight: 600 !important;
    border-radius: 10px !important;
    padding: 8px 16px !important;
    transition: var(--transition) !important;
  }
  .fc-button-primary:hover { background: var(--gold-dark) !important; border-color: var(--gold-dark) !important; transform: translateY(-1px) !important; }
  .fc-button-primary:not(:disabled).fc-button-active { background: var(--gold-dark) !important; border-color: var(--gold-dark) !important; }

  .fc-col-header-cell {
    background: var(--gold-pale) !important;
    color: var(--gold-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
    padding: 12px 0 !important;
  }

  .fc .fc-daygrid-day-frame { min-height: 110px; }

  .fc .fc-daygrid-event {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 8px !important;
    font-weight: 600;
    font-family: 'Poppins',sans-serif;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .fc .fc-daygrid-event:hover { transform: scale(1.02); }

  .fc .fc-daygrid-day-number { font-size: 16px; font-weight: 600; padding: 8px; color: var(--text); }
  .fc .fc-daygrid-day:hover .fc-daygrid-day-number { color: var(--gold); }
  .fc .fc-daygrid-day.fc-day-today { background: rgba(184,134,11,0.06) !important; }
  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    background: var(--gold);
    color: white;
    border-radius: 50%;
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar-legend { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-top: 28px; }

  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
  .legend-dot  { width: 14px; height: 14px; border-radius: 4px; }

  .about-section { background: var(--bg); }

  .about-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit,minmax(340px,1fr));
    gap: 60px;
    align-items: center;
  }

  .about-img-wrap { position: relative; }
  .about-img-wrap img { width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: block; position: relative; z-index: 2; }
  .about-img-deco { position: absolute; width: 100%; height: 100%; border-radius: var(--radius-lg); border: 3px solid var(--gold-border); top: 18px; left: 18px; z-index: 1; }

  .about-img-badge {
    position: absolute;
    bottom: -20px; right: -20px;
    background: var(--gold);
    color: white;
    width: 100px; height: 100px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    text-align: center;
    line-height: 1.3;
    z-index: 3;
    box-shadow: 0 8px 25px rgba(184,134,11,0.4);
    animation: rotateBadge 15s linear infinite;
  }

  @keyframes rotateBadge      { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }

  .about-img-badge span { animation: rotateBadgeInner 15s linear infinite reverse; }

  @keyframes rotateBadgeInner { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }

  .about-text { padding-left: 10px; }
  .about-text h3 { font-size: clamp(26px,4vw,38px); font-weight: 800; color: var(--text); margin-bottom: 22px; line-height: 1.2; }
  .about-text h3 span { color: var(--gold); }
  .about-text p { color: var(--text-muted); line-height: 1.95; margin-bottom: 20px; font-size: 15.5px; }

  .about-features { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 28px; }

  .about-feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }
  .about-feature-item::before {
    content: '✓';
    width: 24px; height: 24px;
    background: var(--gold);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  .gallery-section { background: white; }

  .gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; align-items: start; }
  .gallery-column { display: flex; flex-direction: column; gap: 18px; }

  .gallery-item { position: relative; overflow: hidden; border-radius: var(--radius); cursor: pointer; width: 100%; }

  /* Placeholder shown while the image loads */
  .gallery-item-inner {
    position: relative;
    width: 100%;
    background: #f0ebe0;
    overflow: hidden;
    border-radius: var(--radius);
  }

  .gallery-item-inner img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease;
    display: block;
    opacity: 0;
  }

  .gallery-item-inner img.loaded { opacity: 1; }

  /* Shimmer skeleton while loading */
  .gallery-item-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #f0ebe0 25%, #e8dfc8 50%, #f0ebe0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    z-index: 1;
    border-radius: var(--radius);
    transition: opacity 0.3s ease;
  }

  .gallery-item-inner.img-loaded::before { opacity: 0; pointer-events: none; }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .gallery-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,rgba(184,134,11,0.7) 0%,rgba(0,0,0,0.4) 100%);
    opacity: 0;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
  }

  .gallery-overlay-icon {
    width: 56px; height: 56px;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 22px;
    transform: scale(0.6) rotate(-15deg);
    transition: var(--transition);
  }

  .gallery-item:hover img                   { transform: scale(1.08); }
  .gallery-item:hover .gallery-overlay      { opacity: 1; }
  .gallery-item:hover .gallery-overlay-icon { transform: scale(1) rotate(0deg); }

  .features-section { background: var(--bg); }

  .feature-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 28px; }

  .feature-card {
    background: white;
    padding: 45px 35px;
    border-radius: var(--radius-lg);
    text-align: center;
    transition: var(--transition);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
  }
  .feature-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,var(--gold-pale) 0%,white 100%);
    opacity: 0;
    transition: var(--transition);
  }
  .feature-card:hover { transform: translateY(-12px); box-shadow: var(--shadow-lg); border-color: var(--gold-border); }
  .feature-card:hover::before { opacity: 1; }
  .feature-card > * { position: relative; z-index: 1; }

  .feature-icon-wrap {
    width: 80px; height: 80px;
    background: var(--gold-pale);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 38px;
    transition: var(--transition);
    border: 2px solid var(--gold-border);
  }
  .feature-card:hover .feature-icon-wrap { background: var(--gold); border-color: var(--gold); transform: rotateY(360deg); }
  .feature-card h3 { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 14px; }
  .feature-card p  { color: var(--text-muted); line-height: 1.8; font-size: 15px; }

  .booking-cta { position: relative; overflow: hidden; }
  .booking-cta-bg { position: absolute; inset: 0; background: url('/assets/img/BG-01.jpeg') center/cover no-repeat; }
  .booking-cta-overlay { position: absolute; inset: 0; background: linear-gradient(135deg,rgba(0,0,0,0.78) 0%,rgba(184,134,11,0.35) 50%,rgba(0,0,0,0.78) 100%); }
  .booking-cta .container { position: relative; z-index: 2; text-align: center; }
  .booking-cta h2 { font-size: clamp(32px,6vw,58px); font-weight: 800; color: white; margin-bottom: 20px; line-height: 1.15; }
  .booking-cta h2 span { color: #f0d080; }
  .booking-cta p { max-width: 650px; margin: 0 auto 40px; line-height: 1.9; color: rgba(255,255,255,0.82); font-size: 17px; }

  footer { background: #0f0f1a; color: white; padding: 70px 0 40px; }

  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 50px; margin-bottom: 50px; }

  .footer-brand img { height: 34px; margin-bottom: 18px; filter: brightness(10); }
  .footer-brand p   { color: #9ca3af; line-height: 1.8; font-size: 14px; max-width: 280px; }

  .footer-col h4 { color: var(--gold); font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
  .footer-col a,
  .footer-col p  { display: block; color: #9ca3af; font-size: 14px; line-height: 1.7; margin-bottom: 8px; transition: var(--transition); }
  .footer-col a:hover { color: var(--gold); padding-left: 4px; }

  .footer-bottom { border-top: 1px solid #1f2937; padding-top: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .footer-bottom p { color: #6b7280; font-size: 13px; }
  .footer-gold { color: var(--gold); }

  .float { animation: float 5s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }

  .popup {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(10,10,30,0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 20px;
    animation: popupFadeIn 0.3s ease;
  }
  @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .popup.active { display: flex; }

  .popup-box {
    background: white;
    border-radius: 28px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 30px 80px rgba(0,0,0,0.25);
    animation: popupSlideUp 0.4s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  @keyframes popupSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

  .popup-header {
    background: linear-gradient(135deg,var(--gold) 0%,#d4a017 100%);
    padding: 28px 30px;
    border-radius: 28px 28px 0 0;
    position: relative;
    overflow: hidden;
  }
  .popup-header::before { content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: rgba(255,255,255,0.08); border-radius: 50%; }
  .popup-header::after  { content: ''; position: absolute; bottom: -60px; left: -30px; width: 140px; height: 140px; background: rgba(255,255,255,0.06); border-radius: 50%; }
  .popup-header-content { position: relative; z-index: 1; }
  .popup-header h3 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 6px; }

  .popup-date-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.22);
    color: white;
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
  }

  .popup-close {
    position: absolute;
    top: 20px; right: 20px;
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    z-index: 2;
  }
  .popup-close:hover { background: rgba(255,255,255,0.35); transform: rotate(90deg); }

  .popup-body    { padding: 28px 30px; }
  .popup-subtitle { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 18px; }

  .slot-radio-group  { display: flex; flex-direction: column; gap: 14px; }
  .slot-radio-item   { position: relative; }

  .slot-radio-item input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }

  .slot-radio-label {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    cursor: pointer;
    transition: var(--transition);
    background: #fafafa;
    user-select: none;
  }
  .slot-radio-item input[type="radio"]:checked + .slot-radio-label { border-color: var(--gold); background: var(--gold-pale); }
  .slot-radio-label:hover { border-color: var(--gold-border); background: var(--gold-pale); }
  .slot-radio-label.disabled { cursor: not-allowed; opacity: 0.58; pointer-events: none; }

  .slot-radio-custom {
    width: 22px; height: 22px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: var(--transition);
  }
  .slot-radio-item input[type="radio"]:checked + .slot-radio-label .slot-radio-custom { border-color: var(--gold); background: var(--gold); }
  .slot-radio-item input[type="radio"]:checked + .slot-radio-label .slot-radio-custom::after { content: ''; width: 8px; height: 8px; background: white; border-radius: 50%; }

  .slot-info { flex: 1; }
  .slot-name  { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
  .slot-time  { font-size: 13px; color: var(--text-muted); font-weight: 500; }

  .slot-status-badge { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .badge-available { background: #dcfce7; color: #166534; }
  .badge-booked    { background: #fee2e2; color: #991b1b; }
  .badge-blocked   { background: #f1f5f9; color: #475569; }
  .badge-progress  { background: #fff3e0; color: #e65100; }
  .badge-pending   { background: rgba(184,134,11,0.12); color: #8f6908; border: 1px solid rgba(184,134,11,0.28); }

  .slot-price { font-size: 14px; font-weight: 700; color: var(--gold); margin-top: 4px; }

  .popup-footer { padding: 0 30px 28px; display: flex; gap: 12px; flex-direction: column; }
  .popup-proceed-btn { width: 100%; padding: 16px; font-size: 16px; font-weight: 700; border-radius: 14px; }
  .popup-close-btn { background: #f1f5f9; color: var(--text-muted); }
  .popup-close-btn:hover { background: #e2e8f0; transform: translateY(-2px); box-shadow: none; }

  .popup-empty      { text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 15px; }
  .popup-empty-icon { font-size: 40px; margin-bottom: 12px; }

  .btn.loading { pointer-events: none; opacity: 0.88; padding-right: 52px; }
  .btn.loading::after {
    content: '';
    position: absolute;
    right: 18px; top: 50%;
    transform: translateY(-50%);
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.7);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

  @media(max-width: 1024px) {
    .gallery-grid { grid-template-columns: repeat(2,1fr); }
    .footer-grid  { grid-template-columns: 1fr 1fr; }
    .stats-inner  { grid-template-columns: repeat(2,1fr); }
  }

  @media(max-width: 768px) {
    section { padding: 80px 0; }
    .nav-links { display: none; }
    .hero-content h1 { font-size: 40px; }
    .gallery-grid { grid-template-columns: repeat(2,1fr); }
    .footer-grid  { grid-template-columns: 1fr; gap: 30px; }
    .footer-bottom { flex-direction: column; text-align: center; }
    .about-img-badge { width: 80px; height: 80px; font-size: 11px; right: -10px; bottom: -10px; }
    .stats-inner { grid-template-columns: repeat(2,1fr); }
    #calendar { padding: 15px; overflow-x: auto; }
    #calendar .fc { min-width: 680px; }
    .popup-box    { border-radius: 20px; }
    .popup-header { padding: 22px 20px; border-radius: 20px 20px 0 0; }
    .popup-body   { padding: 20px; }
    .popup-footer { padding: 0 20px 20px; }
  }

  @media(max-width: 480px) {
    .gallery-grid  { grid-template-columns: 1fr; }
    .about-wrapper { grid-template-columns: 1fr; }
    .stats-inner   { grid-template-columns: repeat(2,1fr); }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_HOMEPAGE_CONTENT = {
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
  our_story: { eyebrow: "", title: "", description: "" },
  creating_experiences: {
    image: "", image_alt: "", badge_text: "",
    eyebrow: "", title: "", description_1: "", description_2: "",
    points: [],
  },
  gallery: { eyebrow: "", title: "", description: "", images: [] },
  footer: { description: "", address: "", phone: "", email: "", copyright: "", tagline: "" },
};

const stats = [
  { count: 500, label: "Events Hosted", delay: "" },
  { count: 1200, label: "Happy Families", delay: "100" },
  { count: 20, label: "Years Experience", delay: "200" },
  { count: 98, label: "% Client Satisfaction", delay: "300" },
];

const featureCards = [
  { icon: "📅", title: "Live Calendar", text: "Browse the full year calendar and view available or booked shifts instantly with real-time updates.", delay: "" },
  { icon: "📝", title: "Online Booking", text: "Book event halls directly from the website with instant reservation requests and confirmation.", delay: "150" },
  { icon: "💳", title: "Secure Payment", text: "Easy and secure online payment system with encrypted transactions for booking confirmations.", delay: "300" },
  { icon: "🎉", title: "Event Management", text: "Full-service event coordination by our expert team to make your celebration flawless.", delay: "450" },
  { icon: "🌟", title: "Premium Décor", text: "Stunning decoration packages crafted by professional designers for every occasion.", delay: "500" },
  { icon: "🔔", title: "Instant Alerts", text: "Get real-time notifications and reminders for your upcoming events and booking updates.", delay: "550" },
];

const calendarColorMap = {
  available: "#198754",
  booked: "#dc3545",
  blocked: "#6c757d",
  payment_in_progress: "#fd7e14",
  pending_approval: "#b8860b",
};

// ─── Session / Storage helpers ────────────────────────────────────────────────
function saveJson(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); }
function removeJson(key) { sessionStorage.removeItem(key); }

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearCustomerAuthSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
}

function clearAllBookingSessionData() {
  Object.keys(sessionStorage).forEach((key) => {
    if (
      key === SELECTED_SLOT_KEY ||
      key === ACTIVE_HOLD_KEY ||
      key === BOOKING_DRAFT_KEY ||
      key.startsWith(`${BOOKING_DRAFT_KEY}_`)
    ) sessionStorage.removeItem(key);
  });
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function parseServerDateTime(value) {
  if (!value) return null;
  const text = String(value);
  return new Date(text.includes("T") ? text : text.replace(" ", "T")).getTime();
}

function getSlotExpiryTime(slot) {
  return parseServerDateTime(slot?.hold_expires_at_iso || slot?.hold_expires_at);
}

function getRemainingText(slot) {
  const expiryTime = getSlotExpiryTime(slot);
  if (!expiryTime) return "";
  const remaining = expiryTime - Date.now();
  return remaining <= 0 ? "00:00" : formatCountdown(remaining);
}

function formatSlotLabel(slot) {
  return `${slot.shift_name} (${slot.start_time} - ${slot.end_time})`;
}

function calculateAmount(slot) {
  return Number(slot?.price || slot?.shift_price || slot?.total_amount || 0);
}

function getCalendarSlotTitle(slot) {
  if (slot.slot_status === "payment_in_progress")
    return `${slot.shift_name} · In Progress ${getRemainingText(slot)}`;
  if (slot.slot_status === "pending_approval")
    return `${slot.shift_name} · Pending Approval`;
  return slot.calendar_title || `${slot.shift_name} · ${slot.slot_status}`;
}

function buildSlotEvent(slot) {
  const color = calendarColorMap[slot.slot_status] || "#6c757d";
  return {
    id: String(slot.slot_id),
    title: getCalendarSlotTitle(slot),
    start: slot.slot_date,
    allDay: true,
    backgroundColor: color,
    borderColor: color,
    classNames: [`slot-${slot.slot_status}`],
    extendedProps: { slot },
  };
}

function getStatusBadge(status) {
  const map = {
    available: { label: "Available", cls: "badge-available" },
    booked: { label: "Booked", cls: "badge-booked" },
    blocked: { label: "Blocked", cls: "badge-blocked" },
    payment_in_progress: { label: "In Progress", cls: "badge-progress" },
    pending_approval: { label: "Pending Approval", cls: "badge-pending" },
  };
  return map[status] || { label: status, cls: "badge-blocked" };
}

// ─── API helpers ──────────────────────────────────────────────────────────────
function normalizeApiData(payload) {
  return payload?.data !== undefined ? payload.data : payload;
}

function getCustomerHeaderObject(token) {
  let helperHeaders = {};
  try {
    helperHeaders = typeof customerHeaders === "function" ? customerHeaders(token) : {};
  } catch {
    try { helperHeaders = typeof customerHeaders === "function" ? customerHeaders() : {}; }
    catch { helperHeaders = {}; }
  }
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(helperHeaders || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestApi(endpoint, options = {}) {
  if (typeof apiRequest === "function") return apiRequest(endpoint, options);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || "API request failed");
  return payload;
}

// ─── Content normalisation ────────────────────────────────────────────────────
function resolveHostingUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function normalizeGalleryImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => img && (img.url || img.src))
    .map((img, i) => ({
      id: img.id || img.url || img.src || `gallery_${i + 1}`,
      url: resolveHostingUrl(img.url || img.src),
      alt: img.alt || img.title || `Gallery image ${i + 1}`,
    }));
}

function mergeHomepageContent(raw) {
  const incoming = raw && typeof raw === "object" ? raw : {};
  const content = {
    hero: { ...EMPTY_HOMEPAGE_CONTENT.hero, ...(incoming.hero || {}) },
    our_story: { ...EMPTY_HOMEPAGE_CONTENT.our_story, ...(incoming.our_story || {}) },
    creating_experiences: { ...EMPTY_HOMEPAGE_CONTENT.creating_experiences, ...(incoming.creating_experiences || {}) },
    gallery: { ...EMPTY_HOMEPAGE_CONTENT.gallery, ...(incoming.gallery || {}) },
    footer: { ...EMPTY_HOMEPAGE_CONTENT.footer, ...(incoming.footer || {}) },
  };

  content.hero.background_image = resolveHostingUrl(content.hero.background_image);
  content.creating_experiences.image = resolveHostingUrl(content.creating_experiences.image);
  content.creating_experiences.points = Array.isArray(content.creating_experiences.points)
    ? content.creating_experiences.points.filter(Boolean) : [];
  content.gallery.images = normalizeGalleryImages(content.gallery.images);
  return content;
}

// ─── Render helpers ───────────────────────────────────────────────────────────
function renderTitleWithHighlightedLastWord(title) {
  const safe = String(title || "").trim();
  if (!safe) return null;
  const words = safe.split(/\s+/);
  if (words.length === 1) return <span>{safe}</span>;
  const last = words.pop();
  return <>{words.join(" ")} <span>{last}</span></>;
}

function renderFooterCopyright(text) {
  const safe = String(text || "").trim();
  if (!safe) return null;
  const brand = "Dhaka Ladies Club";
  if (!safe.includes(brand)) return safe;
  const [before, after] = safe.split(brand);
  return <>{before}<span className="footer-gold">{brand}</span>{after}</>;
}

// ─── Gallery column builder (pure, no image-loading needed) ──────────────────
function getColumnCount() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 480) return 1;
  if (window.innerWidth <= 900) return 2;
  return 3;
}

/**
 * Distribute images into N columns by simple round-robin.
 * Fast and deterministic — no async image loading required.
 * Heights will look balanced because CSS preserves natural aspect ratios via padding-top trick.
 */
function distributeColumns(images, columnCount) {
  const cols = Array.from({ length: columnCount }, () => []);
  images.forEach((img, i) => cols[i % columnCount].push(img));
  return cols;
}

// ─── Lazy gallery image component ────────────────────────────────────────────
/**
 * Uses a padding-top spacer driven by the image's natural aspect ratio,
 * revealed only once the image is fully loaded (via onLoad).
 * Falls back to a 4:3 ratio until the real ratio is known.
 */
function GalleryImage({ url, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [paddingTop, setPaddingTop] = useState("75%"); // default 4:3
  const imgRef = useRef(null);

  // If the browser already has the image cached, `complete` fires synchronously.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth) {
      const ratio = el.naturalHeight / el.naturalWidth;
      setPaddingTop(`${(ratio * 100).toFixed(2)}%`);
      setLoaded(true);
    }
  }, []);

  function handleLoad(e) {
    const el = e.currentTarget;
    if (el.naturalWidth) {
      const ratio = el.naturalHeight / el.naturalWidth;
      setPaddingTop(`${(ratio * 100).toFixed(2)}%`);
    }
    setLoaded(true);
  }

  return (
    <div
      className={`gallery-item-inner${loaded ? " img-loaded" : ""}`}
      style={{ paddingTop }}
    >
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={loaded ? "loaded" : ""}
        onLoad={handleLoad}
        onError={() => setLoaded(true)} // hide shimmer even on broken image
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const slotsByDateRef = useRef({});
  const bookingContextRef = useRef(null);
  const statsRef = useRef(null);
  const popupCloseTimerRef = useRef(null);
  const calendarSizeTimer = useRef(null);
  const aosObserverRef = useRef(null);

  const [homepageContent, setHomepageContent] = useState(EMPTY_HOMEPAGE_CONTENT);
  const [galleryColumns, setGalleryColumns] = useState([[], [], []]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupClosing, setPopupClosing] = useState(false);
  const [popupDate, setPopupDate] = useState("");
  const [popupSlots, setPopupSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isProceeding, setIsProceeding] = useState(false);
  const [counterStarted, setCounterStarted] = useState(false);
  const [counterValues, setCounterValues] = useState({ 500: 0, 1200: 0, 20: 0, 98: 0 });
  const [, setClockTick] = useState(0);

  // ── Particles (stable across renders) ─────────────────────────────────────
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const size = Math.random() * 6 + 2;
        return {
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: Math.random() * 0.6 + 0.2,
          },
        };
      }),
    []
  );

  const selectedFormattedDate = useMemo(() => {
    if (!popupDate) return "Loading...";
    return new Date(`${popupDate}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }, [popupDate]);

  const hero = homepageContent.hero;
  const ourStory = homepageContent.our_story;
  const creatingExperiences = homepageContent.creating_experiences;
  const gallery = homepageContent.gallery;
  const footer = homepageContent.footer;

  // ── Gallery columns: instant, no async image loading ──────────────────────
  useEffect(() => {
    const images = Array.isArray(gallery.images) ? gallery.images : [];
    let mounted = true;

    function rebuild() {
      if (!mounted) return;
      const cols = distributeColumns(images, getColumnCount());
      setGalleryColumns(cols);
    }

    rebuild();

    let resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 200);
    }

    window.addEventListener("resize", onResize);
    return () => {
      mounted = false;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [gallery.images]);

  // ── Calendar resize (debounced, single call) ───────────────────────────────
  const forceCalendarResize = useCallback(() => {
    clearTimeout(calendarSizeTimer.current);
    calendarSizeTimer.current = setTimeout(() => {
      calendarRef.current?.getApi()?.updateSize();
    }, 120);
  }, []);

  // ── AOS observer (created once, re-observed when deps change) ─────────────
  const rerunAOS = useCallback(() => {
    aosObserverRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("aos-animate");
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll("[data-aos]").forEach((el) => observer.observe(el));
    aosObserverRef.current = observer;
  }, []);

  useEffect(() => {
    rerunAOS();
    return () => aosObserverRef.current?.disconnect();
  }, [rerunAOS, calendarReady, homepageContent]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const refreshNavbarAuthState = useCallback(async () => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const localUser = readLocalJson(CUSTOMER_USER_KEY);

    if (!token) { setIsCustomerLoggedIn(false); return null; }

    let user = localUser;
    try {
      const payload = await requestApi("/auth/panel", {
        method: "GET",
        headers: getCustomerHeaderObject(token),
      });
      const data = normalizeApiData(payload);
      user = data?.user || data?.customer || data || localUser;
      if (user && typeof user === "object")
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
    } catch { user = localUser; }

    const userType = String(user?.user_type || "customer").toLowerCase();
    const isCustomer = !!token && (!user || userType === "customer");
    setIsCustomerLoggedIn(isCustomer);
    return isCustomer ? user : null;
  }, []);

  const fetchLoggedInCustomer = useCallback(async () => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const localUser = readLocalJson(CUSTOMER_USER_KEY);
    if (!token) return null;
    try {
      const payload = await requestApi("/auth/panel", {
        method: "GET",
        headers: getCustomerHeaderObject(token),
      });
      const data = normalizeApiData(payload);
      const user = data?.user || data?.customer || data || localUser;
      if (user && typeof user === "object")
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
      return user || localUser;
    } catch { return localUser; }
  }, []);

  const releaseActiveHold = useCallback(async () => {
    const hold = readJson(ACTIVE_HOLD_KEY);
    if (!hold?.booking_id || !hold?.hold_token) return false;
    try {
      await requestApi("/booking-holds/release", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: hold.booking_id, hold_token: hold.hold_token }),
      });
    } catch { /* best effort */ }
    removeJson(ACTIVE_HOLD_KEY);
    return true;
  }, []);

  // ── Calendar countdown ─────────────────────────────────────────────────────
  const updateCalendarCountdowns = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    let needsRefetch = false;
    api.getEvents().forEach((event) => {
      const slot = event.extendedProps?.slot;
      if (!slot || slot.slot_status !== "payment_in_progress") return;
      const expiry = getSlotExpiryTime(slot);
      if (expiry && expiry <= Date.now()) { needsRefetch = true; return; }
      event.setProp("title", getCalendarSlotTitle(slot));
    });

    if (needsRefetch) api.refetchEvents();
  }, []);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadBookingContext = useCallback(async () => {
    const payload = await requestApi("/booking-context", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = normalizeApiData(payload);
    bookingContextRef.current = data;
    return data;
  }, []);

  const loadSlots = useCallback(async (fetchInfo, successCallback, failureCallback) => {
    try {
      const hallId = String(bookingContextRef.current?.default_hall_id || DEFAULT_HALL_ID);
      const params = new URLSearchParams({
        hall_id: hallId,
        from: fetchInfo.startStr.slice(0, 10),
        to: fetchInfo.endStr.slice(0, 10),
      });
      const payload = await requestApi(`/calendar-slots?${params}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const slots = normalizeApiData(payload) || [];

      slotsByDateRef.current = slots.reduce((acc, slot) => {
        (acc[slot.slot_date] = acc[slot.slot_date] || []).push(slot);
        return acc;
      }, {});

      successCallback(slots.map(buildSlotEvent));
    } catch (err) {
      failureCallback(err);
    }
  }, []);

  // ── Popup ──────────────────────────────────────────────────────────────────
  const closePopup = useCallback(() => {
    setPopupClosing(true);
    if (popupCloseTimerRef.current) clearTimeout(popupCloseTimerRef.current);
    popupCloseTimerRef.current = setTimeout(() => {
      setPopupOpen(false);
      setPopupClosing(false);
      setPopupDate("");
      setPopupSlots([]);
      setSelectedSlot(null);
    }, 280);
  }, []);

  const openPopup = useCallback((date, slots) => {
    if (popupCloseTimerRef.current) clearTimeout(popupCloseTimerRef.current);
    setPopupDate(date);
    setPopupSlots(slots || []);
    setSelectedSlot(null);
    setPopupClosing(false);
    setPopupOpen(true);
  }, []);

  const openDateSlots = useCallback(
    (dateStr) => openPopup(dateStr, slotsByDateRef.current[dateStr] || []),
    [openPopup]
  );

  const handleDateClick = useCallback((info) => { info.jsEvent.preventDefault(); openDateSlots(info.dateStr); }, [openDateSlots]);
  const handleEventClick = useCallback((info) => {
    const slot = info.event.extendedProps?.slot;
    if (!slot) return;
    openPopup(slot.slot_date, slotsByDateRef.current[slot.slot_date] || [slot]);
  }, [openPopup]);

  // ── Booking proceed ────────────────────────────────────────────────────────
  const proceedWithSelected = useCallback(async () => {
    if (!selectedSlot || isProceeding) return;
    setIsProceeding(true);

    const selected = {
      ...selectedSlot,
      booking_slot_id: selectedSlot.slot_id,
      booking_date: selectedSlot.slot_date,
      booking_slot_label: formatSlotLabel(selectedSlot),
      total_amount: calculateAmount(selectedSlot),
      selected_at: new Date().toISOString(),
    };
    saveJson(SELECTED_SLOT_KEY, selected);

    const existingDraft = readJson(BOOKING_DRAFT_KEY) || {};
    saveJson(BOOKING_DRAFT_KEY, {
      ...existingDraft,
      hall_id: selectedSlot.hall_id,
      booking_slot_id: selectedSlot.slot_id,
      booking_date: selectedSlot.slot_date,
      booking_slot_label: formatSlotLabel(selectedSlot),
      total_amount: calculateAmount(selectedSlot),
    });

    const user = await fetchLoggedInCustomer();
    if (!user) { setIsProceeding(false); navigate("/login?redirect=booking"); return; }

    if (String(user.user_type || "customer").toLowerCase() !== "customer") {
      clearCustomerAuthSession();
      setIsCustomerLoggedIn(false);
      setIsProceeding(false);
      alert("Only customer accounts can place bookings. Please login with a customer account.");
      navigate("/login?redirect=booking");
      return;
    }

    setIsProceeding(false);
    navigate("/booking");
  }, [fetchLoggedInCustomer, isProceeding, navigate, selectedSlot]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    try {
      if (token) await requestApi("/auth/logout", {
        method: "POST",
        headers: getCustomerHeaderObject(token),
        body: JSON.stringify({}),
      });
    } catch { /* silent */ }

    await releaseActiveHold();
    clearCustomerAuthSession();
    clearAllBookingSessionData();
    setIsCustomerLoggedIn(false);
    navigate("/", { replace: true });
  }, [navigate, releaseActiveHold]);

  // ── Initial data fetch (parallel) ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      // Fire all independent requests in parallel
      const [contentResult] = await Promise.allSettled([
        requestApi(`/homepage-content?t=${Date.now()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        }),
        refreshNavbarAuthState(),
        loadBookingContext().catch(console.error),
      ]);

      if (!mounted) return;

      if (contentResult.status === "fulfilled") {
        const data = normalizeApiData(contentResult.value);
        setHomepageContent(mergeHomepageContent(data));
      }

      setCalendarReady(true);
    }

    bootstrap();
    return () => { mounted = false; };
  }, [loadBookingContext, refreshNavbarAuthState]);

  // ── Scroll handler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Global timers and event listeners ─────────────────────────────────────
  useEffect(() => {
    window.addEventListener("resize", forceCalendarResize, { passive: true });

    const countdownId = setInterval(() => {
      updateCalendarCountdowns();
      setClockTick((v) => v + 1);
    }, 1000);

    const refreshId = setInterval(() => {
      const api = calendarRef.current?.getApi();
      if (api) { api.refetchEvents(); forceCalendarResize(); }
    }, 15_000);

    return () => {
      window.removeEventListener("resize", forceCalendarResize);
      clearInterval(countdownId);
      clearInterval(refreshId);
      clearTimeout(calendarSizeTimer.current);
      clearTimeout(popupCloseTimerRef.current);
    };
  }, [forceCalendarResize, updateCalendarCountdowns]);

  // ── Escape key to close popup ──────────────────────────────────────────────
  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closePopup(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePopup, popupOpen]);

  // ── Counter animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (counterStarted || !statsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setCounterStarted(true);

        const duration = 1500;
        const frames = 60;
        let frame = 0;

        const timer = setInterval(() => {
          frame++;
          setCounterValues({
            500: Math.min(500, Math.floor((500 / frames) * frame)),
            1200: Math.min(1200, Math.floor((1200 / frames) * frame)),
            20: Math.min(20, Math.floor((20 / frames) * frame)),
            98: Math.min(98, Math.floor((98 / frames) * frame)),
          });
          if (frame >= frames) clearInterval(timer);
        }, duration / frames);

        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [counterStarted]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{homePageStyles}</style>

      {/* ── Navbar ── */}
      <nav id="navbar" className={isScrolled ? "scrolled" : ""}>
        <div className="nav-inner">
          <div className="container nav-wrapper">
            <div className="logo">
              <a href="#top" aria-label="Dhaka Ladies Club Home">
                <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club Logo" />
              </a>
            </div>

            <div className="nav-links">
              <a href="#calendar-booking">Calendar</a>
              <a href="#about">About</a>
              <a href="#gallery">Gallery</a>
              <a href="#features">Features</a>
              <a href="#calendar-booking" className="btn nav-cta">Book Now</a>

              {isCustomerLoggedIn ? (
                <>
                  <Link
                    to="/customer-panel"
                    className="profile-icon-link"
                    title="My Profile"
                    aria-label="My Profile"
                    style={{ display: "inline-flex" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>
                  <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="login-link">Login</Link>
                  <Link to="/admin-login" className="admin-login-link">Admin Login</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" id="top">
        <div
          className="hero-bg"
          style={hero.background_image ? { backgroundImage: `url(${hero.background_image})` } : undefined}
        />
        <div className="hero-overlay" />

        <div className="hero-particles">
          {particles.map((p) => (
            <div key={p.id} className="particle" style={p.style} />
          ))}
        </div>

        <div className="hero-content">
          <h1>
            {hero.title}
            <br />
            <span>{hero.highlight}</span>
          </h1>
          <p>{hero.subtitle}</p>
          <div className="hero-actions">
            <a href={hero.primary_button_link || "#calendar-booking"} className="btn">{hero.primary_button_text}</a>
            <a href={hero.secondary_button_link || "#about"} className="btn btn-outline">{hero.secondary_button_text}</a>
          </div>
        </div>

        <button
          type="button"
          className="hero-scroll"
          aria-label="Scroll to statistics"
          onClick={() => statsRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          <div className="scroll-indicator">
            <div className="scroll-dot" />
          </div>
        </button>
      </section>

      {/* ── Stats ── */}
      <div className="stats-strip" id="stats" ref={statsRef}>
        <div className="container">
          <div className="stats-inner">
            {stats.map((item) => (
              <div
                className="stat-item"
                data-aos="fade-up"
                data-aos-delay={item.delay || undefined}
                key={item.label}
              >
                <span className="stat-number" data-count={item.count}>
                  {counterStarted ? `${counterValues[item.count]}+` : "0"}
                </span>
                <span className="stat-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <section className="calendar-section" id="calendar-booking">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">Live Availability</span>
            <h2>Booking Calendar</h2>
            <p>Browse available shifts and reserve your preferred date. Click any date or event to view shift availability and proceed with booking.</p>
          </div>

          <div id="calendar" data-aos="zoom-in" data-aos-duration="800">
            {calendarReady ? (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                navLinks
                editable={false}
                selectable
                dayMaxEvents
                handleWindowResize
                windowResizeDelay={150}
                expandRows
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,listYear",
                }}
                buttonText={{ today: "Today", month: "Month", listYear: "Year View" }}
                events={loadSlots}
                viewDidMount={forceCalendarResize}
                datesSet={forceCalendarResize}
                eventsSet={forceCalendarResize}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
              />
            ) : (
              <div className="calendar-loading">Loading booking calendar…</div>
            )}
          </div>

          <div className="calendar-legend" data-aos="fade-up">
            {[
              { color: "#198754", label: "Available" },
              { color: "#dc3545", label: "Booked" },
              { color: "#fd7e14", label: "Booking In Progress" },
              { color: "#b8860b", label: "Pending Approval" },
              { color: "#6c757d", label: "Blocked" },
            ].map(({ color, label }) => (
              <div className="legend-item" key={label}>
                <div className="legend-dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">{ourStory.eyebrow}</span>
            <h2>{ourStory.title}</h2>
            <p>{ourStory.description}</p>
          </div>

          <div className="about-wrapper">
            <div className="about-img-wrap float" data-aos="fade-right">
              <div className="about-img-deco" />
              {creatingExperiences.image && (
                <img
                  src={creatingExperiences.image}
                  alt={creatingExperiences.image_alt || ourStory.title || "Dhaka Ladies Club"}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="about-img-badge">
                <span>
                  {(creatingExperiences.badge_text || "20+\nYears\nExcellence")
                    .split("\n")
                    .map((line, i, arr) => (
                      <span key={`${line}-${i}`}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                </span>
              </div>
            </div>

            <div className="about-text" data-aos="fade-left">
              <span className="section-eyebrow" style={{ textAlign: "left" }}>
                {creatingExperiences.eyebrow}
              </span>
              <h3>{renderTitleWithHighlightedLastWord(creatingExperiences.title)}</h3>
              <p>{creatingExperiences.description_1}</p>
              <p>{creatingExperiences.description_2}</p>
              <div className="about-features">
                {creatingExperiences.points.map((feature, i) => (
                  <div className="about-feature-item" key={`${feature}-${i}`}>{feature}</div>
                ))}
              </div>
              <br />
              <a href="#calendar-booking" className="btn" style={{ marginTop: "10px" }}>Book a Visit</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">{gallery.eyebrow}</span>
            <h2>{gallery.title}</h2>
            <p>{gallery.description}</p>
          </div>

          <div className="gallery-grid">
            {galleryColumns.map((column, colIdx) => (
              <div className="gallery-column" key={`col-${colIdx}`}>
                {column.map((image, imgIdx) => (
                  <div
                    className="gallery-item"
                    data-aos="zoom-in"
                    data-aos-delay={imgIdx === 0 ? undefined : String(imgIdx * 50 + 50)}
                    key={image.id || `${colIdx}-${imgIdx}`}
                  >
                    {/* GalleryImage handles shimmer + lazy load + aspect ratio */}
                    <GalleryImage url={image.url} alt={image.alt} />
                    <div className="gallery-overlay">
                      <div className="gallery-overlay-icon">✦</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">Why Choose Us</span>
            <h2>World-Class Features</h2>
            <p>Smart booking system with live calendar and secure payments — designed for a seamless experience.</p>
          </div>
          <div className="feature-grid">
            {featureCards.map((feature) => (
              <div
                className="feature-card"
                data-aos="zoom-in"
                data-aos-delay={feature.delay || undefined}
                key={feature.title}
              >
                <div className="feature-icon-wrap">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="booking-cta">
        <div
          className="booking-cta-bg"
          style={hero.background_image ? { backgroundImage: `url(${hero.background_image})` } : undefined}
        />
        <div className="booking-cta-overlay" />
        <div className="container" data-aos="zoom-in">
          <h2>Plan Your <span>Dream Event</span> Today</h2>
          <p>Make your celebrations unforgettable with Dhaka Ladies Club&apos;s premium event management services. Your perfect event begins with a single click.</p>
          <div className="hero-actions">
            <a href="#calendar-booking" className="btn">Check Availability</a>
            <a href="tel:+8801700000000" className="btn btn-outline">Contact Us</a>
          </div>
        </div>
      </section>

      {/* ── Popup ── */}
      {popupOpen && (
        <div
          id="popup"
          className={`popup active${popupClosing ? " closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popupTitle"
          onClick={(e) => { if (e.target === e.currentTarget) closePopup(); }}
        >
          <div className="popup-box">
            <div className="popup-header">
              <button type="button" className="popup-close" onClick={closePopup} aria-label="Close">✕</button>
              <div className="popup-header-content">
                <h3 id="popupTitle">Select Your Shift</h3>
                <div className="popup-date-badge">
                  <span>📅</span>
                  <span>{selectedFormattedDate}</span>
                </div>
              </div>
            </div>

            <div className="popup-body">
              <p className="popup-subtitle">Available Shifts</p>
              {popupSlots.length > 0 ? (
                <div className="slot-radio-group">
                  {popupSlots.map((slot) => {
                    const isAvailable = slot.slot_status === "available";
                    const amount = calculateAmount(slot);
                    const statusBadge = getStatusBadge(slot.slot_status);
                    const inputId = `slot_radio_${slot.slot_id}`;
                    return (
                      <div className="slot-radio-item" key={slot.slot_id}>
                        <input
                          type="radio"
                          name="slotChoice"
                          id={inputId}
                          value={slot.slot_id}
                          disabled={!isAvailable}
                          checked={String(selectedSlot?.slot_id || "") === String(slot.slot_id)}
                          onChange={() => setSelectedSlot(slot)}
                        />
                        <label htmlFor={inputId} className={`slot-radio-label${!isAvailable ? " disabled" : ""}`}>
                          <div className="slot-radio-custom" />
                          <div className="slot-info">
                            <div className="slot-name">{slot.shift_name}</div>
                            <div className="slot-time">⏰ {slot.start_time} – {slot.end_time}</div>
                            {slot.slot_status === "payment_in_progress" && (
                              <div className="slot-time" style={{ color: "#e65100" }}>
                                Expires in: {getRemainingText(slot)}
                              </div>
                            )}
                            {amount > 0 && (
                              <div className="slot-price">৳ {Number(amount).toLocaleString()}</div>
                            )}
                          </div>
                          <span className={`slot-status-badge ${statusBadge.cls}`}>{statusBadge.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="slot-radio-group">
                  <div className="popup-empty">
                    <div className="popup-empty-icon">📭</div>
                    <p>No slot data available for this date yet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="popup-footer">
              <button
                type="button"
                className={`btn popup-proceed-btn${isProceeding ? " loading" : ""}`}
                onClick={proceedWithSelected}
                disabled={!selectedSlot || isProceeding}
                style={{ opacity: selectedSlot ? 1 : 0.5, cursor: selectedSlot ? "pointer" : "not-allowed" }}
              >
                {isProceeding ? "Checking login…" : "Continue to Booking →"}
              </button>
              <button type="button" className="btn popup-close-btn" onClick={closePopup}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
              <p>{footer.description}</p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <a href="#calendar-booking">Booking Calendar</a>
              <a href="#about">About Us</a>
              <a href="#gallery">Gallery</a>
              <a href="#features">Features</a>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <p>📍 {footer.address}</p>
              <p>📞 {footer.phone}</p>
              <p>✉️ {footer.email}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{renderFooterCopyright(footer.copyright)}</p>
            <p>{footer.tagline}</p>
          </div>
        </div>
      </footer>
    </>
  );
}