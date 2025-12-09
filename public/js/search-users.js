// Search Users functionality

let allUsers = [];
let currentFilter = 'all';

// Initialize search page
async function initSearchUsers() {
  // Load header
  try {
    const resp = await fetch('../components/header.html');
    if (!resp.ok) throw new Error(`Failed to load header (status ${resp.status})`);
    document.getElementById('header-import').innerHTML = await resp.text();
  } catch (err) {
    console.error('Could not load header:', err);
  }

  // Load all users
  await loadAllUsers();

  // Setup event listeners
  setupEventListeners();
}

// Load all users from server
async function loadAllUsers() {
  try {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = 'block';

    const res = await fetch('/api/users/search', {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error('Failed to load users');
    }

    allUsers = await res.json();
    loadingState.style.display = 'none';

    // Display initial results
    renderUsers(allUsers);
  } catch (e) {
    console.error('Error loading users:', e);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('searchResults').innerHTML =
      '<div style="grid-column: 1/-1; text-align: center; color: var(--muted);">Could not load users</div>';
  }
}

// Setup event listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    performSearch(query);
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      const searchQuery = document.getElementById('searchInput').value.toLowerCase();
      performSearch(searchQuery);
    });
  });
}

// Perform search
function performSearch(query) {
  let filtered = allUsers;

  // Filter by search query
  if (query) {
    filtered = allUsers.filter(user =>
      user.username.toLowerCase().includes(query) ||
      (user.bio && user.bio.toLowerCase().includes(query))
    );
  }

  // Filter by active status
  if (currentFilter === 'active') {
    filtered = filtered.filter(user => user.listings_count > 0);
  }

  renderUsers(filtered, query.length === 0);
}

// Render users
function renderUsers(users, isInitial = false) {
  const resultsContainer = document.getElementById('searchResults');
  const emptyState = document.getElementById('emptyState');

  if (users.length === 0) {
    resultsContainer.innerHTML = '';
    if (isInitial) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      resultsContainer.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; color: var(--muted);">No users found</div>';
    }
    return;
  }

  emptyState.style.display = 'none';
  resultsContainer.innerHTML = '';

  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';

    const initials = user.username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const avatarContent = user.profile_picture_url 
      ? `<img src="${user.profile_picture_url}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover;">`
      : initials;

    card.innerHTML = `
      <div class="user-avatar" style="overflow: hidden;">${avatarContent}</div>
      <div class="user-name">${user.username}</div>
      
      ${user.contact_number ? `<div class="user-info">📞 ${user.contact_number}</div>` : ''}
      
      ${user.bio ? `<div class="user-bio">${escapeHtml(user.bio)}</div>` : ''}
      
      <div class="user-stats">
        <div class="stat">
          <div class="stat-value">${user.listings_count || 0}</div>
          <div class="stat-label">Listings</div>
        </div>
        <div class="stat">
          <div class="stat-value">${new Date(user.created_at).getFullYear()}</div>
          <div class="stat-label">Member</div>
        </div>
      </div>
      
      <div class="user-actions">
        <button class="btn btn-primary" onclick="viewUserProfile(${user.id})">View Profile</button>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}

// View user profile
function viewUserProfile(userId) {
  window.location.href = `/components/public-profile.html?id=${userId}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initSearchUsers);
