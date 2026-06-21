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

  [data-aos="fade-up"] { transform: translateY(35px); }
  [data-aos="fade-right"] { transform: translateX(-35px); }
  [data-aos="fade-left"] { transform: translateX(35px); }
  [data-aos="zoom-in"] { transform: scale(0.94); }

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

  .popup {
    transition: opacity 0.28s ease;
  }

  .popup.closing {
    opacity: 0;
  }

  .fc .fc-daygrid-day {
    cursor: pointer;
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

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

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  .badge-pending {
    background: rgba(184, 134, 11, 0.12);
    color: #8f6908;
    border: 1px solid rgba(184, 134, 11, 0.28);
  }

  .slot-pending_approval {
    opacity: 0.95;
  }

  .container {
    width: 90%;
    max-width: 1200px;
    margin: auto;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--gold);
    border-radius: 10px;
  }

  nav {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
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

  .logo img:hover {
    transform: scale(1.04);
  }

  .nav-links {
    display: flex;
    gap: 8px;
    align-items: center;
  }

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
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: var(--gold);
    border-radius: 2px;
    transition: var(--transition);
  }

  .nav-links a:hover {
    color: var(--gold);
  }

  .nav-links a:hover::after {
    width: 40%;
  }

  .login-link {
    background: var(--gold);
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px rgba(184,134,11,0.25);
  }

  .login-link:hover {
    background: var(--gold-dark);
    transform: translateY(-2px);
  }

  .login-link::after {
    display: none !important;
  }

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

  .admin-login-link {
    background: #1a1a2e;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px rgba(26,26,46,0.25);
  }

  .admin-login-link:hover {
    background: #b8860b;
    transform: translateY(-2px);
  }

  .admin-login-link::after {
    display: none !important;
  }

  .nav-cta::after {
    display: none !important;
  }

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

  .logout-btn:hover {
    background: #b02a37;
    transform: translateY(-2px);
  }

  .profile-icon-link {
    width: 42px;
    height: 42px;
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

  .profile-icon-link svg {
    width: 20px;
    height: 20px;
  }

  .profile-icon-link:hover {
    background: var(--gold);
    color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(184,134,11,0.28);
  }

  .profile-icon-link::after {
    display: none !important;
  }

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
  }

  @keyframes heroZoom {
    from {
      transform: scale(1.05);
    }

    to {
      transform: scale(1.12);
    }
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(184,134,11,0.25) 50%, rgba(0,0,0,0.65) 100%);
  }

  .hero-particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(212,160,23,0.6);
    border-radius: 50%;
    animation: particleFloat linear infinite;
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }

    10% {
      opacity: 1;
    }

    90% {
      opacity: 1;
    }

    100% {
      transform: translateY(-20px) rotate(720deg);
      opacity: 0;
    }
  }

  .hero-content {
    position: relative;
    z-index: 2;
    padding: 20px;
    max-width: 900px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(184,134,11,0.25);
    border: 1px solid rgba(212,160,23,0.5);
    color: #f0d080;
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 28px;
    backdrop-filter: blur(10px);
    animation: fadeSlideDown 1s ease both;
  }

  .hero-badge::before {
    content: '✦';
    font-size: 10px;
    animation: spin 3s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeSlideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hero-content h1 {
    font-size: clamp(42px, 8vw, 76px);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 24px;
    animation: fadeSlideUp 1s ease 0.2s both;
  }

  .hero-content h1 span {
    background: linear-gradient(135deg, #f0d080, #b8860b, #d4a017);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @keyframes fadeSlideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
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
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
    opacity: 0;
    transition: var(--transition);
  }

  .btn:hover::before {
    opacity: 1;
  }

  .btn:hover {
    background: var(--gold-dark);
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(184,134,11,0.45);
  }

  .btn-outline {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.8);
    color: white;
  }

  .btn-outline:hover {
    background: white;
    color: var(--gold);
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  }

  .hero-scroll {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    animation: bounceDown 2s ease infinite;
    cursor: pointer;
  }

  .scroll-indicator {
    width: 32px;
    height: 52px;
    border: 2px solid rgba(255,255,255,0.6);
    border-radius: 20px;
    display: flex;
    justify-content: center;
    padding-top: 8px;
  }

  .scroll-dot {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    animation: scrollDot 1.5s ease infinite;
  }

  @keyframes scrollDot {
    0% {
      transform: translateY(0);
      opacity: 1;
    }

    100% {
      transform: translateY(18px);
      opacity: 0;
    }
  }

  @keyframes bounceDown {
    0%, 100% {
      transform: translateX(-50%) translateY(0);
    }

    50% {
      transform: translateX(-50%) translateY(8px);
    }
  }

  .stats-strip {
    background: white;
    padding: 0;
    box-shadow: var(--shadow-md);
    position: relative;
    z-index: 10;
  }

  .stats-inner {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-item {
    padding: 35px 20px;
    text-align: center;
    border-right: 1px solid var(--gold-border);
    transition: var(--transition);
    cursor: default;
  }

  .stat-item:last-child {
    border-right: none;
  }

  .stat-item:hover {
    background: var(--gold-pale);
  }

  .stat-number {
    font-size: 36px;
    font-weight: 800;
    color: var(--gold);
    display: block;
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  section {
    padding: 110px 0;
  }

  .section-title {
    text-align: center;
    margin-bottom: 65px;
  }

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
    width: 30px;
    height: 1px;
    background: var(--gold);
  }

  .section-eyebrow::before {
    right: 100%;
    margin-right: -20px;
  }

  .section-eyebrow::after {
    left: 100%;
    margin-left: -20px;
  }

  .section-title h2 {
    font-size: clamp(30px, 5vw, 46px);
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

  .calendar-section {
    background: linear-gradient(180deg, #fdf6e3 0%, var(--white) 100%);
  }

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

  #calendar .fc {
    width: 100% !important;
  }

  #calendar .fc-view-harness,
  #calendar .fc-view,
  #calendar .fc-scrollgrid,
  #calendar .fc-daygrid,
  #calendar .fc-daygrid-body,
  #calendar .fc-daygrid-body table,
  #calendar .fc-col-header,
  #calendar .fc-scrollgrid-sync-table {
    width: 100% !important;
  }

  #calendar table {
    table-layout: fixed !important;
  }

  .fc-toolbar-title {
    font-size: 26px !important;
    color: var(--text) !important;
    font-weight: 800 !important;
    font-family: 'Poppins', sans-serif !important;
  }

  .fc-button-primary {
    background: var(--gold) !important;
    border-color: var(--gold) !important;
    font-family: 'Poppins', sans-serif !important;
    font-weight: 600 !important;
    border-radius: 10px !important;
    padding: 8px 16px !important;
    transition: var(--transition) !important;
  }

  .fc-button-primary:hover {
    background: var(--gold-dark) !important;
    border-color: var(--gold-dark) !important;
    transform: translateY(-1px) !important;
  }

  .fc-button-primary:not(:disabled).fc-button-active {
    background: var(--gold-dark) !important;
    border-color: var(--gold-dark) !important;
  }

  .fc-col-header-cell {
    background: var(--gold-pale) !important;
    color: var(--gold-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
    padding: 12px 0 !important;
  }

  .fc .fc-daygrid-day-frame {
    min-height: 110px;
  }

  .fc .fc-daygrid-event {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 8px !important;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .fc .fc-daygrid-event:hover {
    transform: scale(1.02);
  }

  .fc .fc-daygrid-day-number {
    font-size: 16px;
    font-weight: 600;
    padding: 8px;
    color: var(--text);
  }

  .fc .fc-daygrid-day:hover .fc-daygrid-day-number {
    color: var(--gold);
  }

  .fc .fc-daygrid-day.fc-day-today {
    background: rgba(184,134,11,0.06) !important;
  }

  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    background: var(--gold);
    color: white;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar-legend {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .legend-dot {
    width: 14px;
    height: 14px;
    border-radius: 4px;
  }

  .about-section {
    background: var(--bg);
  }

  .about-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 60px;
    align-items: center;
  }

  .about-img-wrap {
    position: relative;
  }

  .about-img-wrap img {
    width: 100%;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: block;
    position: relative;
    z-index: 2;
  }

  .about-img-deco {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-lg);
    border: 3px solid var(--gold-border);
    top: 18px;
    left: 18px;
    z-index: 1;
  }

  .about-img-badge {
    position: absolute;
    bottom: -20px;
    right: -20px;
    background: var(--gold);
    color: white;
    width: 100px;
    height: 100px;
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

  @keyframes rotateBadge {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  .about-img-badge span {
    animation: rotateBadgeInner 15s linear infinite reverse;
  }

  @keyframes rotateBadgeInner {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  .about-text {
    padding-left: 10px;
  }

  .about-text h3 {
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 800;
    color: var(--text);
    margin-bottom: 22px;
    line-height: 1.2;
  }

  .about-text h3 span {
    color: var(--gold);
  }

  .about-text p {
    color: var(--text-muted);
    line-height: 1.95;
    margin-bottom: 20px;
    font-size: 15.5px;
  }

  .about-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 28px;
  }

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
    width: 24px;
    height: 24px;
    background: var(--gold);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  .gallery-section {
    background: white;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto auto;
    gap: 18px;
  }

  .gallery-item {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius);
    cursor: pointer;
  }

  .gallery-item:first-child {
    grid-column: span 2;
    grid-row: span 2;
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
    min-height: 220px;
  }

  .gallery-item:first-child img {
    min-height: 460px;
  }

  .gallery-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(184,134,11,0.7) 0%, rgba(0,0,0,0.4) 100%);
    opacity: 0;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-overlay-icon {
    width: 56px;
    height: 56px;
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

  .gallery-item:hover img {
    transform: scale(1.08);
  }

  .gallery-item:hover .gallery-overlay {
    opacity: 1;
  }

  .gallery-item:hover .gallery-overlay-icon {
    transform: scale(1) rotate(0deg);
  }

  .features-section {
    background: var(--bg);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 28px;
  }

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
    background: linear-gradient(135deg, var(--gold-pale) 0%, white 100%);
    opacity: 0;
    transition: var(--transition);
  }

  .feature-card:hover {
    transform: translateY(-12px);
    box-shadow: var(--shadow-lg);
    border-color: var(--gold-border);
  }

  .feature-card:hover::before {
    opacity: 1;
  }

  .feature-card > * {
    position: relative;
    z-index: 1;
  }

  .feature-icon-wrap {
    width: 80px;
    height: 80px;
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

  .feature-card:hover .feature-icon-wrap {
    background: var(--gold);
    border-color: var(--gold);
    transform: rotateY(360deg);
  }

  .feature-card h3 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 14px;
  }

  .feature-card p {
    color: var(--text-muted);
    line-height: 1.8;
    font-size: 15px;
  }

  .booking-cta {
    position: relative;
    overflow: hidden;
  }

  .booking-cta-bg {
    position: absolute;
    inset: 0;
    background: url('/assets/img/BG-01.jpeg') center/cover no-repeat;
  }

  .booking-cta-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.78) 0%, rgba(184,134,11,0.35) 50%, rgba(0,0,0,0.78) 100%);
  }

  .booking-cta .container {
    position: relative;
    z-index: 2;
    text-align: center;
  }

  .booking-cta h2 {
    font-size: clamp(32px, 6vw, 58px);
    font-weight: 800;
    color: white;
    margin-bottom: 20px;
    line-height: 1.15;
  }

  .booking-cta h2 span {
    color: #f0d080;
  }

  .booking-cta p {
    max-width: 650px;
    margin: 0 auto 40px;
    line-height: 1.9;
    color: rgba(255,255,255,0.82);
    font-size: 17px;
  }

  footer {
    background: #0f0f1a;
    color: white;
    padding: 70px 0 40px;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 50px;
    margin-bottom: 50px;
  }

  .footer-brand img {
    height: 34px;
    margin-bottom: 18px;
    filter: brightness(10);
  }

  .footer-brand p {
    color: #9ca3af;
    line-height: 1.8;
    font-size: 14px;
    max-width: 280px;
  }

  .footer-col h4 {
    color: var(--gold);
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }

  .footer-col a,
  .footer-col p {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.7;
    margin-bottom: 8px;
    transition: var(--transition);
  }

  .footer-col a:hover {
    color: var(--gold);
    padding-left: 4px;
  }

  .footer-bottom {
    border-top: 1px solid #1f2937;
    padding-top: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .footer-bottom p {
    color: #6b7280;
    font-size: 13px;
  }

  .footer-gold {
    color: var(--gold);
  }

  .float {
    animation: float 5s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-18px);
    }
  }

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

  @keyframes popupFadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  .popup.active {
    display: flex;
  }

  .popup-box {
    background: white;
    border-radius: 28px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 30px 80px rgba(0,0,0,0.25);
    animation: popupSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  @keyframes popupSlideUp {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.96);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .popup-header {
    background: linear-gradient(135deg, var(--gold) 0%, #d4a017 100%);
    padding: 28px 30px;
    border-radius: 28px 28px 0 0;
    position: relative;
    overflow: hidden;
  }

  .popup-header::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 160px;
    height: 160px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
  }

  .popup-header::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -30px;
    width: 140px;
    height: 140px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
  }

  .popup-header-content {
    position: relative;
    z-index: 1;
  }

  .popup-header h3 {
    font-size: 22px;
    font-weight: 800;
    color: white;
    margin-bottom: 6px;
  }

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
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
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

  .popup-close:hover {
    background: rgba(255,255,255,0.35);
    transform: rotate(90deg);
  }

  .popup-body {
    padding: 28px 30px;
  }

  .popup-subtitle {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-muted);
    margin-bottom: 18px;
  }

  .slot-radio-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .slot-radio-item {
    position: relative;
  }

  .slot-radio-item input[type="radio"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

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

  .slot-radio-item input[type="radio"]:checked + .slot-radio-label {
    border-color: var(--gold);
    background: var(--gold-pale);
  }

  .slot-radio-label:hover {
    border-color: var(--gold-border);
    background: var(--gold-pale);
  }

  .slot-radio-label.disabled {
    cursor: not-allowed;
    opacity: 0.58;
    pointer-events: none;
  }

  .slot-radio-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: var(--transition);
  }

  .slot-radio-item input[type="radio"]:checked + .slot-radio-label .slot-radio-custom {
    border-color: var(--gold);
    background: var(--gold);
  }

  .slot-radio-item input[type="radio"]:checked + .slot-radio-label .slot-radio-custom::after {
    content: '';
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
  }

  .slot-info {
    flex: 1;
  }

  .slot-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 3px;
  }

  .slot-time {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .slot-status-badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .badge-available {
    background: #dcfce7;
    color: #166534;
  }

  .badge-booked {
    background: #fee2e2;
    color: #991b1b;
  }

  .badge-blocked {
    background: #f1f5f9;
    color: #475569;
  }

  .badge-progress {
    background: #fff3e0;
    color: #e65100;
  }

  .slot-price {
    font-size: 14px;
    font-weight: 700;
    color: var(--gold);
    margin-top: 4px;
  }

  .popup-footer {
    padding: 0 30px 28px;
    display: flex;
    gap: 12px;
    flex-direction: column;
  }

  .popup-proceed-btn {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 700;
    border-radius: 14px;
  }

  .popup-close-btn {
    background: #f1f5f9;
    color: var(--text-muted);
  }

  .popup-close-btn:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
    box-shadow: none;
  }

  .popup-empty {
    text-align: center;
    padding: 20px 0;
    color: var(--text-muted);
    font-size: 15px;
  }

  .popup-empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .btn.loading {
    pointer-events: none;
    opacity: 0.88;
    padding-right: 52px;
  }

  .btn.loading::after {
    content: '';
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.7);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @media(max-width: 1024px) {
    .gallery-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
    }

    .gallery-item:first-child {
      grid-column: span 2;
      grid-row: span 1;
    }

    .footer-grid {
      grid-template-columns: 1fr 1fr;
    }

    .stats-inner {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media(max-width: 768px) {
    section {
      padding: 80px 0;
    }

    .nav-links {
      display: none;
    }

    .hero-content h1 {
      font-size: 40px;
    }

    .gallery-grid {
      grid-template-columns: 1fr 1fr;
    }

    .gallery-item:first-child {
      grid-column: span 2;
    }

    .footer-grid {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }

    .about-img-badge {
      width: 80px;
      height: 80px;
      font-size: 11px;
      right: -10px;
      bottom: -10px;
    }

    .stats-inner {
      grid-template-columns: repeat(2, 1fr);
    }

    #calendar {
      padding: 15px;
      overflow-x: auto;
    }

    #calendar .fc {
      min-width: 680px;
    }

    .popup-box {
      border-radius: 20px;
    }

    .popup-header {
      padding: 22px 20px;
      border-radius: 20px 20px 0 0;
    }

    .popup-body {
      padding: 20px;
    }

    .popup-footer {
      padding: 0 20px 20px;
    }
  }

  @media(max-width: 480px) {
    .gallery-grid {
      grid-template-columns: 1fr;
    }

    .gallery-item:first-child {
      grid-column: span 1;
    }

    .about-wrapper {
      grid-template-columns: 1fr;
    }

    .stats-inner {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

const galleryImages = [
  {
    src: "https://scontent.fdac199-1.fna.fbcdn.net/v/t39.30808-6/695300615_1396656175832752_4020711769413914413_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHQ0Wb3sauW3CBcXakUiEZ1RoUrnHaMrlFGhSucdoyuUVmvss_xebs2uq-g2vByHFmNpZ_u0dh5AHmKaGHrW62M&_nc_ohc=v80hq3zEa1QQ7kNvwHDMwnz&_nc_oc=AdptbtIDLqIPpfdAdt_SjCowtNeDfkIxm8hAYe2AVKDcv24mtjHywsjrfQaLKR_K2u4&_nc_zt=23&_nc_ht=scontent.fdac199-1.fna&_nc_gid=rC8ph6y9OLrDdnb63tK1qA&_nc_ss=7b2a8&oh=00_Af9hPC_xB7Iw1Ypyuhyd-Z9og27XD4Qb-ap8nlby5wqQEA&oe=6A266D91",
    alt: "Wedding Decoration",
  },
  {
    src: "https://scontent.fdac199-1.fna.fbcdn.net/v/t39.30808-6/577713139_1248987840599587_1364093469034454110_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGpW3KQ6EoZt1h70UIdZXLltLPnB6oeD3q0s-cHqh4PeggJ3nuapiKj-o-afOLdVzRxx9sYcP1_o0G7uxfAUvGj&_nc_ohc=L5q2aK7w_GgQ7kNvwGZQHDx&_nc_oc=AdpweNHsWNeTRUgw4bM3M6cs-u9u9OBu1kZ9qbVmEtoWmCllNBondbo38f_kVWEh8gA&_nc_zt=23&_nc_ht=scontent.fdac199-1.fna&_nc_gid=XRVLrZGPdG8L16SgcCZrNw&_nc_ss=7b2a8&oh=00_Af9igwdpnMg3zmSAxQdrFbXbNW4RbSr6o6oSntGnIPKtQw&oe=6A265903",
    alt: "Reception Hall",
  },
  {
    src: "https://scontent.fdac199-1.fna.fbcdn.net/v/t39.30808-6/660370282_1365902858908084_7552683890379266601_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFOWSFPSY5wC5L7lggAtJEzd-bg8rgUR7935uDyuBRHv5Lf7hhNHJMUeLwa4POZit3qE3G7hJGRm73VbJs6J1iI&_nc_ohc=mjraAfHKBOQQ7kNvwGWlRBR&_nc_oc=AdqvF_pS4SuQNssX7acavmhO0PQA4fjl2jNf5AU0HrO1yExW5jU8bJDO6KrmxnD4rbU&_nc_zt=23&_nc_ht=scontent.fdac199-1.fna&_nc_gid=s1JYkxBpn1SxXLU-HapmzQ&_nc_ss=7b2a8&oh=00_Af_PNz55KlVRj8b_WmOW7aIVCIP5xf7_Xh1rL286Zf7V3g&oe=6A267AC2",
    alt: "Event Setup",
  },
  {
    src: "https://scontent.fdac199-1.fna.fbcdn.net/v/t39.30808-6/660428518_1367623672069336_956385337566117623_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHHGIy6A9nY-2wMUsF5_yftHRTqvVGP3zIdFOq9UY_fMheTE6WVmW0f35yzkeDG8D_8l-wDamsB1eoUx2axhB6O&_nc_ohc=RpjzZmKP-cgQ7kNvwGwM0hx&_nc_oc=AdoOXiVCsW-F6c6rqdtfKnmotDCFss62hdR5i1xP3G2RtXV13wI2ZBhU0UWBi4kFCfI&_nc_zt=23&_nc_ht=scontent.fdac199-1.fna&_nc_gid=e79GhRL5C5R-Zk-0aSYXQA&_nc_ss=7b2a8&oh=00_Af8Az6Snt3b1HS_XFdUjjJqfYyRpyk6heFbUGBZeY63bwA&oe=6A264AB1",
    alt: "Party Hall",
  },
  {
    src: "https://scontent.fdac199-1.fna.fbcdn.net/v/t39.30808-6/672672353_1379844067513963_8942882148565501199_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGeWONgf3CT9Dt4alZnP5Pp8jOLFj3hwe_yM4sWPeHB7zhS9O5Y9lTfIOv5Nxb4zYAihjJswOeyxbl02iPn8uMW&_nc_ohc=ah9hvf5ahxUQ7kNvwGZbwho&_nc_oc=AdpWnOK5JdmdOOEJGcEAZmoNzH95YSg0j7tTeAVJbiwcQGicg7czEFP0n33eHJKyvmk&_nc_zt=23&_nc_ht=scontent.fdac199-1.fna&_nc_gid=a1MbfPJtkF_MPNZKr1FJuw&_nc_ss=7b2a8&oh=00_Af867iEsVO_tkcZhRheZbG9ZcyJCWeZTN8O2Nbgow4eS-g&oe=6A267BB5",
    alt: "Event Flowers",
  },
];

const stats = [
  { count: 500, label: "Events Hosted", delay: "" },
  { count: 1200, label: "Happy Families", delay: "100" },
  { count: 20, label: "Years Experience", delay: "200" },
  { count: 98, label: "% Client Satisfaction", delay: "300" },
];

const aboutFeatures = [
  "Premium Decorations",
  "Expert Catering",
  "State-of-Art AV",
  "Valet Parking",
  "Dedicated Team",
  "Custom Packages",
];

const featureCards = [
  {
    icon: "📅",
    title: "Live Calendar",
    text: "Browse the full year calendar and view available or booked shifts instantly with real-time updates.",
    delay: "",
  },
  {
    icon: "📝",
    title: "Online Booking",
    text: "Book event halls directly from the website with instant reservation requests and confirmation.",
    delay: "150",
  },
  {
    icon: "💳",
    title: "Secure Payment",
    text: "Easy and secure online payment system with encrypted transactions for booking confirmations.",
    delay: "300",
  },
  {
    icon: "🎉",
    title: "Event Management",
    text: "Full-service event coordination by our expert team to make your celebration flawless.",
    delay: "450",
  },
  {
    icon: "🌟",
    title: "Premium Décor",
    text: "Stunning decoration packages crafted by professional designers for every occasion.",
    delay: "500",
  },
  {
    icon: "🔔",
    title: "Instant Alerts",
    text: "Get real-time notifications and reminders for your upcoming events and booking updates.",
    delay: "550",
  },
];

const calendarColorMap = {
  available: "#198754",
  booked: "#dc3545",
  blocked: "#6c757d",
  payment_in_progress: "#fd7e14",
  pending_approval: "#b8860b",
};

function saveJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function readJson(key) {
  try {
    const rawValue = sessionStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function removeJson(key) {
  sessionStorage.removeItem(key);
}

function readLocalJson(key) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
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
    ) {
      sessionStorage.removeItem(key);
    }
  });
}
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
  if (slot.slot_status === "payment_in_progress") {
    return `${slot.shift_name} · In Progress ${getRemainingText(slot)}`;
  }

  if (slot.slot_status === "pending_approval") {
    return `${slot.shift_name} · Pending Approval`;
  }

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

