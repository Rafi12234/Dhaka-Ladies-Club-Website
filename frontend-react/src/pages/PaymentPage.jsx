import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SELECTED_SLOT_KEY = "dlc_selected_slot_v2";
const BOOKING_DRAFT_KEY = "dlc_booking_draft_v2";
const ACTIVE_HOLD_KEY = "dlc_active_hold_v2";
const PENDING_CONFIRMATION_KEY = "dlc_booking_pending_v1";

const paymentPageStyles = String.raw`
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
    --gold-pale: #fdf6e3;
    --gold-border: #ead7a6;
    --bg: #faf7f2;
    --white: #ffffff;
    --text: #1a1a2e;
    --text-muted: #6b7280;
    --success: #198754;
    --danger: #dc3545;
    --shadow-sm: 0 2px 10px rgba(0,0,0,0.06);
    --shadow-md: 0 8px 30px rgba(0,0,0,0.10);
    --shadow-lg: 0 20px 60px rgba(0,0,0,0.14);
    --radius: 16px;
    --radius-lg: 24px;
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

  [data-aos] {
    opacity: 0;
    transition-property: opacity, transform;
    transition-duration: 900ms;
    transition-timing-function: ease;
  }

  [data-aos-delay="150"] {
    transition-delay: 150ms;
  }

  [data-aos="fade-up"] {
    transform: translateY(35px);
  }

  [data-aos="fade-right"] {
    transform: translateX(-35px);
  }

  [data-aos="fade-left"] {
    transform: translateX(35px);
  }

  [data-aos].aos-animate {
    opacity: 1;
    transform: none;
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
    background: rgba(255,255,255,0.88);
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

  .nav-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    color: var(--gold-dark);
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: 600;
    transition: var(--transition);
  }

  .nav-back:hover {
    background: var(--gold);
    color: white;
    border-color: var(--gold);
    transform: translateX(-3px);
  }

  .page-hero {
    min-height: 52vh;
    padding-top: 90px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    text-align: center;
    color: white;
  }

  .page-hero-bg {
    position: absolute;
    inset: 0;
    background: url('/assets/img/BG-01.jpeg') center/cover no-repeat;
    transform: scale(1.06);
    animation: heroZoom 18s ease-in-out infinite alternate;
  }

  @keyframes heroZoom {
    from {
      transform: scale(1.06);
    }

    to {
      transform: scale(1.12);
    }
  }

  .page-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(0,0,0,0.72) 0%,
      rgba(184,134,11,0.28) 50%,
      rgba(0,0,0,0.72) 100%
    );
  }

  .page-hero .container {
    position: relative;
    z-index: 2;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(184,134,11,0.22);
    border: 1px solid rgba(212,160,23,0.45);
    color: #f0d080;
    padding: 7px 20px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 22px;
    backdrop-filter: blur(8px);
    animation: fadeSlideDown 0.9s ease both;
  }

  .hero-eyebrow svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
  }

  @keyframes fadeSlideDown {
    from {
      opacity: 0;
      transform: translateY(-25px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeSlideUp {
    from {
      opacity: 0;
      transform: translateY(35px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .page-hero h1 {
    font-size: clamp(34px, 6vw, 58px);
    font-weight: 800;
    margin-bottom: 16px;
    line-height: 1.15;
    animation: fadeSlideUp 0.9s ease 0.15s both;
  }

  .page-hero h1 span {
    color: #f0d080;
  }

  .page-hero p {
    max-width: 680px;
    margin: 0 auto;
    color: rgba(255,255,255,0.84);
    line-height: 1.85;
    font-size: 16px;
    animation: fadeSlideUp 0.9s ease 0.3s both;
  }

  .hero-steps {
    display: flex;
    justify-content: center;
    gap: 0;
    margin-top: 36px;
    animation: fadeSlideUp 0.9s ease 0.45s both;
    flex-wrap: wrap;
  }

  .hero-step {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
  }

  .hero-step.active {
    color: white;
  }

  .hero-step.done {
    color: #f0d080;
  }

  .hero-step-num {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    transition: var(--transition);
    flex-shrink: 0;
  }

  .hero-step.done .hero-step-num {
    background: #f0d080;
    border-color: #f0d080;
    color: #7a5000;
  }

  .hero-step.active .hero-step-num {
    background: var(--gold);
    border-color: var(--gold);
    color: white;
    box-shadow: 0 0 0 4px rgba(184,134,11,0.3);
  }

  .hero-step-line {
    width: 60px;
    height: 2px;
    background: rgba(255,255,255,0.2);
    margin: 0 6px;
    align-self: center;
  }

  .hero-step-line.done {
    background: rgba(240,208,128,0.5);
  }

  .form-page-section {
    background: var(--bg);
    padding: 70px 0 100px;
  }

  .payment-layout {
    display: grid;
    grid-template-columns: 1fr 370px;
    gap: 32px;
    align-items: start;
    max-width: 1100px;
    margin: auto;
  }

  .timer-banner {
    background: linear-gradient(135deg, #fff8e7 0%, #fdf6e3 100%);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0 auto 0;
    animation: cardSlideUp 0.5s ease both;
    width: 100%;
    max-width: 1100px;
  }

  .timer-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: white;
    box-shadow: 0 4px 12px rgba(184,134,11,0.35);
  }

  .timer-icon-wrap svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
  }

  .timer-text {
    flex: 1;
  }

  .timer-text p {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 2px;
  }

  .timer-text strong {
    font-size: 15px;
    color: var(--text);
    font-weight: 700;
  }

  .payment-countdown {
    font-size: 22px;
    font-weight: 800;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    letter-spacing: 1px;
    min-width: 80px;
    text-align: right;
    flex-shrink: 0;
  }

  .payment-countdown.expiring {
    color: var(--danger);
    animation: pulse 1s ease infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }

    50% {
      opacity: 0.6;
    }
  }

  @keyframes cardSlideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .form-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 1px solid rgba(234,215,166,0.4);
    animation: cardSlideUp 0.7s ease both;
  }

  .form-card-header {
    background: linear-gradient(135deg, var(--gold) 0%, #d4a017 100%);
    padding: 28px 35px;
    position: relative;
    overflow: hidden;
  }

  .form-card-header::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 180px;
    height: 180px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
  }

  .form-card-header::after {
    content: '';
    position: absolute;
    bottom: -70px;
    left: -40px;
    width: 160px;
    height: 160px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%;
  }

  .form-card-header h2 {
    font-size: 22px;
    font-weight: 800;
    color: white;
    position: relative;
    z-index: 1;
    margin-bottom: 5px;
  }

  .form-card-header p {
    color: rgba(255,255,255,0.82);
    font-size: 13.5px;
    position: relative;
    z-index: 1;
  }

  .form-card-body {
    padding: 35px;
  }

  .card-preview-wrap {
    perspective: 1000px;
    margin-bottom: 32px;
  }

  .card-preview {
    width: 100%;
    max-width: 380px;
    height: 210px;
    margin: 0 auto;
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 40%, #b8860b 100%);
    border-radius: 20px;
    padding: 28px 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.30);
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    transform-style: preserve-3d;
  }

  .card-preview:hover {
    transform: rotateY(4deg) rotateX(2deg) scale(1.02);
  }

  .card-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255,255,255,0.06) 50%,
      transparent 60%
    );
    animation: shimmer 3s ease infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(200%);
    }
  }

  .card-chip {
    width: 42px;
    height: 32px;
    background: linear-gradient(135deg, #d4a017, #f0d080);
    border-radius: 8px;
    margin-bottom: 22px;
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
    padding: 5px;
    overflow: hidden;
  }

  .card-chip-line {
    background: rgba(0,0,0,0.2);
    border-radius: 2px;
  }

  .card-chip-line:first-child {
    grid-column: 1/-1;
  }

  .card-number-display {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 4px;
    color: rgba(255,255,255,0.92);
    font-family: 'Courier New', monospace;
    margin-bottom: 18px;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: relative;
    z-index: 1;
    gap: 12px;
  }

  .card-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 3px;
  }

  .card-value {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.5px;
    max-width: 130px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .card-logo {
    display: flex;
    position: relative;
    z-index: 1;
  }

  .card-logo-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    opacity: 0.85;
  }

  .card-logo-circle:first-child {
    background: #eb001b;
    margin-right: -12px;
  }

  .card-logo-circle:last-child {
    background: #f79e1b;
  }

  .form-section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
    margin-top: 28px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-section-label:first-of-type {
    margin-top: 0;
  }

  .form-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--gold-border);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    position: relative;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.3px;
    padding-left: 2px;
  }

  .form-group .input-wrap {
    position: relative;
  }

  .input-icon-box {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    pointer-events: none;
    transition: var(--transition);
    z-index: 1;
  }

  .input-icon-box svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 13px 16px 13px 44px;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    outline: none;
    font-size: 14.5px;
    font-family: 'Poppins', sans-serif;
    color: var(--text);
    background: #fafafa;
    transition: var(--transition);
    appearance: none;
    -webkit-appearance: none;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 90px;
    padding-top: 14px;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    border-color: var(--gold);
    background: var(--gold-pale);
    box-shadow: 0 0 0 3px rgba(184,134,11,0.12);
  }

  .form-group input:focus + .input-icon-box,
  .form-group textarea:focus + .input-icon-box {
    color: var(--gold);
  }

  .cvv-wrap {
    position: relative;
  }

  .cvv-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    z-index: 2;
    transition: var(--transition);
    padding: 4px;
  }

  .cvv-toggle:hover {
    color: var(--gold);
  }

  .cvv-toggle svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  .security-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 10px 14px;
    background: rgba(25,135,84,0.06);
    border: 1px solid rgba(25,135,84,0.18);
    border-radius: 10px;
  }

  .security-row svg {
    width: 15px;
    height: 15px;
    stroke-width: 2;
    color: var(--success);
    flex-shrink: 0;
  }

  .security-row span {
    font-size: 12px;
    color: var(--success);
    font-weight: 600;
  }

  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 28px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--gold);
    color: white;
    padding: 15px 32px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 15px;
    font-family: 'Poppins', sans-serif;
    transition: var(--transition);
    cursor: pointer;
    border: none;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.3px;
    text-align: center;
  }

  .btn svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.2;
    flex-shrink: 0;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 100%);
    opacity: 0;
    transition: var(--transition);
  }

  .btn:hover::before {
    opacity: 1;
  }

  .btn:hover {
    background: var(--gold-dark);
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(184,134,11,0.4);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-muted);
    border: 2px solid #e5e7eb;
  }

  .btn-secondary:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
    color: var(--text);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
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

  @keyframes spin {
    to {
      transform: translateY(-50%) rotate(360deg);
    }
  }

  .booking-message {
    min-height: 22px;
    font-size: 13.5px;
    font-weight: 600;
    text-align: center;
    transition: var(--transition);
    border-radius: 10px;
    white-space: pre-line;
  }

  .booking-message:not(:empty) {
    padding: 12px 16px;
    margin-top: 4px;
  }

  .booking-message.success {
    color: var(--success);
    background: rgba(25,135,84,0.08);
    border: 1px solid rgba(25,135,84,0.2);
  }

  .booking-message.error {
    color: var(--danger);
    background: rgba(220,53,69,0.08);
    border: 1px solid rgba(220,53,69,0.2);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .summary-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    border: 1px solid var(--gold-border);
    animation: cardSlideUp 0.7s ease 0.15s both;
  }

  .summary-card-header {
    background: linear-gradient(135deg, var(--gold) 0%, #d4a017 100%);
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
  }

  .summary-card-header::before {
    content: '';
    position: absolute;
    right: -20px;
    top: -20px;
    width: 100px;
    height: 100px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
  }

  .summary-card-header h3 {
    font-size: 15px;
    font-weight: 700;
    color: white;
    position: relative;
    z-index: 1;
  }

  .summary-card-header p {
    font-size: 12px;
    color: rgba(255,255,255,0.78);
    position: relative;
    z-index: 1;
    margin-top: 3px;
  }

  .summary-card-body {
    padding: 22px 24px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 12px;
  }

  .summary-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .summary-label {
    font-size: 12.5px;
    color: var(--text-muted);
    font-weight: 500;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .summary-label svg {
    width: 13px;
    height: 13px;
    stroke-width: 2;
  }

  .summary-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    text-align: right;
  }

  .summary-amount-box {
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    margin-top: 16px;
  }

  .summary-amount-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--gold-dark);
    font-weight: 600;
    margin-bottom: 4px;
  }

  .summary-amount-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--gold);
    line-height: 1;
  }

  .trust-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 24px;
    border: 1px solid #f3f4f6;
    animation: cardSlideUp 0.7s ease 0.3s both;
  }

  .trust-card h4,
  .help-card h4 {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .trust-card h4 svg,
  .help-card h4 svg {
    width: 16px;
    height: 16px;
    color: var(--gold);
    stroke-width: 2;
  }

  .trust-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f9fafb;
  }

  .trust-item:last-child {
    border-bottom: none;
  }

  .trust-item-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--gold);
  }

  .trust-item-icon svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  .trust-item-text {
    flex: 1;
  }

  .trust-item-text strong {
    font-size: 13px;
    color: var(--text);
    font-weight: 700;
    display: block;
    margin-bottom: 2px;
  }

  .trust-item-text span {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .help-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: 24px;
    border: 1px solid #f3f4f6;
    animation: cardSlideUp 0.7s ease 0.45s both;
  }

  .help-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f9fafb;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .help-item:last-child {
    border-bottom: none;
  }

  .help-item-num {
    width: 22px;
    height: 22px;
    background: var(--gold-pale);
    border: 1px solid var(--gold-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    color: var(--gold);
    flex-shrink: 0;
    margin-top: 1px;
  }

  footer {
    background: #0f0f1a;
    color: white;
    padding: 55px 0 35px;
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    padding-bottom: 30px;
    border-bottom: 1px solid #1f2937;
    margin-bottom: 28px;
  }

  .footer-brand img {
    height: 32px;
    filter: brightness(10);
    display: block;
    margin-bottom: 8px;
  }

  .footer-brand p {
    font-size: 13px;
    color: #9ca3af;
  }

  .footer-links {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .footer-links a {
    font-size: 13px;
    color: #9ca3af;
    transition: var(--transition);
  }

  .footer-links a:hover {
    color: var(--gold);
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .footer-bottom p {
    font-size: 13px;
    color: #6b7280;
  }

  .footer-gold {
    color: var(--gold);
  }

  @media(max-width: 992px) {
    .payment-layout {
      grid-template-columns: 1fr;
    }

    .sidebar {
      order: -1;
    }

    .timer-banner {
      grid-column: 1;
    }
  }

  @media(max-width: 768px) {
    .nav-links {
      display: none;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-card-body {
      padding: 24px 20px;
    }

    .hero-steps {
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .hero-step-line {
      width: 30px;
    }

    .card-preview {
      height: 185px;
    }

    .footer-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }
  }

  @media(max-width: 480px) {
    .hero-steps {
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .hero-step-line {
      display: none;
    }

    .timer-banner {
      align-items: flex-start;
      flex-direction: column;
    }

    .payment-countdown {
      text-align: left;
    }
  }
`;

