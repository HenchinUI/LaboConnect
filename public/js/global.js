function scrollToSection(section){
  document.querySelector(section).scrollIntoView({behavior:'smooth'});
}

// Handle Opportunities link: on homepage scroll to section, on other pages go to listings page
function handleOpportunitiesClick(e) {
    try {
        const p = (location.pathname || '').toLowerCase();
        const href = (location.href || '').toLowerCase();
        const isHome = p.endsWith('/') || p.endsWith('/index.html') || href.includes('index.html');
        if (isHome) {
            // stay on page and scroll
            e && e.preventDefault();
            scrollToSection('#opportunities');
            return;
        }
        // not on home — navigate to listings (full page view)
        e && e.preventDefault();
        // prefer the dedicated listings page
        window.location.href = '/components/listings.html';
    } catch (err) {
        console.error('handleOpportunitiesClick error:', err);
    }
}

// --- USER MANAGEMENT / AUTH LOGIC ---

const USER_DB_KEY = 'laboUsers';
const CURRENT_USER_KEY = 'laboCurrentUser';

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USER_DB_KEY)) || [];
        return users;
    } catch (e) {
        console.error("Error reading user database:", e);
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
}

// Check for existing session and set user role on page load
async function loadSession() {
    try {
        // Validate session with server
        const res = await fetch('/api/session', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.authenticated && data.user) {
            setUserRole(data.user.role, data.user);
        } else {
            setUserRole('guest');
        }
    } catch (e) {
        console.warn('Session check failed:', e);
        setUserRole('guest');
    }
}

// --- Notifications (simple polling) ---
function updateNotifBadge(count){
    const unreadDot = document.getElementById('unreadDot');
    const notifBtn = document.getElementById('notifBtn');
    // Show dot if count > 0
    if (unreadDot) {
        if (!count || count <= 0) { unreadDot.style.display = 'none'; }
        else { unreadDot.style.display = 'block'; }
    }
    // Update button title/aria label with count
    if (notifBtn) {
        if (!count || count <= 0) {
            notifBtn.title = 'Notifications';
            notifBtn.setAttribute('aria-label', 'Notifications');
        } else {
            notifBtn.title = `Notifications (${count})`;
            notifBtn.setAttribute('aria-label', `Notifications (${count})`);
        }
    }
}

async function fetchNotifCountForUser(){
    try {
        // Request count for the authenticated session user; server will enforce authorization
        const r = await fetch('/api/inquiries/count', { credentials: 'same-origin' });
        if (!r.ok) {
            updateNotifBadge(0);
            return;
        }
        const data = await r.json();
        updateNotifBadge(data.count || 0);
    } catch (e) {
        console.warn('Notif fetch failed', e);
    }
}

function initNotifications(){
        // initial fetch
        fetchNotifCountForUser();
        // poll every 20s
        setInterval(fetchNotifCountForUser, 20000);
}

function openNotifications(){
        // navigate to inquiries page (owner/admin view)
        window.location.href = '/components/inquiries.html';
}

// --- Register Handler ---
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'user';
    const errorEl = document.getElementById('register-error');
    if (errorEl) errorEl.textContent = '';

    try {
        const payload = { username: name, email, password, role };
        if (role === 'admin') {
            const adminToken = document.getElementById('reg-admin-token') ? document.getElementById('reg-admin-token').value.trim() : '';
            payload.admin_token = adminToken;
        }
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            if (errorEl) errorEl.textContent = data.error || 'Registration failed';
            return;
        }
        alert(`Registration successful! Welcome, ${data.user.username}.`);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        setUserRole(data.user.role, data.user);
        closeAuthModal();
    } catch (err) {
        console.error(err);
        if (errorEl) errorEl.textContent = 'An error occurred during registration.';
    }

}

// --- Login Handler ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';

    if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Please enter email and password.';
        return;
    }

    try {
        const res = await fetch('/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            if (errorEl) errorEl.textContent = data.error || 'Login failed.';
            return;
        }

        // Save minimal client copy for quick UI, but rely on server session for authoritative state
        try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user)); } catch (e) { }

        // Refresh UI from server-side session to avoid mismatch
        await loadSession();

            // If the current page exposes a checkUserLoginStatus function (index page), call it so submit form updates without refresh
            try { if (typeof window.checkUserLoginStatus === 'function') window.checkUserLoginStatus(); } catch (e) { /* ignore */ }

        closeAuthModal();
        alert(`Welcome back, ${data.user.username}!`);

        if (data.user.role === 'admin') {
            // Navigate to admin dashboard if admin
            window.location.href = '/components/admin-dashboard.html';
        }

    } catch (err) {
        console.error('Login error:', err);
        if (errorEl) errorEl.textContent = 'Server error, please try again later.';
    }
}




