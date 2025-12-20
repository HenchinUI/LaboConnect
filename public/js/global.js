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
        const [inquiriesRes, notificationsRes] = await Promise.all([
            fetch('/api/inquiries/count', { credentials: 'same-origin' }),
            fetch('/api/listing-notifications/count', { credentials: 'same-origin' })
        ]);
        
        let inquiriesCount = 0;
        let notificationsCount = 0;
        
        if (inquiriesRes.ok) {
            const data = await inquiriesRes.json();
            inquiriesCount = data.count || 0;
        }
        
        if (notificationsRes.ok) {
            const data = await notificationsRes.json();
            notificationsCount = data.count || 0;
        }
        
        const totalCount = inquiriesCount + notificationsCount;
        updateNotifBadge(totalCount);
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

async function openNotifications(){
    // Look for the dropdown - it could be in header-import or directly in DOM
    let modal = document.querySelector('#notificationsDropdown');
    if (!modal) {
        modal = document.querySelector('#header-import #notificationsDropdown');
    }
    
    if (!modal) {
        console.warn('Notifications dropdown not found in DOM');
        return;
    }
    
    // Look for the button to position the dropdown
    let notifBtn = document.querySelector('#notifBtn');
    if (!notifBtn) {
        notifBtn = document.querySelector('#header-import #notifBtn');
    }
    
    // Toggle modal
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
        return;
    }
    
    modal.style.display = 'block';
    
    // Position dropdown relative to button
    if (notifBtn) {
        const rect = notifBtn.getBoundingClientRect();
        modal.style.top = (rect.bottom + 8) + 'px';
        modal.style.right = (window.innerWidth - rect.right) + 'px';
    }
    
    // Load notifications
    try {
        const response = await fetch('/api/notifications?limit=20');
        const data = await response.json();
        const notifications = Array.isArray(data) ? data : [];
        
        // Look for container in both locations
        let container = document.querySelector('#notificationsDropdownContent');
        if (!container) {
            container = document.querySelector('#header-import #notificationsDropdownContent');
        }
        
        if (!container) {
            console.warn('Notifications dropdown content container not found');
            return;
        }
        
        if (notifications.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">No notifications yet</div>';
            return;
        }
        
        container.innerHTML = notifications.map(notif => {
            const dateStr = new Date(notif.updated_at).toLocaleDateString();
            const statusClass = notif.status.replace(/_/g, '-');
            
            // Determine navigation link based on notification type
            let href = '#';
            let typeLabel = 'Notification';
            let statusDisplay = notif.status.replace(/_/g, ' ');
            
            if (notif.type === 'listing') {
                href = `/components/user-dashboard.html?tab=listings`;
                typeLabel = 'Listing Status';
            } else if (notif.type === 'inquiry') {
                href = `/components/user-dashboard.html?tab=inquiries`;
                typeLabel = 'Inquiry Status';
            } else if (notif.type === 'account') {
                href = `/components/profile.html`;
                typeLabel = 'Account Update';
            } else if (notif.type === 'success_story') {
                href = `/components/user-dashboard.html?tab=successStories`;
                typeLabel = 'Success Story';
                // Format status display for success stories
                if (notif.status === 'listing_admin_approved') {
                    statusDisplay = 'Pre-Approved';
                } else if (notif.status === 'approved') {
                    statusDisplay = 'Published';
                } else if (notif.status === 'rejected') {
                    statusDisplay = 'Rejected';
                }
            }
            
            return `
                <a href="${href}" class="notification-dropdown-item" style="display: block; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-decoration: none; color: inherit; transition: background 0.2s;">
                    ${notif.type === 'account' ? 
                      `<div style="display: flex; flex-direction: column; gap: 8px;">
                        <div>
                          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${notif.title}</div>
                          <div style="font-size: 0.875rem; color: #6b7280;">${typeLabel} • ${dateStr}</div>
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;"><strong>Changes:</strong> ${notif.status}</div>
                        ${notif.reason ? `<div style="font-size: 0.875rem; color: #6b7280;"><strong>Notes:</strong> ${notif.reason}</div>` : ''}
                      </div>`
                    : 
                      `<div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${notif.title}</div>
                            <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 4px;">
                                ${typeLabel} • ${dateStr}
                            </div>
                            ${notif.type === 'listing' && notif.rejection_reason ? `<div style="font-size: 0.875rem; color: #dc2626;"><strong>Reason:</strong> ${notif.rejection_reason}</div>` : ''}
                            ${notif.type === 'success_story' ? `<div style="font-size: 0.875rem; color: #6b7280;"><strong>Status:</strong> ${notif.status}</div>` : ''}
                        </div>
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: ${notif.type === 'success_story' && notif.status === 'rejected' ? '#fee2e2' : notif.type === 'success_story' && notif.status === 'listing_admin_approved' ? '#fef3c7' : notif.type === 'success_story' && notif.status === 'approved' ? '#dcfce7' : '#e5e7eb'}; color: ${notif.type === 'success_story' && notif.status === 'rejected' ? '#991b1b' : notif.type === 'success_story' && notif.status === 'listing_admin_approved' ? '#92400e' : notif.type === 'success_story' && notif.status === 'approved' ? '#15803d' : '#374151'};">${statusDisplay}</span>
                      </div>`
                    }
                </a>
            `;
        }).join('');
        
        // Add hover effect
        document.querySelectorAll('.notification-dropdown-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f9fafb';
            });
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
        });
    } catch (e) {
        console.error('Error loading notifications:', e);
        let container = document.querySelector('#notificationsDropdownContent');
        if (!container) {
            container = document.querySelector('#header-import #notificationsDropdownContent');
        }
        if (container) container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Error loading notifications</div>';
    }
}

