window.API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';

const AUTH_TOKEN_KEY = 'dlc_auth_token_v1';
const AUTH_USER_KEY = 'dlc_auth_user_v1';

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function isLoggedIn() {
  return Boolean(getAuthToken());
}

function authHeaders() {
  const token = getAuthToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function saveAuthSession(data) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
}

function getSavedUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function fetchLoggedInUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/auth/me`, {
      headers: {
        Accept: 'application/json',
        ...authHeaders()
      }
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const result = await response.json();
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.data.user));

    return result.data.user;
  } catch {
    return getSavedUser();
  }
}

async function requireLoggedInUser() {
  const user = await fetchLoggedInUser();

  if (!user) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
    return null;
  }

  return user;
}

async function logoutUser() {
  try {
    await fetch(`${window.API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...authHeaders()
      }
    });
  } catch {}

  clearAuthSession();
  window.location.href = 'index.html';
}