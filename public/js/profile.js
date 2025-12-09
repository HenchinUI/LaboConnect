// Profile page functionality

let isEditMode = false;
let currentUserId = null;
let originalProfileData = {};

// Initialize profile page
async function initProfile() {
  try {
    // Check if user is logged in
    const sesRes = await fetch('/api/session', { credentials: 'same-origin' });
    const sesData = await sesRes.json();

    if (!sesData.authenticated) {
      window.location.href = '/components/index.html';
      return;
    }

    currentUserId = sesData.user.id;

    // Load user profile
    await loadProfile();

    // Load notifications
    await loadNotifications();

    // Setup event listeners
    setupEventListeners();
  } catch (e) {
    console.error('Error initializing profile:', e);
    showMessage('Failed to load profile', 'error');
  }
}

// Load profile data from server
async function loadProfile() {
  try {
    const res = await fetch(`/api/profile/${currentUserId}`, {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error('Failed to load profile');
    }

    const data = await res.json();
    originalProfileData = { ...data };

    // Display profile data
    displayProfile(data);
  } catch (e) {
    console.error('Error loading profile:', e);
    showMessage('Failed to load profile data', 'error');
  }
}

// Display profile data in view mode
function displayProfile(data) {
  // Profile Picture
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

  // Personal Info
  document.getElementById('nameDisplay').textContent = data.username || 'Not provided';
  document.getElementById('emailDisplay').textContent = data.email || 'Not provided';
  document.getElementById('contactDisplay').textContent =
    data.contact_number || 'Not provided';

  // Bio
  document.getElementById('bioDisplay').textContent =
    data.bio || 'No bio added yet';

  // Populate edit fields
  document.getElementById('fullNameInput').value = data.username || '';
  document.getElementById('emailInput').value = data.email || '';
  document.getElementById('contactInput').value = data.contact_number || '';
  document.getElementById('bioInput').value = data.bio || '';

  // Update stats
  document.getElementById('listingsCount').textContent = data.listings_count || 0;
  document.getElementById('inquiriesCount').textContent =
    data.inquiries_count || 0;

  // Member since date
  if (data.created_at) {
    const date = new Date(data.created_at);
    const year = date.getFullYear();
    document.getElementById('memberSince').textContent = year;
  }

  // Update profile name in header
  if (data.username) {
    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) {
      profileNameEl.textContent = data.username;
    }
    localStorage.setItem(
      'laboCurrentUser',
      JSON.stringify({
        ...JSON.parse(localStorage.getItem('laboCurrentUser') || '{}'),
        username: data.username,
        email: data.email
      })
    );
  }
}

