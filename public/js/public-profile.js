// Public profile view functionality

let viewedUserId = null;
let currentLoggedInUserId = null;

// Initialize public profile page
async function initPublicProfile() {
  try {
    // Get user ID from URL
    const params = new URLSearchParams(window.location.search);
    viewedUserId = params.get('id');

    if (!viewedUserId) {
      showError('User ID not provided');
      return;
    }

    // Check if current user is logged in
    const sesRes = await fetch('/api/session', { credentials: 'same-origin' });
    const sesData = await sesRes.json();

    if (sesData.authenticated) {
      currentLoggedInUserId = sesData.user.id;
    }

    // Load user profile
    await loadPublicProfile();

    // Setup event listeners
    setupEventListeners();
  } catch (e) {
    console.error('Error initializing public profile:', e);
    showError('Failed to load profile');
  }
}

// Load public profile data
async function loadPublicProfile() {
  try {
    const res = await fetch(`/api/profile/${viewedUserId}/public`, {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      if (res.status === 404) {
        showError('User profile not found');
      } else {
        showError('Failed to load profile');
      }
      return;
    }

    const data = await res.json();
    displayPublicProfile(data);
  } catch (e) {
    console.error('Error loading public profile:', e);
    showError('Failed to load profile data');
  }
}

// Display public profile data
function displayPublicProfile(data) {
  // Update title
  document.getElementById('profileTitle').textContent = data.username || 'User Profile';

  // Display profile picture
  const profileInitials = document.getElementById('profileInitials');
  const profilePictureImg = document.getElementById('profilePictureImg');
  
  if (data.profile_picture_url) {
    profilePictureImg.src = data.profile_picture_url;
    profilePictureImg.style.display = 'block';
    profileInitials.style.display = 'none';
  } else {
    const initials = (data.username || '--')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    profileInitials.textContent = initials;
    profileInitials.style.display = 'inline';
    profilePictureImg.style.display = 'none';
  }
  document.getElementById('pictureSection').style.display = 'block';

  // Personal Info
  document.getElementById('nameDisplay').textContent = data.username || 'Not provided';
  document.getElementById('contactDisplay').textContent =
    data.contact_number || 'Not provided';
  document.getElementById('bioDisplay').textContent =
    data.bio || 'No bio added yet';

  // Stats
  document.getElementById('listingsCount').textContent = data.listings_count || 0;

  // Member since date
  if (data.created_at) {
    const date = new Date(data.created_at);
    const year = date.getFullYear();
    document.getElementById('memberSince').textContent = year;
  }

  // Show sections
  document.getElementById('infoSection').style.display = 'block';
  document.getElementById('statsSection').style.display = 'block';

  // Show contact button only if user is logged in and viewing someone else's profile
  if (currentLoggedInUserId && currentLoggedInUserId !== parseInt(viewedUserId)) {
    document.getElementById('contactBtn').style.display = 'block';
  }

  // Load user's listings
  loadUserListings();
}

// Load user's approved listings
async function loadUserListings() {
  try {
    const res = await fetch(`/api/user/${viewedUserId}/listings`, {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      console.warn('Could not load user listings');
      return;
    }

    const listings = await res.json();

    if (!listings || listings.length === 0) {
      return;
    }

    const listingsContainer = document.getElementById('listingsContainer');
    listingsContainer.innerHTML = '';

    listings.forEach(item => {
      const card = document.createElement('div');
      card.style.marginBottom = '16px';
      card.className = 'card listing-card';

      const img = item.image_url ? `style="background-image:url('${item.image_url}')"` : '';
      card.innerHTML = `
        <div class="property-photo" ${img}></div>
        <div class="title">${item.title || 'Untitled'}</div>
        <div class="muted description">${item.description || ''}</div>
        <div class="listing-meta">
          <div class="listing-price">${item.price ? '₱' + item.price : 'Price on request'}</div>
          <div class="listing-stats muted">${item.size ? (item.size + ' sqm') : ''}</div>
        </div>
        <div class="listing-actions">
          <button class="btn btn-primary" onclick="openInquiry(${item.id}, '${(item.title||'Listing').replace(/'/g, "\\'")}')">Send Inquiry</button>
          <button class="btn btn-ghost" onclick="viewDetailsById(${item.id})">View Details</button>
        </div>
      `;
      listingsContainer.appendChild(card);
    });

    document.getElementById('listingsSection').style.display = 'block';
  } catch (e) {
    console.error('Error loading user listings:', e);
  }
}

// Setup event listeners
function setupEventListeners() {
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      // Open a contact modal or navigate to contact form
      alert(
        `To contact this user, you can send them an inquiry on one of their listings or try to reach out through the inquiry system.`
      );
    });
  }
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.className = 'error-message';
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPublicProfile);

// Load header
(async () => {
  try {
    const resp = await fetch('../components/header.html');
    if (!resp.ok) throw new Error(`Failed to load header (status ${resp.status})`);
    document.getElementById('header-import').innerHTML = await resp.text();
  } catch (err) {
    console.error('Could not load header:', err);
  }
})();
