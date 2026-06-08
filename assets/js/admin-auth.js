(function () {
  window.API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';

  const ADMIN_TOKEN_KEY = 'dlc_admin_token_v1';
  const ADMIN_USER_KEY = 'dlc_admin_user_v1';

  function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  function adminHeaders() {
    const token = getAdminToken();

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }

  function saveAdminSession(data) {
    if (!data || !data.token || !data.admin) {
      console.error('Invalid admin session data:', data);
      return;
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
  }

  function clearAdminSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }

  function getSavedAdmin() {
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isAdminLoggedIn() {
    return Boolean(getAdminToken());
  }

  async function fetchAdmin() {
    const token = getAdminToken();

    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/admin/me`, {
        headers: {
          Accept: 'application/json',
          ...adminHeaders()
        }
      });

      if (!response.ok) {
        clearAdminSession();
        return null;
      }

      const result = await response.json();
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.data.admin));

      return result.data.admin;
    } catch {
      return getSavedAdmin();
    }
  }

  async function requireAdmin() {
    const admin = await fetchAdmin();

    if (!admin) {
      window.location.href = 'admin-login.html';
      return null;
    }

    return admin;
  }

  async function logoutAdmin() {
    try {
      await fetch(`${window.API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...adminHeaders()
        }
      });
    } catch {}

    clearAdminSession();
    window.location.href = 'admin-login.html';
  }

  window.getAdminToken = getAdminToken;
  window.adminHeaders = adminHeaders;
  window.saveAdminSession = saveAdminSession;
  window.clearAdminSession = clearAdminSession;
  window.getSavedAdmin = getSavedAdmin;
  window.isAdminLoggedIn = isAdminLoggedIn;
  window.fetchAdmin = fetchAdmin;
  window.requireAdmin = requireAdmin;
  window.logoutAdmin = logoutAdmin;
})();