// Load listing status notifications
async function loadNotifications() {
  try {
    const res = await fetch('/api/listing-notifications', {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      console.warn('Failed to load notifications');
      return;
    }

    const notifications = await res.json();
    displayNotifications(notifications);
  } catch (e) {
    console.error('Error loading notifications:', e);
  }
}

// Display notifications
function displayNotifications(notifications) {
  const container = document.getElementById('notificationsContainer');
  const noMessage = document.getElementById('noNotificationsMessage');

  if (!notifications || notifications.length === 0) {
    container.innerHTML = '';
    noMessage.style.display = 'block';
    return;
  }

  noMessage.style.display = 'none';
  container.innerHTML = notifications.map(notif => {
    const isRejected = notif.status === 'rejected';
    const icon = isRejected ? '❌' : '✅';
    const statusColor = isRejected ? '#991b1b' : '#166534';
    const bgColor = isRejected ? '#fef2f2' : '#f0fdf4';
    const borderColor = isRejected ? '#dc2626' : '#22c55e';

    return `
      <div style="
        background: ${bgColor};
        border-left: 4px solid ${borderColor};
        padding: 16px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: start;
      ">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 18px;">${icon}</span>
            <span style="font-weight: 600; color: ${statusColor};">
              Listing ${notif.status.charAt(0).toUpperCase() + notif.status.slice(1)}
            </span>
          </div>
          <p style="margin: 0 0 8px 0; color: var(--text); font-size: 14px;">
            <strong>${notif.listing_title}</strong>
          </p>
          ${notif.reason ? `
            <p style="margin: 0; color: var(--text-muted); font-size: 13px;">
              <strong>Reason:</strong> ${notif.reason}
            </p>
          ` : ''}
          <p style="margin: 8px 0 0 0; color: var(--text-muted); font-size: 12px;">
            ${new Date(notif.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button 
          onclick="deleteNotification(${notif.id})" 
          style="
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            margin-left: 12px;
          "
          title="Delete notification"
        >
          ×
        </button>
      </div>
    `;
  }).join('');
}

// Delete notification
async function deleteNotification(notifId) {
  try {
    const res = await fetch(`/api/listing-notifications/${notifId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (res.ok) {
      await loadNotifications();
    }
  } catch (e) {
    console.error('Error deleting notification:', e);
  }
}

// Setup event listeners
function setupEventListeners() {
  const editToggleBtn = document.getElementById('editToggleBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const shareProfileBtn = document.getElementById('shareProfileBtn');
  const uploadPictureBtn = document.getElementById('uploadPictureBtn');
  const profilePictureInput = document.getElementById('profilePictureInput');

  editToggleBtn.addEventListener('click', toggleEditMode);
  saveProfileBtn.addEventListener('click', saveProfile);
  cancelEditBtn.addEventListener('click', cancelEdit);
  shareProfileBtn.addEventListener('click', shareProfile);
  uploadPictureBtn.addEventListener('click', () => profilePictureInput.click());
  profilePictureInput.addEventListener('change', handleProfilePictureChange);
}

// Toggle edit mode
function toggleEditMode() {
  isEditMode = !isEditMode;

  const viewModeEls = document.querySelectorAll('.view-mode');
  const editModeEls = document.querySelectorAll('.edit-mode');
  const editToggleBtn = document.getElementById('editToggleBtn');
  const formActions = document.querySelector('.edit-mode.form-actions');

  if (isEditMode) {
    viewModeEls.forEach(el => (el.style.display = 'none'));
    editModeEls.forEach(el => (el.style.display = 'block'));
    editToggleBtn.textContent = 'Cancel';
    formActions.style.display = 'flex';
  } else {
    viewModeEls.forEach(el => (el.style.display = 'block'));
    editModeEls.forEach(el => (el.style.display = 'none'));
    editToggleBtn.textContent = 'Edit Profile';
    formActions.style.display = 'none';
  }
}

// Save profile changes
async function saveProfile() {
  try {
    const fullName = document.getElementById('fullNameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const contact = document.getElementById('contactInput').value.trim();
    const bio = document.getElementById('bioInput').value.trim();

    // Validation
    if (!fullName) {
      showMessage('Full name is required', 'error');
      return;
    }

    if (!email) {
      showMessage('Email is required', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    // Contact validation (optional, but if provided should start with +)
    if (contact && !contact.startsWith('+')) {
      showMessage(
        'Contact number should start with + (e.g., +63 912 345 6789)',
        'error'
      );
      return;
    }

    const payload = {
      username: fullName,
      email,
      contact_number: contact,
      bio
    };

    const res = await fetch(`/api/profile/${currentUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save profile');
    }

    const updatedData = await res.json();
    originalProfileData = { ...updatedData };

    showMessage('Profile updated successfully!', 'success');

    // Exit edit mode
    setTimeout(() => {
      isEditMode = true; // Set to true so toggle will set it to false
      toggleEditMode();

      // Refresh display
      displayProfile(updatedData);
    }, 500);
  } catch (e) {
    console.error('Error saving profile:', e);
    showMessage(e.message || 'Failed to save profile', 'error');
  }
}

// Cancel edit mode
function cancelEdit() {
  // Restore original values
  document.getElementById('fullNameInput').value = originalProfileData.username || '';
  document.getElementById('emailInput').value = originalProfileData.email || '';
  document.getElementById('contactInput').value =
    originalProfileData.contact_number || '';
  document.getElementById('bioInput').value = originalProfileData.bio || '';

  toggleEditMode();
}

// Handle profile picture selection and upload
async function handleProfilePictureChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showPictureMessage('Please select a valid image file', 'error');
    return;
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    showPictureMessage('Image must be smaller than 5MB', 'error');
    return;
  }

  try {
    showPictureMessage('Uploading...', 'loading');

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('profile_picture', file);

    const res = await fetch(`/api/profile/${currentUserId}/picture`, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload picture');
    }

    const data = await res.json();
    showPictureMessage('Picture uploaded successfully!', 'success');

    // Update preview immediately
    const profilePictureImg = document.getElementById('profilePictureImg');
    const profileInitials = document.getElementById('profileInitials');
    profilePictureImg.src = data.profile_picture_url;
    profilePictureImg.style.display = 'block';
    profileInitials.style.display = 'none';

    // Update original data
    originalProfileData.profile_picture_url = data.profile_picture_url;

    // Clear file input
    e.target.value = '';

    setTimeout(() => {
      document.getElementById('pictureUploadMessage').innerHTML = '';
    }, 3000);
  } catch (e) {
    console.error('Error uploading picture:', e);
    showPictureMessage(e.message || 'Failed to upload picture', 'error');
  }
}