// Logout Handler
async function logoutUser() {
    try {
        await fetch('/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
        console.warn('Logout request failed:', e);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUserRole('guest');
    try { if (typeof window.checkUserLoginStatus === 'function') window.checkUserLoginStatus(); } catch (e) { /* ignore */ }
    alert('You have been logged out.');
    if (!window.location.pathname.endsWith('index.html')) {
        window.location.href = '/components/index.html';
    }
}

// Set UI based on role
function setUserRole(role, user) {
  const isGuest = role === 'guest';
  
  // Show/hide guest login button vs logged-in section
  const guestLoginBtn = document.getElementById('guestLoginBtn');
  const loggedInSection = document.getElementById('loggedInSection');
  const profileBtn = document.getElementById('profileBtn');
  
  if (isGuest) {
      console.log('Setting UI for GUEST state');
      if (guestLoginBtn) guestLoginBtn.style.display = '';
      if (loggedInSection) loggedInSection.style.display = 'none';
  } else {
      console.log('Setting UI for LOGGED IN state');
      if (guestLoginBtn) guestLoginBtn.style.display = 'none';
      if (loggedInSection) {
        loggedInSection.style.display = 'flex';
      }
      
      // Update profile display
      const nameEl = document.getElementById('profileName');
      const avatar = document.getElementById('profileAvatar');
      
      if (nameEl) nameEl.textContent = user?.username || (role === 'admin' ? 'BPLO Admin' : 'Business Owner');
      if (avatar) avatar.src = user?.avatar || 'assets/img/user-profile-placeholder.jpg';
      
      if (profileBtn) {
        profileBtn.onclick = (ev) => {
          try {
            ev && ev.preventDefault && ev.preventDefault();
          } catch(e){}
          try {
            const stored = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
            if (stored && stored.role === 'admin') { window.location.href = '/components/admin-dashboard.html'; return; }
          } catch (e) { /* ignore */ }
          window.location.href = '/components/business/index.html';
        };
      }
  }

  // Query admin/business link **inside loaded header**
  const adminNav = document.querySelector('#header-import a[href="#admin"]');
  if (adminNav) {
      if (role === 'admin') {
          adminNav.style.display = '';
          adminNav.href = '/components/admin-dashboard.html';
          adminNav.textContent = 'Admin Panel';
      } else if (role === 'business') {
          adminNav.style.display = '';
          adminNav.href = 'business/index.html';
          adminNav.textContent = 'My Business';
      } else {
          adminNav.style.display = 'none';
          adminNav.href = '#admin';
          adminNav.textContent = 'Admin';
      }
  }

    // Show or hide the Submit Listing button (only for authenticated users)
    try {
        const submitBtn = document.querySelector('#header-import #submitListingBtn');
        if (submitBtn) {
            if (isGuest) submitBtn.style.display = 'none';
            else submitBtn.style.display = '';
        }
    } catch (e) { console.warn('Could not toggle submit listing button', e); }

  document.querySelectorAll('.role-admin').forEach(el => el.style.display = role === 'admin' ? '' : 'none');

    // Always verify submit button visibility with server session to avoid stale client state
    try { checkSubmitVisibility(); } catch (e) { /* ignore */ }
}

// Check server session and toggle submit button visibility accordingly
async function checkSubmitVisibility() {
    try {
        const submitBtn = document.querySelector('#header-import #submitListingBtn');
        if (!submitBtn) return;
        const res = await fetch('/api/session', { credentials: 'same-origin' });
        if (!res.ok) {
            submitBtn.style.display = 'none';
            // also hide submit section on page if present
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = 'none';
            return;
        }
        const data = await res.json();
        if (data && data.authenticated && data.user) {
            // allow only logged-in users to see the submit button
            submitBtn.style.display = '';
            // show submit section if present on this page
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = '';
        } else {
            submitBtn.style.display = 'none';
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = 'none';
        }
    } catch (e) {
        console.warn('checkSubmitVisibility failed', e);
    }
}

// Keep submit button in sync across tabs
window.addEventListener('storage', (ev) => {
    if (ev.key === CURRENT_USER_KEY) {
        // re-check server session to be authoritative
        checkSubmitVisibility();
    }
});

// Modal functions
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
        showAuthTab('login');
    }
}