function normalizeApiData(payload) {
  return payload?.data !== undefined ? payload.data : payload;
}

function getCustomerHeaderObject(token) {
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

async function requestApi(endpoint, options = {}) {
  if (typeof apiRequest === "function") {
    return apiRequest(endpoint, options);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "API request failed");
  }

  return payload;
}

export default function HomePage() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const slotsByDateRef = useRef({});
  const bookingContextRef = useRef(null);
  const statsRef = useRef(null);
  const popupCloseTimerRef = useRef(null);

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
  const [counterValues, setCounterValues] = useState({
    500: 0,
    1200: 0,
    20: 0,
    98: 0,
  });
  const [, setClockTick] = useState(0);

  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, index) => {
      const size = Math.random() * 6 + 2;

      return {
        id: index,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 15 + 10}s`,
          animationDelay: `${Math.random() * 10}s`,
          opacity: Math.random() * 0.6 + 0.2,
        },
      };
    });
  }, []);

  const selectedFormattedDate = useMemo(() => {
    if (!popupDate) return "Loading...";

    return new Date(`${popupDate}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [popupDate]);

  const forceCalendarResize = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    calendarApi.updateSize();

    requestAnimationFrame(() => {
      calendarRef.current?.getApi()?.updateSize();
    });

    setTimeout(() => {
      calendarRef.current?.getApi()?.updateSize();
    }, 100);

    setTimeout(() => {
      calendarRef.current?.getApi()?.updateSize();
    }, 400);
  }, []);

  const refreshNavbarAuthState = useCallback(async () => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const localUser = readLocalJson(CUSTOMER_USER_KEY);

    if (!token) {
      setIsCustomerLoggedIn(false);
      return null;
    }

    let user = localUser;

    try {
      const payload = await requestApi("/auth/panel", {
        method: "GET",
        headers: getCustomerHeaderObject(token),
      });

      const data = normalizeApiData(payload);
      user = data?.user || data?.customer || data || localUser;

      if (user && typeof user === "object") {
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
      }
    } catch {
      user = localUser;
    }

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

      if (user && typeof user === "object") {
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
      }

      return user || localUser;
    } catch {
      return localUser;
    }
  }, []);

  const releaseActiveHold = useCallback(async () => {
    const hold = readJson(ACTIVE_HOLD_KEY);

    if (!hold?.booking_id || !hold?.hold_token) return false;

    try {
      await requestApi("/booking-holds/release", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: hold.booking_id,
          hold_token: hold.hold_token,
        }),
      });

      removeJson(ACTIVE_HOLD_KEY);
      return true;
    } catch {
      removeJson(ACTIVE_HOLD_KEY);
      return false;
    }
  }, []);

  const updateCalendarCountdowns = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    let shouldRefetch = false;

    calendarApi.getEvents().forEach((event) => {
      const slot = event.extendedProps?.slot;

      if (!slot || slot.slot_status !== "payment_in_progress") return;

      const expiryTime = getSlotExpiryTime(slot);

      if (expiryTime && expiryTime <= Date.now()) {
        shouldRefetch = true;
        return;
      }

      event.setProp("title", getCalendarSlotTitle(slot));
    });

    if (shouldRefetch) {
      calendarApi.refetchEvents();
    }
  }, []);

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

      const payload = await requestApi(`/calendar-slots?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const slots = normalizeApiData(payload) || [];

      const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
        acc[slot.slot_date].push(slot);
        return acc;
      }, {});

      slotsByDateRef.current = groupedSlots;
      successCallback(slots.map(buildSlotEvent));
    } catch (error) {
      failureCallback(error);
    }
  }, []);

  const closePopup = useCallback(() => {
    setPopupClosing(true);

    if (popupCloseTimerRef.current) {
      clearTimeout(popupCloseTimerRef.current);
    }

    popupCloseTimerRef.current = setTimeout(() => {
      setPopupOpen(false);
      setPopupClosing(false);
      setPopupDate("");
      setPopupSlots([]);
      setSelectedSlot(null);
    }, 280);
  }, []);

  const openPopup = useCallback((date, slots) => {
    if (popupCloseTimerRef.current) {
      clearTimeout(popupCloseTimerRef.current);
    }

    setPopupDate(date);
    setPopupSlots(slots || []);
    setSelectedSlot(null);
    setPopupClosing(false);
    setPopupOpen(true);
  }, []);

  const openDateSlots = useCallback(
    (dateStr) => {
      const slots = slotsByDateRef.current[dateStr] || [];
      openPopup(dateStr, slots);
    },
    [openPopup]
  );

  const handleDateClick = useCallback(
    (info) => {
      info.jsEvent.preventDefault();
      openDateSlots(info.dateStr);
    },
    [openDateSlots]
  );

  const handleEventClick = useCallback(
    (info) => {
      const slot = info.event.extendedProps?.slot;
      if (!slot) return;

      openPopup(slot.slot_date, slotsByDateRef.current[slot.slot_date] || [slot]);
    },
    [openPopup]
  );

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

    if (!user) {
      setIsProceeding(false);
      navigate("/login?redirect=booking");
      return;
    }

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

const handleLogout = useCallback(async () => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

  try {
    if (token) {
      await requestApi("/auth/logout", {
        method: "POST",
        headers: getCustomerHeaderObject(token),
        body: JSON.stringify({}),
      });
    }
  } catch {
    console.warn("Logout API failed, clearing local session anyway.");
  }

  // Release active hold before clearing sessionStorage
  await releaseActiveHold();

  // Clear customer auth
  clearCustomerAuthSession();

  // Clear selected slot, active hold, and all booking drafts
  clearAllBookingSessionData();

  setIsCustomerLoggedIn(false);

  navigate("/", { replace: true });
}, [navigate, releaseActiveHold]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-aos]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("aos-animate");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [calendarReady, popupOpen]);

  useEffect(() => {
    refreshNavbarAuthState();

    let mounted = true;

    loadBookingContext()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (mounted) setCalendarReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [loadBookingContext, refreshNavbarAuthState]);

  useEffect(() => {
    const resizeHandler = () => forceCalendarResize();

    window.addEventListener("load", resizeHandler);
    window.addEventListener("resize", resizeHandler);

    const countdownTimerId = setInterval(() => {
      updateCalendarCountdowns();
      setClockTick((value) => value + 1);
    }, 1000);

    const refreshTimerId = setInterval(() => {
      const calendarApi = calendarRef.current?.getApi();

      if (calendarApi) {
        calendarApi.refetchEvents();
        forceCalendarResize();
      }
    }, 15000);

    return () => {
      window.removeEventListener("load", resizeHandler);
      window.removeEventListener("resize", resizeHandler);
      clearInterval(countdownTimerId);
      clearInterval(refreshTimerId);

      if (popupCloseTimerRef.current) {
        clearTimeout(popupCloseTimerRef.current);
      }
    };
  }, [forceCalendarResize, updateCalendarCountdowns]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && popupOpen) {
        closePopup();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closePopup, popupOpen]);

  useEffect(() => {
    if (counterStarted) return;
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) return;

        setCounterStarted(true);

        const duration = 1500;
        const frames = 60;
        const intervalMs = duration / frames;
        let frame = 0;

        const timer = setInterval(() => {
          frame += 1;

          setCounterValues({
            500: Math.min(500, Math.floor((500 / frames) * frame)),
            1200: Math.min(1200, Math.floor((1200 / frames) * frame)),
            20: Math.min(20, Math.floor((20 / frames) * frame)),
            98: Math.min(98, Math.floor((98 / frames) * frame)),
          });

          if (frame >= frames) {
            clearInterval(timer);
          }
        }, intervalMs);

        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(statsRef.current);

    return () => observer.disconnect();
  }, [counterStarted]);

  return (
    <>
      <style>{homePageStyles}</style>

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
              <a href="#calendar-booking" className="btn nav-cta">
                Book Now
              </a>

              {isCustomerLoggedIn ? (
                <>
                  <Link
                    to="/customer-panel"
                    className="profile-icon-link"
                    title="My Profile"
                    aria-label="My Profile"
                    style={{ display: "inline-flex" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>

                  <button type="button" className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="login-link">
                    Login
                  </Link>
                  <Link to="/admin-login" className="admin-login-link">
                    Admin Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-bg" />
        <div className="hero-overlay" />

        <div className="hero-particles" id="heroParticles">
          {particles.map((particle) => (
            <div key={particle.id} className="particle" style={particle.style} />
          ))}
        </div>

        <div className="hero-content">
          <h1>
            Elegant Events
            <br />
            <span>Beautiful Memories</span>
          </h1>

          <p>
            Dhaka Ladies Club is a luxurious convention hall offering premium event spaces for weddings,
            receptions, conferences, and unforgettable celebrations.
          </p>

          <div className="hero-actions">
            <a href="#calendar-booking" className="btn">
              Book Your Event
            </a>
            <a href="#about" className="btn btn-outline">
              Discover More
            </a>
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

      <section className="calendar-section" id="calendar-booking">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">Live Availability</span>
            <h2>Booking Calendar</h2>
            <p>
              Browse available shifts and reserve your preferred date. Click any date or event to view shift
              availability and proceed with booking.
            </p>
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
                windowResizeDelay={100}
                expandRows
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,listYear",
                }}
                buttonText={{
                  today: "Today",
                  month: "Month",
                  listYear: "Year View",
                }}
                events={loadSlots}
                viewDidMount={forceCalendarResize}
                datesSet={forceCalendarResize}
                eventsSet={forceCalendarResize}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
              />
            ) : (
              <div className="calendar-loading">Loading booking calendar...</div>
            )}
          </div>

          <div className="calendar-legend" data-aos="fade-up">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#198754" }} />
              Available
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#dc3545" }} />
              Booked
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#fd7e14" }} />
              Booking In Progress
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#b8860b" }} />
              Pending Approval
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#6c757d" }} />
              Blocked
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">Our Story</span>
            <h2>About Dhaka Ladies Club</h2>
            <p>
              A prestigious event destination in Dhaka designed for elegant weddings, corporate events, and premium
              celebrations.
            </p>
          </div>

          <div className="about-wrapper">
            <div className="about-img-wrap float" data-aos="fade-right">
              <div className="about-img-deco" />
              <img src="/assets/img/About.jpg" alt="About Dhaka Ladies Club" />

              <div className="about-img-badge">
                <span>
                  20+
                  <br />
                  Years
                  <br />
                  Excellence
                </span>
              </div>
            </div>

            <div className="about-text" data-aos="fade-left">
              <span className="section-eyebrow" style={{ textAlign: "left" }}>
                Creating Experiences
              </span>

              <h3>
                Where Every Event Becomes <span>Extraordinary</span>
              </h3>

              <p>
                Dhaka Ladies Club combines elegance, luxury, and professionalism to deliver exceptional event
                experiences for every guest. Our dedicated team ensures that every detail is meticulously planned and
                executed.
              </p>

              <p>
                From stunning decoration arrangements to premium hospitality, every celebration is carefully designed to
                create lifelong memories that you and your guests will cherish forever.
              </p>

              <div className="about-features">
                {aboutFeatures.map((feature) => (
                  <div className="about-feature-item" key={feature}>
                    {feature}
                  </div>
                ))}
              </div>

              <br />

              <a href="#calendar-booking" className="btn" style={{ marginTop: "10px" }}>
                Book a Visit
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="section-title" data-aos="fade-up">
            <span className="section-eyebrow">Visual Gallery</span>
            <h2>Decoration Gallery</h2>
            <p>Explore stunning decoration concepts and luxurious setups from our most celebrated events.</p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <div
                className="gallery-item"
                data-aos="zoom-in"
                data-aos-delay={index === 0 ? undefined : String(index * 50 + 50)}
                key={image.src}
              >
                <img src={image.src} alt={image.alt} />
                <div className="gallery-overlay">
                  <div className="gallery-overlay-icon">✦</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="booking-cta">
        <div className="booking-cta-bg" />
        <div className="booking-cta-overlay" />

        <div className="container" data-aos="zoom-in">
          <h2>
            Plan Your <span>Dream Event</span> Today
          </h2>

          <p>
            Make your celebrations unforgettable with Dhaka Ladies Club&apos;s premium event management services. Your
            perfect event begins with a single click.
          </p>

          <div className="hero-actions">
            <a href="#calendar-booking" className="btn">
              Check Availability
            </a>
            <a href="tel:+8801700000000" className="btn btn-outline">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {popupOpen && (
        <div
          id="popup"
          className={`popup active${popupClosing ? " closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popupTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget) closePopup();
          }}
        >
          <div className="popup-box">
            <div className="popup-header">
              <button type="button" className="popup-close" onClick={closePopup} aria-label="Close">
                ✕
              </button>

              <div className="popup-header-content">
                <h3 id="popupTitle">Select Your Shift</h3>
                <div className="popup-date-badge">
                  <span>📅</span>
                  <span id="selectedDateText">{selectedFormattedDate}</span>
                </div>
              </div>
            </div>

            <div className="popup-body">
              <p className="popup-subtitle">Available Shifts</p>

              {popupSlots.length > 0 ? (
                <div id="slotButtons" className="slot-radio-group">
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

                        <label
                          htmlFor={inputId}
                          className={`slot-radio-label${!isAvailable ? " disabled" : ""}`}
                        >
                          <div className="slot-radio-custom" />

                          <div className="slot-info">
                            <div className="slot-name">{slot.shift_name}</div>

                            <div className="slot-time">
                              ⏰ {slot.start_time} – {slot.end_time}
                            </div>

                            {slot.slot_status === "payment_in_progress" && (
                              <div className="slot-time" style={{ color: "#e65100" }}>
                                Expires in: {getRemainingText(slot)}
                              </div>
                            )}

                            {amount > 0 && (
                              <div className="slot-price">৳ {Number(amount).toLocaleString()}</div>
                            )}
                          </div>

                          <span className={`slot-status-badge ${statusBadge.cls}`}>
                            {statusBadge.label}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div id="slotButtons" className="slot-radio-group">
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
                style={{
                  opacity: selectedSlot ? 1 : 0.5,
                  cursor: selectedSlot ? "pointer" : "not-allowed",
                }}
              >
                {isProceeding ? "Checking login..." : "Continue to Booking →"}
              </button>

              <button type="button" className="btn popup-close-btn" onClick={closePopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
              <p>
                A prestigious event destination in Dhaka delivering exceptional experiences for weddings, corporate
                events, and premium celebrations since 2005.
              </p>
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
              <p>📍 Dhaka, Bangladesh</p>
              <p>📞 +880 1700-000000</p>
              <p>✉️ info@dhakaladiescub.com</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © 2026 <span className="footer-gold">Dhaka Ladies Club</span>. All Rights Reserved.
            </p>
            <p>Premium Convention &amp; Party Venue in Dhaka</p>
          </div>
        </div>
      </footer>
    </>
  );
}