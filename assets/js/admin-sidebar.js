 async function loadAdminSidebar(activePage, admin) {
  const mount = document.getElementById('adminSidebarMount');

  if (!mount) {
    console.error('adminSidebarMount not found.');
    return;
  }

  const response = await fetch('sidebar.html', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Unable to load admin sidebar.');
  }

  mount.innerHTML = await response.text();

  const currentPage = activePage || detectActiveSidebarPage();

  document.querySelectorAll('[data-sidebar-page]').forEach((link) => {
    link.classList.toggle('active', link.dataset.sidebarPage === currentPage);
  });

  const adminName = admin?.name || 'Admin';

  const sidebarAdminName = document.getElementById('sidebarAdminName');
  const sidebarAdminAvatar = document.getElementById('sidebarAdminAvatar');

  if (sidebarAdminName) {
    sidebarAdminName.textContent = adminName;
  }

  if (sidebarAdminAvatar) {
    sidebarAdminAvatar.textContent = adminName.charAt(0).toUpperCase();
  }

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
      if (typeof logoutAdmin === 'function') {
        logoutAdmin();
      }
    });
  }
}

function detectActiveSidebarPage() {
  const page = window.location.pathname.split('/').pop();

  if (page === 'admin-dashboard.html') return 'dashboard';
  if (page === 'admin-manual-booking.html') return 'manual-booking';
  if (page === 'admin-bookings.html') return 'bookings';

  return 'dashboard';
}