// Show picture upload message
function showPictureMessage(message, type) {
  const messageEl = document.getElementById('pictureUploadMessage');
  if (type === 'loading') {
    messageEl.innerHTML = `<div style="font-size: 13px; color: var(--muted);">${message}</div>`;
  } else if (type === 'success') {
    messageEl.innerHTML = `<div style="font-size: 13px; color: #065f46; background: #d1fae5; padding: 8px 12px; border-radius: 6px; border: 1px solid #a7f3d0;">${message}</div>`;
  } else {
    messageEl.innerHTML = `<div style="font-size: 13px; color: #991b1b; background: #fee2e2; padding: 8px 12px; border-radius: 6px; border: 1px solid #fca5a5;">${message}</div>`;
  }
}

// Show message
function showMessage(message, type) {
  const messageEl = document.getElementById('profileMessage');
  const className = type === 'success' ? 'success-message' : 'error-message';

  messageEl.className = className;
  messageEl.textContent = message;
  messageEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 4000);
  }
}

// Share profile - copy link to clipboard
async function shareProfile() {
  try {
    const profileUrl = `${window.location.origin}/components/public-profile.html?id=${currentUserId}`;
    
    // Try to use native share API if available
    if (navigator.share) {
      await navigator.share({
        title: 'Check out my LaboConnect Profile!',
        text: `Check out my profile on LaboConnect`,
        url: profileUrl
      });
      showMessage('Profile shared!', 'success');
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(profileUrl);
      showMessage('Profile link copied to clipboard!', 'success');
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Error sharing profile:', e);
      showMessage('Failed to share profile', 'error');
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProfile);

// Also load header and ensure profile button works
(async () => {
  try {
    const resp = await fetch('../components/header.html');
    if (!resp.ok) throw new Error(`Failed to load header (status ${resp.status})`);
    document.getElementById('header-import').innerHTML = await resp.text();

    // Wire logout button after header loads
    setTimeout(() => {
      const logoutBtn = document.querySelector('#header-import #logoutBtn');
      const profileBtn = document.getElementById('profileBtn');
      
      if (logoutBtn && !logoutBtn._wired) {
        logoutBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (typeof logoutUser === 'function') {
            logoutUser();
          }
        });
        logoutBtn._wired = true;
      }
      
      if (profileBtn) {
        profileBtn.addEventListener('click', () => {
          window.location.href = '/components/profile.html';
        });
      }
    }, 100);
  } catch (err) {
    console.error('Could not load header:', err);
  }
})();
