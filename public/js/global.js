function scrollToSection(section){
  document.querySelector(section).scrollIntoView({behavior:'smooth'});
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
function loadSession() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    if (user && user.role) {
        setUserRole(user.role, user);
    } else {
        setUserRole('guest');
    }
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        setUserRole(user.role, user);
        closeAuthModal();
        
        if (user.role === 'admin') {
             window.location.href = '../components/admin-dashboard.html'; 
        } else if (window.location.pathname.includes('/admin/')) {
            window.location.href = '../admin-dashboard.htm';
        }

        alert(`Welcome back, ${user.name}! You are logged in as a ${user.role}.`);

    } else {
        errorEl.textContent = 'Invalid email or password.';
    }
}

// Register Handler
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';
    
    const users = getUsers();

    if (users.some(u => u.email === email)) {
        errorEl.textContent = 'An account with this email already exists.';
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        role: role
    };

    users.push(newUser);
    saveUsers(users);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setUserRole(newUser.role, newUser);
    closeAuthModal();

    alert(`Registration successful! Welcome, ${newUser.name}. You are logged in as a ${newUser.role}.`);
    
    if (newUser.role === 'admin') {
         window.location.href = 'components/admin-dashboard.html'; 
    }
}

// Logout Handler
function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUserRole('guest');
    alert('You have been logged out.');
    if (!window.location.pathname.endsWith('index.html')) {
        window.location.href = '../components/index.html';
    }
}

// Set UI based on role
function setUserRole(role, user) {
  const isGuest = role === 'guest';
  const headerBtn = document.getElementById('profileBtn');

  // Query admin/business link **inside loaded header**
  const adminNav = document.querySelector('#header-import a[href="#admin"]');
  if (adminNav) {
      if (role === 'admin') {
          adminNav.style.display = '';
          adminNav.href = '../components/admin-dashboard.html';
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

  document.querySelectorAll('.role-admin').forEach(el => el.style.display = role === 'admin' ? '' : 'none');

  const nameEl = document.getElementById('profileName');
  const avatar = document.getElementById('profileAvatar');

  if (isGuest) {
      nameEl.textContent = 'Guest';
      avatar.src = 'assets/img/user-profile-placeholder.jpg';
      if (headerBtn) headerBtn.onclick = openGuest;
  } else {
      nameEl.textContent = user?.name || (role === 'admin' ? 'BPLO Admin' : 'Business Owner');
      avatar.src = user?.avatar || 'assets/img/user-profile-placeholder.jpg';
      if (headerBtn) headerBtn.onclick = () => alert(`You are logged in as: ${role}. Click Logout in the Admin or Business dashboard to log out.`);
  }
}

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

// Load header dynamically
fetch("../components/header.html")
  .then(res => res.text())
  .then(data => {
    document.querySelector("#header-import").innerHTML = data;

    // **Header loaded, safe to update roles**
    loadSession();

    const profileBtn = document.querySelector('#header-import #profileBtn') || document.querySelector('#header-import .labo-user');
    if (profileBtn && !profileBtn.onclick) {
      profileBtn.onclick = openGuest;
    }

    const headerRow2 = document.querySelector('#header-import .labo-row-2');
    if (headerRow2) {
        const p = (location.pathname || '').toLowerCase();
        const href = (location.href || '').toLowerCase();
        const isHome = p.endsWith('/') || p.endsWith('/index.html') || href.includes('index.html');
        headerRow2.style.display = isHome ? '' : 'none';
    }
  });

// Load auth modal dynamically
function openGuest() {
    if (document.getElementById('authModal')) {
        openAuthModal();
        return;
    }
    fetch("../components/authModal.html")
      .then(res => res.text())
      .then(data => {
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
                      document.body.appendChild(newScript).parentNode.removeChild(newScript);
                  } else {
                      document.body.appendChild(node.cloneNode(true));
                  }
              }
          });
          openAuthModal();
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