const initialPaymentForm = {
  cardholder_name: "",
  card_number: "",
  expiry_date: "",
  cvv: "",
  billing_address: "",
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

function clearAllBookingStorage() {
  removeJson(SELECTED_SLOT_KEY);
  removeJson(BOOKING_DRAFT_KEY);
  removeJson(ACTIVE_HOLD_KEY);
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

function normalizeApiData(payload) {
  return payload?.data !== undefined ? payload.data : payload;
}

async function requestApi(endpoint, options = {}) {
  if (typeof apiRequest === "function") {
    return apiRequest(endpoint, options);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = payload?.errors
      ? Object.values(payload.errors).flat().join("\n")
      : "";

    throw new Error(payload?.error || validationErrors || payload?.message || "API request failed");
  }

  return payload;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  let digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) {
    digits = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

function formatPreviewNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const padded = digits.padEnd(16, "•");
  return padded.replace(/(.{4})/g, "$1 ").trim();
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconEye({ closed = false }) {
  if (closed) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const timerRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [hold, setHold] = useState(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [showCvv, setShowCvv] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [countdownText, setCountdownText] = useState("--:--");
  const [timerStatus, setTimerStatus] = useState("Session active");
  const [isExpiring, setIsExpiring] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const previewName = useMemo(() => {
    return paymentForm.cardholder_name.trim()
      ? paymentForm.cardholder_name.trim().toUpperCase()
      : "YOUR NAME";
  }, [paymentForm.cardholder_name]);

  const previewNumber = useMemo(() => {
    return paymentForm.card_number.trim()
      ? formatPreviewNumber(paymentForm.card_number)
      : "•••• •••• •••• ••••";
  }, [paymentForm.card_number]);

  const previewExpiry = useMemo(() => {
    return paymentForm.expiry_date.trim() || "MM/YY";
  }, [paymentForm.expiry_date]);

  const amount = Number(hold?.total_amount || 0);

  const setPaymentMessage = useCallback((text, type = "") => {
    setMessage({ text, type });
  }, []);

  const updatePaymentForm = useCallback((field, value) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const stopPaymentTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseActiveHold = useCallback(async () => {
    const activeHold = readJson(ACTIVE_HOLD_KEY);

    if (!activeHold?.booking_id || !activeHold?.hold_token) {
      return false;
    }

    try {
      await requestApi("/booking-holds/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          booking_id: activeHold.booking_id,
          hold_token: activeHold.hold_token,
        }),
      });

      removeJson(ACTIVE_HOLD_KEY);
      return true;
    } catch {
      removeJson(ACTIVE_HOLD_KEY);
      return false;
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    stopPaymentTimer();
    setPaymentMessage("Session Expired. Please select the slot again.", "error");
    setTimerStatus("Session expired");
    setCountdownText("00:00");
    setIsExpiring(true);
    setIsExpired(true);
    await releaseActiveHold();
  }, [releaseActiveHold, setPaymentMessage, stopPaymentTimer]);

  const updatePaymentCountdown = useCallback(
    (expiresAt) => {
      const expiresTime = parseServerDateTime(expiresAt);

      if (!expiresTime) {
        setCountdownText("--:--");
        return;
      }

      const remainingMs = expiresTime - Date.now();

      if (remainingMs > 0) {
        setCountdownText(formatCountdown(remainingMs));
        setIsExpiring(remainingMs < 120000);
        setTimerStatus(remainingMs < 120000 ? "Expiring soon!" : "Session active");
      } else {
        handleSessionExpired();
      }
    },
    [handleSessionExpired]
  );

  const startPaymentTimer = useCallback(
    (expiresAt) => {
      stopPaymentTimer();
      updatePaymentCountdown(expiresAt);

      timerRef.current = setInterval(() => {
        const expiresTime = parseServerDateTime(expiresAt);

        if (!expiresTime || expiresTime - Date.now() <= 0) {
          handleSessionExpired();
          return;
        }

        updatePaymentCountdown(expiresAt);
      }, 1000);
    },
    [handleSessionExpired, stopPaymentTimer, updatePaymentCountdown]
  );

  const loadPaymentSummary = useCallback(() => {
    const activeHold = readJson(ACTIVE_HOLD_KEY);

    if (!activeHold?.booking_id || !activeHold?.hold_token || !activeHold?.hold_expires_at) {
      setHold(null);
      setIsExpired(true);
      setPaymentMessage("No active payment session. Please select a slot first.", "error");
      setTimerStatus("No active session");
      setCountdownText("--:--");
      return null;
    }

    if (parseServerDateTime(activeHold.hold_expires_at) <= Date.now()) {
      setHold(activeHold);
      handleSessionExpired();
      return null;
    }

    setHold(activeHold);
    setIsExpired(false);
    setPaymentMessage("", "");
    startPaymentTimer(activeHold.hold_expires_at);

    return activeHold;
  }, [handleSessionExpired, setPaymentMessage, startPaymentTimer]);

  const cancelPayment = useCallback(async () => {
    if (isCancelling) return;

    const activeHold = readJson(ACTIVE_HOLD_KEY);

    if (!activeHold?.booking_id) {
      navigate("/#calendar-booking");
      return;
    }

    setIsCancelling(true);

    try {
      await releaseActiveHold();
      stopPaymentTimer();
      navigate("/booking");
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, navigate, releaseActiveHold, stopPaymentTimer]);

const submitPayment = useCallback(
  async (event) => {
    event.preventDefault();

    const form = formRef.current;

    if (form && !form.checkValidity()) {
      form.reportValidity();
      setPaymentMessage("Please complete all required payment fields.", "error");
      return;
    }

    const activeHold = readJson(ACTIVE_HOLD_KEY);

    if (!activeHold?.booking_id || !activeHold?.hold_token) {
      setPaymentMessage("Your payment session is missing or expired. Please select a slot again.", "error");
      return;
    }

    if (parseServerDateTime(activeHold.hold_expires_at) <= Date.now()) {
      await handleSessionExpired();
      return;
    }

    setIsSubmitting(true);
    setPaymentMessage("", "");

    try {
      const token = localStorage.getItem("dlc_customer_token_v1");

      if (!token) {
        throw new Error("Please login first to continue payment.");
      }

      const result = await requestApi(`/payments/sslcommerz/bookings/${activeHold.booking_id}/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hold_token: activeHold.hold_token,

          /*
           * These fields are kept only because your current UI has this form.
           * SSLCommerz will handle the real card/banking information on its own secure page.
           * Backend should not store full card number or CVV anymore.
           */
          cardholder_name: paymentForm.cardholder_name.trim(),
          billing_address: paymentForm.billing_address.trim(),
        }),
      });

      const data = normalizeApiData(result);

      if (!data?.gateway_url) {
        throw new Error("SSLCommerz payment gateway URL was not found.");
      }

      saveJson(PENDING_CONFIRMATION_KEY, {
        status: "pending",
        message: "Your payment is being processed through SSLCommerz.",
        submitted_at: new Date().toISOString(),
        booking_id: activeHold.booking_id,
        booking_no: activeHold.booking_no || "",
        customer_name: activeHold.customer_name || "",
        customer_email: activeHold.customer_email || "",
        event_title: activeHold.event_title || "",
        event_type: activeHold.event_type || "",
        guest_count: activeHold.guest_count || "",
        booking_date: activeHold.booking_date || "",
        booking_slot_label: activeHold.booking_slot_label || "",
        total_amount: activeHold.total_amount || 0,
      });

      window.location.href = data.gateway_url;
    } catch (error) {
      setPaymentMessage(error.message || "Unable to start SSLCommerz payment.", "error");
      setIsSubmitting(false);
    }
  },
  [handleSessionExpired, paymentForm, setPaymentMessage]
);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-aos]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("aos-animate");
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [hold]);

  useEffect(() => {
    loadPaymentSummary();

    return () => {
      stopPaymentTimer();
    };
  }, [loadPaymentSummary, stopPaymentTimer]);

  return (
    <>
      <style>{paymentPageStyles}</style>

      <nav id="navbar" className={isScrolled ? "scrolled" : ""}>
        <div className="nav-inner">
          <div className="container nav-wrapper">
            <div className="logo">
              <Link to="/">
                <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club Logo" />
              </Link>
            </div>

            <div className="nav-links">
              <Link to="/#calendar-booking">Calendar</Link>
              <Link to="/#about">About</Link>
              <Link to="/#gallery">Gallery</Link>
              <Link to="/#features">Features</Link>
              <Link to="/booking" className="nav-back">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  style={{ width: "15px", height: "15px", strokeWidth: 2.5 }}
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="page-hero">
        <div className="page-hero-bg" />
        <div className="page-hero-overlay" />

        <div className="container">
          <div className="hero-eyebrow">
            <IconCard />
            Secure Payment Gateway
          </div>

          <h1>
            Complete Your <span>Payment</span>
          </h1>

          <p>Your slot is temporarily held. Submit your payment information to complete your booking request</p>

          <div className="hero-steps">
            <div className="hero-step done">
              <div className="hero-step-num">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  style={{ width: "14px", height: "14px", strokeWidth: 3 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Select Slot</span>
            </div>

            <div className="hero-step-line done" />

            <div className="hero-step done">
              <div className="hero-step-num">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  style={{ width: "14px", height: "14px", strokeWidth: 3 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Booking Info</span>
            </div>

            <div className="hero-step-line done" />

            <div className="hero-step active">
              <div className="hero-step-num">3</div>
              <span>Payment</span>
            </div>
          </div>
        </div>
      </section>

      <section className="form-page-section" id="payment-page">
        <div className="container">
          <div className="timer-banner" data-aos="fade-up">
            <div className="timer-icon-wrap">
              <IconClock />
            </div>

            <div className="timer-text">
              <p>Your slot is held — complete payment before the session expires</p>
              <strong>{timerStatus}</strong>
            </div>

            <div className={`payment-countdown${isExpiring ? " expiring" : ""}`}>
              {countdownText}
            </div>
          </div>

          <div className="payment-layout" style={{ marginTop: "28px" }}>
            <div className="form-card" data-aos="fade-right">
              <div className="form-card-header">
                <h2>Payment Details</h2>
                <p>All transactions are encrypted and secure</p>
              </div>

              <div className="form-card-body">
                <div className="card-preview-wrap">
                  <div className="card-preview">
                    <div className="card-shimmer" />
                    <div className="card-chip">
                      <div className="card-chip-line" />
                      <div className="card-chip-line" />
                      <div className="card-chip-line" />
                    </div>

                    <div className="card-number-display">{previewNumber}</div>

                    <div className="card-bottom">
                      <div>
                        <div className="card-label">Card Holder</div>
                        <div className="card-value">{previewName}</div>
                      </div>

                      <div>
                        <div className="card-label">Expires</div>
                        <div className="card-value">{previewExpiry}</div>
                      </div>

                      <div className="card-logo">
                        <div className="card-logo-circle" />
                        <div className="card-logo-circle" />
                      </div>
                    </div>
                  </div>
                </div>

                <form ref={formRef} id="paymentForm" noValidate onSubmit={submitPayment}>
                  <div className="form-section-label">Cardholder Information</div>

                  <div className="form-group">
                    <label htmlFor="cardholderName">Cardholder Name *</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="cardholderName"
                        placeholder="Name as on card"
                        required
                        autoComplete="cc-name"
                        value={paymentForm.cardholder_name}
                        onChange={(event) => updatePaymentForm("cardholder_name", event.target.value)}
                      />
                      <span className="input-icon-box">
                        <IconUser />
                      </span>
                    </div>
                  </div>

                  <div className="form-section-label">Card Details</div>

                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                        autoComplete="cc-number"
                        inputMode="numeric"
                        value={paymentForm.card_number}
                        onChange={(event) => updatePaymentForm("card_number", formatCardNumber(event.target.value))}
                      />
                      <span className="input-icon-box">
                        <IconCard />
                      </span>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date *</label>
                      <div className="input-wrap">
                        <input
                          type="text"
                          id="expiryDate"
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                          autoComplete="cc-exp"
                          value={paymentForm.expiry_date}
                          onChange={(event) => updatePaymentForm("expiry_date", formatExpiry(event.target.value))}
                        />
                        <span className="input-icon-box">
                          <IconCalendar />
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvv">CVV / CVC *</label>
                      <div className="input-wrap cvv-wrap">
                        <input
                          type={showCvv ? "text" : "password"}
                          id="cvv"
                          placeholder="•••"
                          maxLength="4"
                          inputMode="numeric"
                          pattern="\d{3,4}"
                          autoComplete="off"
                          required
                          value={paymentForm.cvv}
                          onChange={(event) =>
                            updatePaymentForm("cvv", event.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                        />
                        <span className="input-icon-box">
                          <IconLock />
                        </span>
                        <button
                          type="button"
                          className="cvv-toggle"
                          tabIndex="-1"
                          onClick={() => setShowCvv((current) => !current)}
                          aria-label="Toggle CVV visibility"
                        >
                          <IconEye closed={showCvv} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-section-label">Billing Address</div>

                  <div className="form-group">
                    <label htmlFor="billingAddress">Billing Address *</label>
                    <div className="input-wrap">
                      <textarea
                        id="billingAddress"
                        rows="3"
                        placeholder="Your full billing address"
                        required
                        autoComplete="billing street-address"
                        value={paymentForm.billing_address}
                        onChange={(event) => updatePaymentForm("billing_address", event.target.value)}
                      />
                      <span
                        className="input-icon-box"
                        style={{ top: 0, alignItems: "flex-start", paddingTop: "14px" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="security-row">
                    <IconShield />
                    <span>256-bit SSL encrypted · Your card details are never stored</span>
                  </div>

                  <div className="form-actions">
                    <button
                      className={`btn${isSubmitting ? " loading" : ""}`}
                      type="submit"
                      disabled={isSubmitting || isExpired || !hold?.booking_id}
                    >
                      <IconShield />
                      {isSubmitting ? "Processing Payment..." : "Complete Payment"}
                    </button>

                    <button
                      className={`btn btn-secondary${isCancelling ? " loading" : ""}`}
                      type="button"
                      onClick={cancelPayment}
                      disabled={isCancelling || isSubmitting}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      {isExpired ? "Back to Calendar" : isCancelling ? "Cancelling..." : "Cancel & Edit Booking"}
                    </button>
                  </div>

                  <div className={`booking-message ${message.type || ""}`.trim()}>{message.text}</div>
                </form>
              </div>
            </div>

            <div className="sidebar" data-aos="fade-left" data-aos-delay="150">
              <div className="summary-card">
                <div className="summary-card-header">
                  <h3>Booking Summary</h3>
                  <p>Your confirmed selection details</p>
                </div>

                <div className="summary-card-body">
                  {!hold?.booking_id ? (
                    <div style={{ padding: "10px 0", fontSize: "14px", color: "var(--text-muted)", textAlign: "center" }}>
                      <IconClock />
                      <br />
                      No active payment session.
                      <br />
                      Please select a slot first.
                    </div>
                  ) : (
                    <>
                      <div className="summary-row">
                        <span className="summary-label">
                          <IconUser />
                          Name
                        </span>
                        <span className="summary-value">{hold.customer_name || "—"}</span>
                      </div>

                      <div className="summary-row">
                        <span className="summary-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="8 6 21 6" />
                            <polyline points="8 12 21 12" />
                            <polyline points="8 18 21 18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          Event
                        </span>
                        <span className="summary-value">{hold.event_title || "—"}</span>
                      </div>

                      <div className="summary-row">
                        <span className="summary-label">
                          <IconCalendar />
                          Date
                        </span>
                        <span className="summary-value">{hold.booking_date || "—"}</span>
                      </div>

                      <div className="summary-row">
                        <span className="summary-label">
                          <IconClock />
                          Shift
                        </span>
                        <span className="summary-value">{hold.booking_slot_label || "—"}</span>
                      </div>

                      <div className="summary-amount-box">
                        <div className="summary-amount-label">Total Payment Amount</div>
                        <div className="summary-amount-value">৳ {amount.toLocaleString()}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="trust-card">
                <h4>
                  <IconShield />
                  Secure &amp; Trusted
                </h4>

                <div className="trust-item">
                  <div className="trust-item-icon">
                    <IconLock />
                  </div>
                  <div className="trust-item-text">
                    <strong>256-bit SSL Encryption</strong>
                    <span>All data transmitted over a fully encrypted secure connection</span>
                  </div>
                </div>

                <div className="trust-item">
                  <div className="trust-item-icon">
                    <IconClock />
                  </div>
                  <div className="trust-item-text">
                    <strong>10-Minute Hold</strong>
                    <span>Your slot is reserved exclusively for you during checkout</span>
                  </div>
                </div>

                <div className="trust-item">
                  <div className="trust-item-icon">
                    <IconMail />
                  </div>
                  <div className="trust-item-text">
                    <strong>Instant Confirmation</strong>
                    <span>Receive a booking confirmation email immediately on success</span>
                  </div>
                </div>
              </div>

              <div className="help-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Payment Steps
                </h4>

                <div className="help-item">
                  <div className="help-item-num">1</div>
                  <span>Enter your card details accurately in the fields provided.</span>
                </div>

                <div className="help-item">
                  <div className="help-item-num">2</div>
                  <span>
                    Click <strong>Complete Payment</strong> to process the transaction securely.
                  </span>
                </div>

                <div className="help-item">
                  <div className="help-item-num">3</div>
                  <span>After submission, your booking will be pending admin approval and the slot is locked.</span>
                </div>

                <div className="help-item">
                  <div className="help-item-num">
                    <IconMail />
                  </div>
                  <span>A receipt will be emailed to your registered address within minutes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/assets/img/dlclogo_long.png" alt="Dhaka Ladies Club" />
              <p>Premium Convention &amp; Party Venue in Dhaka</p>
            </div>

            <div className="footer-links">
              <Link to="/#calendar-booking">Calendar</Link>
              <Link to="/#about">About</Link>
              <Link to="/#gallery">Gallery</Link>
              <Link to="/#features">Features</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © 2026 <span className="footer-gold">Dhaka Ladies Club</span>. All Rights Reserved.
            </p>
            <p>Dhaka, Bangladesh</p>
          </div>
        </div>
      </footer>
    </>
  );
}