// Close notifications dropdown when clicking outside
document.addEventListener('click', function(event) {
    // Look for button and dropdown in both locations
    let notifBtn = document.querySelector('#notifBtn');
    if (!notifBtn) notifBtn = document.querySelector('#header-import #notifBtn');
    
    let notifDropdown = document.querySelector('#notificationsDropdown');
    if (!notifDropdown) notifDropdown = document.querySelector('#header-import #notificationsDropdown');
    
    if (!notifBtn || !notifDropdown) return;
    
    const isClickInsideBtn = notifBtn.contains(event.target);
    const isClickInsideDropdown = notifDropdown.contains(event.target);
    
    if (!isClickInsideBtn && !isClickInsideDropdown && notifDropdown.style.display === 'block') {
        notifDropdown.style.display = 'none';
    }
});

// --- Register Handler ---
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const user_type = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'business';
    const errorEl = document.getElementById('register-error');
    if (errorEl) errorEl.textContent = '';

    try {
        const payload = { username: name, email, password, user_type };
        console.log('Registering with:', payload);
        
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log('Registration response:', data);
        
        if (!res.ok) {
            if (errorEl) errorEl.textContent = data.error || 'Registration failed';
            return;
        }
        
        // Store user data
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        
        // Check if email verification is required
        if (data.requiresVerification) {
            console.log('Email verification required');
            closeAuthModal();
            
            // Show verification modal if it exists
            if (typeof showEmailVerificationModal === 'function') {
                showEmailVerificationModal(email);
            } else {
                alert('Please check your email for the verification code.');
            }
        } else {
            // Legacy flow - no verification required
            alert(`Registration successful! Welcome, ${data.user.username}.`);
            setUserRole(data.user.role, data.user);
            closeAuthModal();
        }
    } catch (err) {
        console.error('Registration error:', err);
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
            // System admin redirects to index.html, others to admin dashboard
            if (data.user.admin_role === 'system_admin') {
                window.location.href = '/components/index.html';
            } else {
                window.location.href = '/admin-dashboard';
            }
        } else if (data.user.role === 'investor') {
            // Investors go to listings page
            window.location.href = '/components/listings.html';
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
  const dashboardBtn = document.getElementById('dashboardBtn');
  
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
      
      // Hide dashboard button for admins (only for business/investor users)
      if (dashboardBtn) {
        if (role === 'admin') {
          dashboardBtn.style.display = 'none';
        } else {
          dashboardBtn.style.display = '';
        }
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
          window.location.href = '/components/profile.html';
        };
      }
  }

  // Query admin/business link **inside loaded header**
  const adminNav = document.querySelector('#header-import a[href="#admin"]');
  if (adminNav) {
      if (role === 'admin') {
          adminNav.style.display = '';
          adminNav.textContent = 'Admin Panel';
          
          // Route to appropriate dashboard based on admin_role
          const userObj = user || {};
          const adminRole = userObj.admin_role;
          
          if (adminRole === 'head_admin') {
              adminNav.href = '/head-admin';
          } else if (adminRole === 'system_admin') {
              adminNav.href = '/system-admin';
              adminNav.textContent = 'System Admin';
          } else if (adminRole === 'verification_admin') {
              adminNav.href = '/verification-admin';
          } else {
              adminNav.href = '/admin-dashboard'; // fallback
          }
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

  // Show DATA tab for admins, business, and investors
  try {
      const dataTab = document.querySelector('#header-import .nav-data');
      if (dataTab) {
          if (role === 'admin' || role === 'business' || role === 'investor') {
              dataTab.style.display = '';
          } else {
              dataTab.style.display = 'none';
          }
      }
  } catch (e) { console.warn('Could not toggle data tab', e); }

  // Show 'Sell or Rent' button only for business users
  try {
      const submitBtn = document.querySelector('#header-import #submitListingBtn');
      if (submitBtn) {
          console.log('Setting submit button visibility - role:', role, 'user_type:', user?.user_type, 'isGuest:', isGuest);
          // Check if business by role OR by user_type (for backwards compatibility)
          const isBusiness = (role === 'business') || (user?.user_type === 'business');
          if (isBusiness && !isGuest) {
              console.log('Showing submit button for business user');
              submitBtn.style.display = '';
          } else {
              console.log('Hiding submit button');
              submitBtn.style.display = 'none';
          }
      }
  } catch (e) { console.warn('Could not toggle submit listing button', e); }

  document.querySelectorAll('.role-admin').forEach(el => el.style.display = role === 'admin' ? '' : 'none');

  // Always verify submit button visibility with server session to avoid stale client state
  checkSubmitVisibility().catch(e => console.warn('checkSubmitVisibility error', e));
}

// Check server session and toggle submit button visibility accordingly
async function checkSubmitVisibility() {
    try {
        const submitBtn = document.querySelector('#header-import #submitListingBtn');
        if (!submitBtn) {
            console.warn('submitListingBtn not found in DOM');
            return;
        }
        const res = await fetch('/api/session', { credentials: 'same-origin' });
        if (!res.ok) {
            console.warn('Session check failed:', res.status);
            submitBtn.style.display = 'none';
            // also hide submit section on page if present
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = 'none';
            return;
        }
        const data = await res.json();
        console.log('Session data in checkSubmitVisibility:', data);
        // Check if business by role OR by user_type (for backwards compatibility)
        const isBusiness = (data.user?.role === 'business') || (data.user?.user_type === 'business');
        if (data && data.authenticated && data.user && isBusiness) {
            // allow only business users to see the submit button and section
            console.log('Business user detected - showing submit button');
            submitBtn.style.display = '';
            // show submit section if present on this page
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = 'block';
        } else {
            console.log('Non-business user or not authenticated - hiding submit button');
            submitBtn.style.display = 'none';
            const submitSection = document.querySelector('#submitListing');
            if (submitSection) submitSection.style.display = 'none';
        }
    } catch (e) {
        console.error('checkSubmitVisibility failed:', e);
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
                        // System admin goes to index.html, others to admin dashboard
                        if (stored.admin_role === 'system_admin') {
                            window.location.href = '/components/index.html';
                        } else {
                            window.location.href = '/admin-dashboard';
                        }
                        return;
                    } else if (stored && stored.role === 'investor') {
                        // Investors go to listings
                        window.location.href = '/components/listings.html';
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