// Load header dynamically (use absolute paths so it works from any page)
fetch("/components/header.html")
  .then(res => {
    console.log('Header fetch response:', res.status);
    return res.text();
  })
  .then(data => {
        console.log('Header HTML loaded, length:', data.length);
        const headerImportEl = document.querySelector("#header-import");
        // Only inject if header-import is empty to avoid overwriting another loader
        if (headerImportEl && headerImportEl.innerHTML.trim() === '') {
            headerImportEl.innerHTML = data;
            console.log('Header HTML injected into #header-import');
        } else {
            console.log('Header already present; skipping injection to avoid overwrite');
        }

        // **Header loaded or already present — safe to update roles**
        loadSession();
        initNotifications();

        const profileBtn = document.querySelector('#header-import #profileBtn');
        const notifBtn = document.querySelector('#header-import #notifBtn');
        const logoutBtn = document.querySelector('#header-import #logoutBtn');

        console.log('Profile button found:', !!profileBtn);
        console.log('Notif button found:', !!notifBtn);
        console.log('Logout button found:', !!logoutBtn);

        // Wire simple header actions for logged-in users (idempotent)
        if (notifBtn && !notifBtn._wired) {
            notifBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                openNotifications();
            });
            notifBtn._wired = true;
        }

        if (logoutBtn && !logoutBtn._wired) {
            logoutBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                logoutUser();
            });
            logoutBtn._wired = true;
        }

        if (profileBtn && !profileBtn._wired) {
            profileBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                try {
                    const stored = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
                    if (stored && stored.role === 'admin') {
                        window.location.href = '/components/admin-dashboard.html';
                        return;
                    }
                } catch (e) { /* ignore */ }
                // fallback to business dashboard
                window.location.href = '/components/business/index.html';
            });
            profileBtn._wired = true;
        }

        const headerRow2 = document.querySelector('#header-import .labo-row-2');
        if (headerRow2) {
            const p = (location.pathname || '').toLowerCase();
            const href = (location.href || '').toLowerCase();
            const isHome = p.endsWith('/') || p.endsWith('/index.html') || href.includes('index.html');
            headerRow2.style.display = isHome ? '' : 'none';
        }
  })
  .catch(err => console.error("Header fetch error:", err));

// Load auth modal dynamically
function openGuest() {
    console.log('openGuest() called');
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        console.log('Auth modal already exists, opening it');
        openAuthModal();
        return;
    }
    
    console.log('Fetching auth modal HTML...');
    fetch("/components/authModal.html")
      .then(res => {
          console.log('Auth modal HTML fetched, status:', res.status);
          return res.text();
      })
      .then(data => {
          console.log('Auth modal HTML loaded, length:', data.length);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data;
          tempDiv.childNodes.forEach(node => {
              if (node.nodeType === 1) {
                  if (node.tagName === 'SCRIPT') {
                      const newScript = document.createElement('script');
                      if (node.src) {
                          newScript.src = node.src;
                      } else {
                          newScript.textContent = node.textContent;
                      }
                      document.body.appendChild(newScript);
                  } else {
                      document.body.appendChild(node.cloneNode(true));
                  }
              }
          });
          console.log('Auth modal HTML injected into DOM');
          // Give DOM time to settle and wire up form handlers
          setTimeout(() => {
              console.log('Wiring up form handlers...');
              const modal = document.getElementById('authModal');
              const loginForm = document.getElementById('loginForm');
              const registerForm = document.getElementById('registerForm');
              
              console.log('Modal found:', !!modal, 'LoginForm found:', !!loginForm, 'RegisterForm found:', !!registerForm);
              
              if (loginForm && !loginForm.onsubmit) {
                  console.log('Attaching handleLogin to loginForm');
                  loginForm.onsubmit = handleLogin;
              }
              if (registerForm && !registerForm.onsubmit) {
                  console.log('Attaching handleRegister to registerForm');
                  registerForm.onsubmit = handleRegister;
              }
              
              if (modal) {
                  console.log('Opening auth modal');
                  openAuthModal();
              } else {
                  console.warn('Auth modal not found after load');
              }
          }, 100);
      })
      .catch(err => console.error("Could not load auth modal:", err));
}

// Header sticky/scroll logic (unchanged)
(function() {
  const header = document.querySelector('.labo-header');
  if (!header) return;
  const headerRow1 = document.querySelector('.labo-row-1');
  const headerRow2 = document.querySelector('.labo-row-2');
  let isRow2Visible = false;
  let headerHeight = 0;
  let row1Height = 0;
  let row2Height = 0;

  function calc() {
      if (!headerRow1) return;
      row1Height = headerRow1.offsetHeight;
      row2Height = headerRow2 ? headerRow2.offsetHeight : 0;
      headerHeight = header.offsetHeight; 
  }

  function onScroll() {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle('sticky', currentScroll > 0);
      const shouldHideRow2 = currentScroll > (row1Height + 10);
      if (shouldHideRow2 && isRow2Visible) {
          if (headerRow2) headerRow2.style.transform = 'translateY(-100%)';
          isRow2Visible = false;
      } else if (!shouldHideRow2 && !isRow2Visible) {
          if (headerRow2) headerRow2.style.transform = 'translateY(0)';
          isRow2Visible = true;
      }
  }

  function init() {
      const headerImport = document.getElementById('header-import');
      if (headerImport) {
          const w1 = document.querySelector('#header-import .labo-row-1');
          const w2 = document.querySelector('#header-import .labo-row-2');
          if (w1) { 
              const inner = w1.parentElement;
              if (inner && inner.firstChild) {
                  header.appendChild(inner.firstChild);
                  if (w2) header.appendChild(w2.firstChild);
                  inner.remove();
              }
          }
      }
      calc();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', () => { calc(); onScroll(); }, { passive: true });
      const observer = new MutationObserver(() => { calc(); onScroll(); });
      observer.observe(document.getElementById('header-import') || header, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init();
  }
})();
