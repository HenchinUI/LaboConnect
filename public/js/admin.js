// admin.js — revised with clickable medium-sized images

let currentAppId = null;
let pendingListings = [];
let approvedListings = [];
let rejectedListings = [];
let currentView = 'pending'; // 'pending' | 'approved' | 'rejected'
let currentListings = [];
let selectionActive = false;

// Helper function to format property type for display
function formatPropertyType(type) {
  if (!type) return 'Listing';
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Image preview function
function previewImage(imageUrl) {
  const modal = document.getElementById('imagePreviewModal');
  const preview = document.getElementById('imagePreview');
  preview.src = imageUrl;
  modal.classList.add('open');
}

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Inject admin header only if not already loaded (global.js may have loaded it)
  const headerImportEl = document.getElementById('header-import');
  if (!headerImportEl || headerImportEl.innerHTML.trim() === '') {
    fetch('/components/header.html')
      .then(r => { if (!r.ok) throw r; return r.text(); })
      .then(html => {
        // only inject if still empty (race-safe)
        if (headerImportEl && headerImportEl.innerHTML.trim() === '') {
          headerImportEl.innerHTML = html;
          attachHeaderListeners();
        } else {
          attachHeaderListeners();
        }
      })
      .catch(() => {
        console.warn('Failed to load header.');
        attachHeaderListeners();
      });
  } else {
    attachHeaderListeners();
  }

  // Update dashboard title based on admin role
  // NOTE: This will call switchView internally after role is determined
  updateDashboardForRole();

  // Handle reason select change for verification modal
  const reasonSelect = document.getElementById('verificationReason');
  if (reasonSelect) {
    reasonSelect.addEventListener('change', function() {
      const customReasonDiv = document.getElementById('customReasonDiv');
      if (this.value === 'custom') {
        customReasonDiv.style.display = 'flex';
      } else {
        customReasonDiv.style.display = 'none';
      }
    });
  }
  
  // Close modal when clicking overlay
  const modal = document.getElementById('verificationReasonModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeVerificationModal();
      }
    });
  }

  // Setup image preview modal close handlers
  const imagePreviewModal = document.getElementById('imagePreviewModal');
  if (imagePreviewModal) {
    // Close on background click
    imagePreviewModal.addEventListener('click', (e) => {
      if (e.target === imagePreviewModal) {
        closeImagePreview();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imagePreviewModal.classList.contains('open')) {
        closeImagePreview();
      }
    });
  }
});

// ---------------- Header & Logout ----------------
function attachHeaderListeners() {
  try {
    const profileBtn = document.querySelector('#header-import #profileBtn');
    const notifBtn = document.querySelector('#header-import #notifBtn');
    const logoutBtn = document.querySelector('#header-import #logoutBtn');

    if (notifBtn && !notifBtn._wired) {
      notifBtn.addEventListener('click', (ev) => { ev.preventDefault(); openNotifications(); });
      notifBtn._wired = true;
    }
    if (logoutBtn && !logoutBtn._wired) {
      logoutBtn.addEventListener('click', (ev) => { ev.preventDefault(); logoutUser(); });
      logoutBtn._wired = true;
    }
    if (profileBtn && !profileBtn._wired) {
      profileBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        try { const stored = JSON.parse(localStorage.getItem('laboCurrentUser')); if (stored && stored.role === 'admin') { window.location.href = '/components/admin-dashboard.html'; return; } } catch(e){}
        window.location.href = '/components/business/index.html';
      });
      profileBtn._wired = true;
    }
  } catch (e) {
    console.warn('attachHeaderListeners failed', e);
  }
}

// Update dashboard based on admin role
async function updateDashboardForRole() {
  try {
    const response = await fetch('/api/admin/user-info');
    const data = await response.json();
    const adminRole = data.user.admin_role;
    
    // Hide all sections
    document.getElementById('listing-admin-section').classList.remove('active');
    document.getElementById('verification-admin-section').classList.remove('active');
    document.getElementById('head-admin-section').classList.remove('active');
    
    // Update title and role badge
    const titleEl = document.getElementById('dashboardTitle');
    const badgeEl = document.getElementById('roleBadge');
    
    if (adminRole === 'head_admin') {
      titleEl.textContent = 'Head Admin Dashboard';
      badgeEl.textContent = 'Head Admin (Super Admin)';
      document.getElementById('head-admin-section').classList.add('active');
      loadHeadAdminData();
    } else if (adminRole === 'listing_admin') {
      titleEl.textContent = 'Listing Admin Dashboard';
      badgeEl.textContent = 'Listing Admin';
      document.getElementById('listing-admin-section').classList.add('active');
      loadListingAdminData();
    } else if (adminRole === 'verification_admin') {
      titleEl.textContent = 'Verification Admin Dashboard';
      badgeEl.textContent = 'Verification Admin';
      document.getElementById('verification-admin-section').classList.add('active');
      loadVerificationAdminData();
    }
    
  } catch (err) {
    console.warn('Could not update dashboard for role:', err);
  }
}

// Load data for Listing Admin
function loadListingAdminData() {
  switchView('pending');
  loadAdminStats();
  loadPendingStories();
}

// Load data for Verification Admin
async function loadVerificationAdminData() {
  try {
    const response = await fetch('/api/admin/verifications/pending');
    const data = await response.json();
    renderVerificationQueue(data);
    
    // Load stats for verification admin
    loadVerificationStats();
  } catch (err) {
    console.warn('Error loading verifications:', err);
  }
}

async function loadVerificationStats() {
  try {
    const response = await fetch('/api/admin/verifications/stats');
    const stats = await response.json();
    
    // Update verification stats
    const pending = document.getElementById('stat-verify-pending');
    const verified = document.getElementById('stat-verified');
    const rejected = document.getElementById('stat-verify-rejected');
    
    if (pending) pending.textContent = stats.pending || 0;
    if (verified) verified.textContent = stats.verified || 0;
    if (rejected) rejected.textContent = stats.rejected || 0;
  } catch (err) {
    console.warn('Error loading verification stats:', err);
  }
}

// Load data for Head Admin
function loadHeadAdminData() {
  switchView('pending');
  loadAdminStats();
  loadAdminsList();
  loadHeadAdminStories();
}

function renderVerificationQueue(requests) {
  const container = document.getElementById('verificationsList');
  if (!requests || requests.length === 0) {
    container.innerHTML = '<p class="muted">No pending verification requests</p>';
    return;
  }
  
  container.innerHTML = requests.map(req => `
    <div class="admin-item">
      <div class="admin-item-title">${req.user_name || 'Unknown User'}</div>
      <div class="admin-item-meta">Email: ${req.user_email || 'N/A'}</div>
      <div class="admin-item-meta">Phone: ${req.phone_number || 'N/A'}</div>
      <div class="admin-item-meta">Status: <strong>${req.status.replace('_', ' ').toUpperCase()}</strong></div>
      ${req.id_document_url ? `<div class="admin-item-meta"><a href="${req.id_document_url}" target="_blank" class="link">View Document</a></div>` : ''}\n      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn btn-secondary" onclick="viewVerificationDetails(${req.id})">View Details</button>
        <button class="btn btn-success" onclick="showVerificationModal(${req.id}, 'approve')">Verify</button>
        <button class="btn btn-danger" onclick="showVerificationModal(${req.id}, 'reject')">Reject</button>
      </div>
    </div>
  `).join('');
}

function viewVerificationDetails(requestId) {
  // Fetch the verification details from the server
  fetch(`/api/admin/verification/${requestId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }
      
      // Show modal with all verification details
      const modal = document.getElementById('adminModal');
      const title = document.getElementById('modalTitle');
      const body = document.getElementById('modalBody');
      const actions = document.getElementById('modalActions');
      
      title.textContent = 'Verification Details';
      
      // Build the details HTML
      let detailsHTML = `
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937;">User Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Username</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.username || 'N/A'}</p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Email</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.email || 'N/A'}</p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">User Type</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.user_type || 'N/A'}</p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Role</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.role || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937;">Verification Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Verification Email</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>${data.email || 'N/A'}</strong></p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Status</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${(data.status || 'N/A').replace('_', ' ').toUpperCase()}</span></p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Submitted On</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <label style="font-weight: 600; color: #6b7280; display: block; font-size: 12px;">Last Updated</label>
              <p style="margin: 4px 0 0 0; font-size: 14px;">${data.updated_at ? new Date(data.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      `;
      
      if (data.id_document_url) {
        detailsHTML += `
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #1f2937;">Valid ID Document</h3>
            <img src="${data.id_document_url}" alt="Valid ID" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer;" onclick="previewImage('${data.id_document_url}')">
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;"><a href="${data.id_document_url}" target="_blank" style="color: #667eea; text-decoration: none;">View full size</a></p>
          </div>
        `;
      }
      
      if (data.selfie_photo_url) {
        detailsHTML += `
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #1f2937;">User Selfie</h3>
            <img src="${data.selfie_photo_url}" alt="User Selfie" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer;" onclick="previewImage('${data.selfie_photo_url}')">
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;"><a href="${data.selfie_photo_url}" target="_blank" style="color: #667eea; text-decoration: none;">View full size</a></p>
          </div>
        `;
      }
      
      if (data.rejection_reason) {
        detailsHTML += `
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #991b1b;">Rejection Reason</h3>
            <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${data.rejection_reason}</p>
          </div>
        `;
      }
      
      body.innerHTML = detailsHTML;
      
      // Set modal actions
      actions.innerHTML = `
        <button class="btn btn-ghost" onclick="closeAppModal()">Close</button>
        <button class="btn btn-success" onclick="showVerificationModal(${requestId}, 'approve')">Verify</button>
        <button class="btn btn-danger" onclick="showVerificationModal(${requestId}, 'reject')">Reject</button>
      `;
      
      // Open modal
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    })
    .catch(err => {
      console.error('Error fetching verification details:', err);
      alert('Error loading verification details');
    });
}

let currentVerificationAction = { id: null, action: null };

function showVerificationModal(requestId, action) {
  currentVerificationAction = { id: requestId, action };
  
  // For approve action, directly approve without asking for reason
  if (action === 'approve') {
    submitVerificationDecision('approve', null);
    return;
  }
  
  // For reject action, show modal to get reason
  const modal = document.getElementById('verificationReasonModal');
  const title = modal.querySelector('h2');
  const reasonSelect = document.getElementById('verificationReason');
  const customReasonDiv = document.getElementById('customReasonDiv');
  const customReasonInput = document.getElementById('customReason');
  
  // Set title
  title.textContent = 'Reject Verification';
  
  // Rejection reasons
  reasonSelect.innerHTML = `
    <option value="">Select a reason...</option>
    <option value="invalid_document">Invalid Document</option>
    <option value="unclear_photo">Unclear Photo</option>
    <option value="expired_id">Expired ID</option>
    <option value="suspicious_activity">Suspicious Activity</option>
    <option value="custom">Custom Reason</option>
  `;
  
  customReasonDiv.style.display = 'none';
  customReasonInput.value = '';
  reasonSelect.value = '';
  
  modal.style.display = 'flex';
}

function closeVerificationModal() {
  document.getElementById('verificationReasonModal').style.display = 'none';
  currentVerificationAction = { id: null, action: null };
}

async function submitVerificationDecision(action, reason) {
  const { id } = currentVerificationAction;
  
  if (!id) {
    showToast('No verification selected', 'error');
    return;
  }
  
  // For reject, get reason from modal
  if (action === 'reject') {
    const reasonSelect = document.getElementById('verificationReason');
    const customReason = document.getElementById('customReason').value;
    
    reason = reasonSelect.value;
    if (reason === 'custom') {
      reason = customReason;
      if (!reason.trim()) {
        showToast('Please enter a custom reason', 'error');
        return;
      }
    } else if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }
  }
  
  const endpoint = action === 'approve' 
    ? `/api/admin/verification/${id}/approve`
    : `/api/admin/verification/${id}/reject`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || '' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to process verification');
    }
    
    showToast(`Verification ${action}ed successfully`, 'success');
    closeVerificationModal();
    loadVerificationAdminData();
  } catch (err) {
    console.error('Error:', err);
    showToast(`Error: ${err.message}`, 'error');
  }
}

function switchHeadAdminTab(tab) {
  // Hide all tabs
  document.querySelectorAll('#head-admin-section > div[id$="-tab"]').forEach(el => {
    el.classList.remove('active');
  });
  
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected tab
  const tabEl = document.getElementById(tab + '-tab');
  if (tabEl) {
    tabEl.classList.add('active');
    event.target.classList.add('active');
    
    // Load data for listings tab
    if (tab === 'listings') {
      loadAdminStats();
    }
    // Load data for success stories tab
    else if (tab === 'success-stories') {
      loadHeadAdminStories();
    }
  }
}

function switchHeadAdminStoriesView(view) {
  // Hide all story views
  document.getElementById('pending-stories-view').style.display = 'none';
  document.getElementById('published-stories-view').style.display = 'none';
  document.getElementById('rejected-stories-view').style.display = 'none';
  
  // Show selected view
  if (view === 'pending') {
    document.getElementById('pending-stories-view').style.display = 'block';
  } else if (view === 'published') {
    document.getElementById('published-stories-view').style.display = 'block';
  } else if (view === 'rejected') {
    document.getElementById('rejected-stories-view').style.display = 'block';
  }
}

async function loadAdminsList() {
  try {
    const response = await fetch('/api/admin/all-admins');
    const admins = await response.json();
    
    const container = document.getElementById('adminsList');
    if (!admins || admins.length === 0) {
      container.innerHTML = '<p class="muted">No admin accounts found</p>';
      return;
    }
    
    container.innerHTML = admins.map(admin => `
      <div class="admin-item">
        <div class="admin-item-title">${admin.username}</div>
        <div class="admin-item-meta">Email: ${admin.email}</div>
        <div class="admin-item-meta">Role: <strong>${admin.admin_role.replace('_', ' ').toUpperCase()}</strong></div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Error loading admins:', err);
  }
}

function openCreateAdminModal() {
  // First, fetch user info to determine what roles they can create
  fetch('/api/admin/user-info')
    .then(r => r.json())
    .then(data => {
      const adminRole = data.user.admin_role;
      const roleSelect = document.getElementById('adminRole');
      
      // Clear existing options
      roleSelect.innerHTML = '<option value="">Select role</option>';
      
      // Add options based on admin role
      if (adminRole === 'head_admin') {
        roleSelect.innerHTML += `
          <option value="listing_admin">Listing Admin</option>
          <option value="verification_admin">Verification Admin</option>
          <option value="system_admin">System Admin</option>
          <option value="head_admin">Head Admin</option>
        `;
        document.getElementById('createAdminHint').textContent = 'As Head Admin, you can create any admin role.';
      } else if (adminRole === 'listing_admin') {
        roleSelect.innerHTML += `<option value="listing_admin">Listing Admin</option>`;
        document.getElementById('createAdminHint').textContent = 'As Listing Admin, you can only create other Listing Admins.';
      } else if (adminRole === 'verification_admin') {
        roleSelect.innerHTML += `<option value="verification_admin">Verification Admin</option>`;
        document.getElementById('createAdminHint').textContent = 'As Verification Admin, you can only create other Verification Admins.';
      }
      
      document.getElementById('createAdminModal').classList.add('open');
    })
    .catch(err => {
      console.error('Error loading user info:', err);
      alert('Error loading admin roles');
    });
}

function closeCreateAdminModal() {
  document.getElementById('createAdminModal').classList.remove('open');
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminRole').value = '';
}

async function submitCreateAdmin(event) {
  event.preventDefault();
  
  const username = document.getElementById('adminUsername').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const adminRole = document.getElementById('adminRole').value;
  
  if (!username || !email || !password || !adminRole) {
    alert('Please fill all required fields');
    return;
  }
  
  try {
    const response = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, adminRole })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    alert('Admin account created successfully!');
    closeCreateAdminModal();
    loadAdminsList();
  } catch (err) {
    console.error('Error creating admin:', err);
    alert('Error: ' + err.message);
  }
}

function logout() {
  if (typeof logoutUser === 'function') {
    logoutUser();
  } else {
    alert('Logging out (demo) - user management not loaded.');
    window.location = '../index.html';
  }
}

// ---------------- Load Listings ----------------
// Load listings for a specific view. Tries multiple endpoint fallbacks for compatibility.
async function loadListings(status = 'pending') {
  currentView = status;
  
  // Find the correct tbody based on which section is active
  let tbody = null;
  const headAdminSection = document.getElementById('head-admin-section');
  const listingAdminSection = document.getElementById('listing-admin-section');
  
  if (headAdminSection?.classList.contains('active')) {
    console.log('[loadListings] Head admin section is active, finding tbody within it');
    tbody = headAdminSection.querySelector('tbody#appsTable');
  } else if (listingAdminSection?.classList.contains('active')) {
    console.log('[loadListings] Listing admin section is active, finding tbody within it');
    tbody = listingAdminSection.querySelector('tbody#appsTable');
  } else {
    console.log('[loadListings] No active section found, using fallback');
    tbody = document.getElementById("appsTable");
  }
  
  if (!tbody) {
    console.warn('[loadListings] appsTable element not found in DOM');
    return;
  }
  
  console.log(`[loadListings] START - status="${status}", tbody found:`, tbody.parentElement?.parentElement?.className);
  
  tbody.innerHTML = "";
  const titleEl = document.getElementById('appsTitle');
  if (titleEl) {
    titleEl.textContent = status === 'pending' ? 'Pending Listings' : (status === 'approved' ? 'Approved Listings' : 'Rejected Listings');
  }
  // clear selection state when loading a new view
  selectionActive = false;
  const tableWrap = document.querySelector('.admin-table-wrap');
  if (tableWrap) tableWrap.classList.remove('selection-active');

  // Try new role-based endpoints first
  const user = JSON.parse(localStorage.getItem('laboCurrentUser')) || {};
  const isListingAdmin = user.admin_role === 'listing_admin';
  const isHeadAdmin = user.admin_role === 'head_admin';

  let listings = [];
  let endpoint = null;

  console.log(`[loadListings] Loading status="${status}", isListingAdmin=${isListingAdmin}, isHeadAdmin=${isHeadAdmin}`);

  // Use role-based endpoints for listing and head admins
  if (isListingAdmin && status === 'pending') {
    endpoint = '/api/admin/listings/pending-approval';
    console.log('[loadListings] Using listing admin endpoint:', endpoint);
  } else if (isHeadAdmin && status === 'pending') {
    endpoint = '/api/admin/listings/pending-head-admin';
    console.log('[loadListings] Using head admin pending endpoint:', endpoint);
  } else if (isHeadAdmin && status === 'approved') {
    // For head admin, "approved" view shows all listings (or published ones)
    endpoint = '/api/admin/listings/approvals';
    console.log('[loadListings] Using head admin all approvals endpoint:', endpoint);
  } else {
    // Fallback to old endpoints for other views or roles
    const candidates = [
      `/admin/listings?status=${status}`,
      `/admin/listings/${status}`,
      status === 'pending' ? `/admin/listings` : null
    ].filter(Boolean);

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        listings = await res.json();
        console.log('[loadListings] Fallback endpoint success:', url);
        break;
      } catch (e) {
        // try next
      }
    }
  }

  // Fetch from role-based endpoint if applicable
  if (endpoint) {
    console.log(`[loadListings] Fetching from: ${endpoint}`);
    try {
      const res = await fetch(endpoint, { credentials: 'same-origin' });
      console.log(`[loadListings] Response status: ${res.status}`);
      if (res.ok) {
        listings = await res.json();
        console.log(`[loadListings] Got ${listings.length} listings from API`);
        if (listings.length > 0) {
          console.log('[loadListings] First listing keys:', Object.keys(listings[0]));
          console.log('[loadListings] First listing:', listings[0]);
        }
        // Normalize the response structure for listing_approvals format
        if (Array.isArray(listings) && listings.length > 0 && listings[0].listing_id) {
          // Already in correct format from pending-approval endpoint
        }
      } else {
        console.warn(`[loadListings] API error ${res.status}`);
        const text = await res.text();
        console.warn('[loadListings] Response:', text.substring(0, 200));
      }
    } catch (e) {
      console.error('[loadListings] Fetch error:', e);
    }
  }

  // If we didn't get data, show message
  if (!Array.isArray(listings) || listings.length === 0) {
    console.log(`[loadListings] No listings (array valid: ${Array.isArray(listings)}, length: ${listings?.length})`);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="8" class="muted">No listings found.</td>`;
    tbody.appendChild(tr);
    console.log('[loadListings] Added empty state message. Checking tbody:', tbody.innerHTML);
    currentListings = [];
    if (status === 'pending') pendingListings = [];
    if (status === 'approved') approvedListings = [];
    if (status === 'rejected') rejectedListings = [];
    return;
  }

  // save to appropriate bucket
  if (status === 'pending') pendingListings = listings;
  else if (status === 'approved') approvedListings = listings;
  else if (status === 'rejected') rejectedListings = listings;

  currentListings = listings;

  console.log(`[loadListings] About to render ${listings.length} listings`);
  
  try {
    // render
    listings.forEach((listing, idx) => {
      console.log(`[loadListings] Rendering listing ${idx}:`, listing.listing_id || listing.id, listing.title);
    
    const tr = document.createElement("tr");
    // Use listing_id for role-based listings, id for old format
    const listingId = listing.listing_id || listing.id;
    const title = listing.title || 'Untitled';
    
    // common columns
    let actions = `<button class="btn-sm btn btn-ghost" onclick="openAppDetails(${listingId})">View</button>`;

    if (isHeadAdmin && status === 'pending') {
      // Head admin pending view: Publish button
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listingId}, 'publish')">Publish</button>`;
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listingId}, 'reject')">Reject</button>`;
    } else if (isListingAdmin && status === 'pending') {
      // Listing admin pending view: Approve button
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listingId}, 'approve')">Approve</button>`;
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listingId}, 'reject')">Reject</button>`;
    } else if (status === 'pending') {
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listingId}, 'approve')">Approve</button>`;
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listingId}, 'reject')">Reject</button>`;
    } else if (status === 'approved') {
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listingId}, 'reject')">Reject</button>`;
    } else if (status === 'rejected') {
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listingId}, 'approve')">Re-approve</button>`;
      actions += ` <button class="btn-sm btn btn-danger" onclick="takeAction(${listingId}, 'delete')">Delete</button>`;
    }

    // selection checkbox cell (hidden unless selectionActive)
    const selectCell = `<td class="select-cell" style="vertical-align:middle"><input class=\"select-checkbox\" type=\"checkbox\" data-id=\"${listingId}\"></td>`;

    // thumbnail(s) - display available image-like fields left-to-right
    const imageFields = ['image_url','oct_tct_url','tax_declaration_url','doas_url','government_id_url'];
    const thumbs = [];
    for (const f of imageFields) {
      const url = listing[f];
      if (url && typeof url === 'string') {
        const lower = url.toLowerCase();
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) {
          thumbs.push(`<img class=\"admin-thumb\" src=\"${escapeHtml(url)}\" alt=\"${escapeHtml(f)}\" onclick=\"openImagePreview('${escapeHtml(url)}')\">`);
        }
      }
    }
    const thumbHtml = thumbs.length ? `<div class=\"admin-thumbs\">${thumbs.join('')}</div>` : '';
    const ownerEmail = listing.owner_email || listing.owner_username || '';
    const ownerName = `${escapeHtml(listing.owner_first_name || '')} ${escapeHtml(listing.owner_last_name || '')}`.trim() || '-';
    const adminApprovedByName = escapeHtml(listing.admin_approved_by_username || '-');

    // Render different columns based on admin role and view
    let tableHTML = `
      ${selectCell}
      <td style="vertical-align:middle">${thumbHtml}</td>
      <td style="vertical-align:middle">${escapeHtml(title)}</td>
    `;

    // For head admin viewing pending approvals
    if (isHeadAdmin && status === 'pending') {
      tableHTML += `
        <td style="vertical-align:middle">${ownerName}</td>
        <td style="vertical-align:middle">${adminApprovedByName}</td>
        <td style="vertical-align:middle"><span class="muted">${escapeHtml(listing.listing_status || 'pending')}</span></td>
      `;
    }
    // For head admin viewing approved/published listings
    else if (isHeadAdmin && status === 'approved') {
      tableHTML += `
        <td style="vertical-align:middle">${ownerName}</td>
        <td style="vertical-align:middle">${escapeHtml(listing.listing_status || 'published')}</td>
      `;
    }
    // For listing admin or other views
    else {
      tableHTML += `
        <td style="vertical-align:middle">${formatPropertyType(listing.type)}</td>
        <td style="vertical-align:middle"><span class="muted">${escapeHtml(listing.status || listing.listing_status || 'pending')}</span></td>
        <td style="vertical-align:middle">${new Date(listing.created_at).toLocaleDateString()}</td>
        <td style="vertical-align:middle">${ownerEmail ? `<a href=\"mailto:${escapeHtml(ownerEmail)}\">${escapeHtml(ownerEmail)}</a>` : '-'}</td>
      `;
    }

    tableHTML += `<td style="white-space:nowrap;vertical-align:middle">${actions}</td>`;
    
    tr.innerHTML = tableHTML;
    tbody.appendChild(tr);
  });
  console.log(`[loadListings] Finished rendering all listings`);
  } catch (renderErr) {
    console.error('[loadListings] RENDER ERROR:', renderErr);
    console.error('[loadListings] Listings data:', listings);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="8" style="color:red">Error rendering listings: ${renderErr.message}</td>`;
    tbody.appendChild(tr);
  }
}

// Toggle selection mode (shows/hides checkboxes)
function toggleSelectMode() {
  selectionActive = !selectionActive;
  const tableWrap = document.querySelector('.admin-table-wrap');
  if (tableWrap) {
    if (selectionActive) tableWrap.classList.add('selection-active');
    else tableWrap.classList.remove('selection-active');
  }
  // Ensure checkboxes are cleared when toggling off
  if (!selectionActive) clearSelection();
}

function selectAllVisible() {
  const boxes = document.querySelectorAll('.select-checkbox');
  boxes.forEach(b => { b.checked = true; });
}

function clearSelection() {
  const boxes = document.querySelectorAll('.select-checkbox');
  boxes.forEach(b => { b.checked = false; });
}

function getSelectedIds() {
  const boxes = Array.from(document.querySelectorAll('.select-checkbox:checked'));
  return boxes.map(b => parseInt(b.dataset.id));
}

async function bulkAction(action) {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('No listings selected', true); return; }

  // For rejection, show modal to select reason
  if (action === 'reject') {
    openBulkRejectionModal(ids);
    return;
  }

  // confirm destructive actions
  if (action === 'delete') {
    if (!confirm(`Delete ${ids.length} selected listing(s)? This cannot be undone.`)) return;
  }

  try {
    const promises = ids.map(id => {
      if (action === 'approve') return fetch(`/admin/approve-listing/${id}`, { method: 'POST' });
      if (action === 'delete') return fetch(`/admin/listings/${id}`, { method: 'DELETE' });
      return Promise.resolve();
    });

    const results = await Promise.all(promises);
    const failed = results.filter(r => !r.ok).length;
    if (failed === 0) {
      showToast(`Bulk ${action} completed`);
    } else {
      showToast(`Bulk ${action} completed with ${failed} failures`, true);
    }

    // reload current view and stats
    clearSelection();
    await loadListings(currentView);
    await loadAdminStats();
  } catch (e) {
    console.error('Bulk action error', e);
    showToast('Bulk action failed', true);
  }
}

function switchView(view) {
  currentView = view;
  loadListings(view);
}

// ---------------- Modal ----------------
function openAppDetails(id){
  // find in current lists, otherwise try to fetch single
  let app = currentListings.find(x => x.id === id) || pendingListings.find(x => x.id === id) || approvedListings.find(x => x.id === id) || rejectedListings.find(x => x.id === id);
  currentAppId = id;

  const modal = document.getElementById('adminModal');
  const body = document.getElementById('modalBody');

  async function render(app) {
    if (app) {
      document.getElementById('modalTitle').textContent = app.title;
    const ownerName = `${escapeHtml(app.owner_first_name || '')} ${escapeHtml(app.owner_last_name || '')}`.trim();
    const ownerEmail = app.owner_email || app.owner_username || '';
    // helper to render document thumbnails: small left-to-right clickable thumbs
    function renderDocumentHTML(url, label) {
      if (!url) return '';
      const cleanUrl = escapeHtml(url);
      const lower = cleanUrl.toLowerCase();
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) {
        return `<div class="modal-docs"><div style="font-weight:700;margin-right:6px">${label}:</div><img class=\"modal-doc-thumb\" src=\"${cleanUrl}\" alt=\"${label}\" onclick=\"openImagePreview('${cleanUrl}')\"></div>`;
      }
      // default to link for PDFs and other types
      return `<p><strong>${label}:</strong> <a href="${cleanUrl}" target="_blank">${label} (view)</a></p>`;
    }

    body.innerHTML = `
      <p><strong>Owner:</strong> ${ownerName || '-'}</p>
      <p><strong>Owner Email:</strong> ${ownerEmail ? `<a href="mailto:${escapeHtml(ownerEmail)}">${escapeHtml(ownerEmail)}</a>` : '-'}</p>
      <p><strong>Type:</strong> ${formatPropertyType(app.type)}</p>
      <p><strong>Status:</strong> ${escapeHtml(app.status)}</p>
      <p><strong>Price:</strong> ${escapeHtml(app.price)}</p>
      <p><strong>Size:</strong> ${escapeHtml(app.size || '-')}</p>
      <p><strong>Views:</strong> ${escapeHtml(app.views || 0)}</p>
      <p><strong>Inquiries:</strong> ${escapeHtml(app.inquiries || 0)}</p>
      <p><strong>Description:</strong> ${escapeHtml(app.description)}</p>
      ${app.image_url ? `<div class="modal-docs"><img class=\"modal-doc-thumb\" src=\"${escapeHtml(app.image_url)}\" alt=\"image\" onclick=\"openImagePreview('${escapeHtml(app.image_url)}')\"></div>` : ''}
      <div style="margin-top:8px">
        ${renderDocumentHTML(app.oct_tct_url, 'OCT / TCT')}
        ${renderDocumentHTML(app.tax_declaration_url, 'Tax Declaration')}
        ${renderDocumentHTML(app.doas_url, 'DOAS')}
        ${renderDocumentHTML(app.government_id_url, 'Government ID')}
      </div>
    `;

      // set modal action buttons depending on view and current status
      const actionsContainer = document.getElementById('modalActions');
      actionsContainer.innerHTML = '';

      if (currentView === 'pending') {
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Approve</button> <button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      } else if (currentView === 'approved') {
        actionsContainer.innerHTML = `<button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      } else if (currentView === 'rejected') {
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Re-approve</button> <button class="btn btn-danger" onclick="takeAction(${app.id}, 'delete')">Delete</button>`;
      } else {
        // default - allow approve/reject
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Approve</button> <button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      }

      // Ensure the preview modal has a click-to-close handler (attach once)
      const previewModal = document.getElementById("imagePreviewModal");
      if (previewModal && !previewModal._listenerAttached) {
        previewModal.addEventListener("click", (e) => { 
          // Only close if clicking on the modal background, not the image
          if (e.target === previewModal) {
            closeImagePreview();
          }
        });
        previewModal._listenerAttached = true;
      }

    } else {
      document.getElementById('modalTitle').textContent = 'Listing';
      body.innerHTML = '<p>No details</p>';
      document.getElementById('modalActions').innerHTML = '';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }

  if (app) {
    render(app);
  } else {
    // fetch single listing
    fetch(`/admin/listings/single/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => render(data))
      .catch(() => render(null));
  }
}

function closeAppModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  currentAppId = null;
}

// Open the image preview modal (used by thumbnail clicks)
function openImagePreview(url) {
  try {
    const previewModal = document.getElementById('imagePreviewModal');
    const previewImg = document.getElementById('imagePreview');
    if (!previewModal || !previewImg) return;
    previewImg.src = url;
    previewModal.classList.add('open');
    previewModal.setAttribute('aria-hidden', 'false');
  } catch (e) { console.warn('Preview open failed', e); }
}

// Close the image preview modal
function closeImagePreview() {
  const previewModal = document.getElementById('imagePreviewModal');
  if (previewModal) {
    previewModal.classList.remove('open');
    previewModal.setAttribute('aria-hidden', 'true');
  }
}

// ---------------- Approve / Reject (no pop-ups) ----------------
async function takeAction(id, action) {
  if (!id) return;

  try {
    if (action === 'reject') {
      // Show rejection modal instead of directly rejecting
      openRejectionModal(id);
      return;
    }

    let url, opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const user = JSON.parse(localStorage.getItem('laboCurrentUser')) || {};
    const isListingAdmin = user.admin_role === 'listing_admin';
    const isHeadAdmin = user.admin_role === 'head_admin';

    if (action === 'approve') {
      // Use role-based endpoint if applicable
      if (isListingAdmin) {
        url = `/api/admin/listings/${id}/approve`;
        opts.body = JSON.stringify({ notes: '' });
      } else if (isHeadAdmin) {
        url = `/api/admin/listings/${id}/publish`;
        opts.body = JSON.stringify({ notes: '' });
      } else {
        url = `/admin/approve-listing/${id}`;
      }
    } else if (action === 'publish') {
      // Head admin publish action
      url = `/api/admin/listings/${id}/publish`;
      opts.body = JSON.stringify({ notes: '' });
    } else if (action === 'delete') {
      url = `/admin/listings/${id}`;
      opts = { method: 'DELETE' };
    } else {
      showToast('Unknown action', true);
      return;
    }

    console.log(`[takeAction] Performing action "${action}" on listing ${id}`, { url, action });

    const res = await fetch(url, opts);
    let data = {};
    try { data = await res.json(); } catch (e) { }

    if (res.ok) {
      closeAppModal();
      // reload the current view to reflect changes; stay on same view
      await loadListings(currentView);
      await loadAdminStats();
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`);
    } else {
      showToast(data.error || 'Action failed', true);
    }
  } catch (err) {
    console.error('Action error:', err);
    showToast('Server error: ' + err.message, true);
  }
}

// Predefined rejection reasons
const REJECTION_REASONS = [
  'Incomplete or missing required documents',
  'Property photos are unclear or missing',
  'Inaccurate property information',
  'Pricing appears uncompetitive or suspicious',
  'Property does not meet listing requirements',
  'Duplicate listing',
  'Violates platform terms and conditions',
  'Custom reason'
];

// Open rejection modal to select reason
function openRejectionModal(listingId) {
  const overlay = document.createElement('div');
  overlay.id = 'rejectionOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;

  let reasonsHTML = '';
  REJECTION_REASONS.forEach((reason, idx) => {
    reasonsHTML += `
      <label style="display: block; margin-bottom: 12px; cursor: pointer;">
        <input type="radio" name="rejection_reason" value="${reason}" style="margin-right: 10px;">
        <span style="font-size: 14px;">${reason}</span>
      </label>
    `;
  });

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Reject Listing</h3>
    <p style="color: #666; margin-bottom: 20px;">Select a reason for rejecting this listing:</p>
    
    <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
      ${reasonsHTML}
    </div>

    <div id="customReasonContainer" style="display: none; margin-bottom: 20px;">
      <textarea 
        id="customReason" 
        placeholder="Enter your custom rejection reason..." 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; min-height: 80px; box-sizing: border-box; resize: vertical;"
      ></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closeRejectionModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-danger" id="confirmRejectBtn" style="padding: 10px 20px;">Reject Listing</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Show custom reason input when "Custom reason" is selected
  const radios = modal.querySelectorAll('input[name="rejection_reason"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customContainer = document.getElementById('customReasonContainer');
      if (e.target.value === 'Custom reason') {
        customContainer.style.display = 'block';
        document.getElementById('customReason').focus();
      } else {
        customContainer.style.display = 'none';
      }
    });
  });

  // Handle rejection confirmation
  document.getElementById('confirmRejectBtn').addEventListener('click', async () => {
    const selectedRadio = modal.querySelector('input[name="rejection_reason"]:checked');
    if (!selectedRadio) {
      showToast('Please select a reason', true);
      return;
    }

    let reason = selectedRadio.value;
    if (reason === 'Custom reason') {
      const customText = document.getElementById('customReason').value.trim();
      if (!customText) {
        showToast('Please enter a custom reason', true);
        return;
      }
      reason = customText;
    }

    // Close the modal
    closeRejectionModal();

    // Perform the rejection API call
    try {
      const res = await fetch(`/admin/listings/${listingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      let data = {};
      try { data = await res.json(); } catch (e) { }

      if (res.ok) {
        closeAppModal();
        await loadListings(currentView);
        await loadAdminStats();
        showToast('Listing rejected successfully');
      } else {
        showToast(data.error || 'Rejection failed', true);
      }
    } catch (err) {
      console.error('Rejection error:', err);
      showToast('Server error: ' + err.message, true);
    }
  });

  // Close modal when overlay is clicked (outside the modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeRejectionModal();
    }
  });
}

// Close rejection modal
function closeRejectionModal() {
  const overlay = document.getElementById('rejectionOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// Open bulk rejection modal for multiple listings
function openBulkRejectionModal(listingIds) {
  const overlay = document.createElement('div');
  overlay.id = 'bulkRejectionOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;

  let reasonsHTML = '';
  REJECTION_REASONS.forEach((reason, idx) => {
    reasonsHTML += `
      <label style="display: block; margin-bottom: 12px; cursor: pointer;">
        <input type="radio" name="bulk_rejection_reason" value="${reason}" style="margin-right: 10px;">
        <span style="font-size: 14px;">${reason}</span>
      </label>
    `;
  });

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Reject ${listingIds.length} Listing(s)</h3>
    <p style="color: #666; margin-bottom: 20px;">Select a reason for rejecting these listings:</p>
    
    <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
      ${reasonsHTML}
    </div>

    <div id="customBulkReasonContainer" style="display: none; margin-bottom: 20px;">
      <textarea 
        id="customBulkReason" 
        placeholder="Enter your custom rejection reason..." 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; min-height: 80px; box-sizing: border-box; resize: vertical;"
      ></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closeBulkRejectionModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-danger" id="confirmBulkRejectBtn" style="padding: 10px 20px;">Reject All</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Show custom reason input when "Custom reason" is selected
  const radios = modal.querySelectorAll('input[name="bulk_rejection_reason"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customContainer = document.getElementById('customBulkReasonContainer');
      if (e.target.value === 'Custom reason') {
        customContainer.style.display = 'block';
        document.getElementById('customBulkReason').focus();
      } else {
        customContainer.style.display = 'none';
      }
    });
  });

  // Handle bulk rejection confirmation
  document.getElementById('confirmBulkRejectBtn').addEventListener('click', async () => {
    const selectedRadio = modal.querySelector('input[name="bulk_rejection_reason"]:checked');
    if (!selectedRadio) {
      showToast('Please select a reason', true);
      return;
    }

    let reason = selectedRadio.value;
    if (reason === 'Custom reason') {
      const customText = document.getElementById('customBulkReason').value.trim();
      if (!customText) {
        showToast('Please enter a custom reason', true);
        return;
      }
      reason = customText;
    }

    // Close the modal
    closeBulkRejectionModal();

    // Perform bulk rejection API calls
    try {
      const promises = listingIds.map(id =>
        fetch(`/admin/listings/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok).length;
      
      if (failed === 0) {
        showToast(`All ${listingIds.length} listings rejected successfully`);
      } else {
        showToast(`${failed} out of ${listingIds.length} rejections failed`, true);
      }

      clearSelection();
      await loadListings(currentView);
      await loadAdminStats();
    } catch (err) {
      console.error('Bulk rejection error:', err);
      showToast('Server error: ' + err.message, true);
    }
  });

  // Close modal when overlay is clicked (outside the modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeBulkRejectionModal();
    }
  });
}

// Close bulk rejection modal
function closeBulkRejectionModal() {
  const overlay = document.getElementById('bulkRejectionOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// ---------------- Simple toast notification ----------------
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = isError ? "rgba(255,50,50,0.9)" : "rgba(50,200,50,0.9)";
  toast.style.color = "#fff";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  toast.style.zIndex = 2000;
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---------------- Stats ----------------
async function loadAdminStats() {
  try {
    const res = await fetch("/admin/stats");
    const data = await res.json();
    
    // Update listing admin stats (Listing Admin dashboard)
    const statPending = document.getElementById('stat-pending');
    const statAwaitingHead = document.getElementById('stat-awaiting-head');
    const statPublished = document.getElementById('stat-published');
    const statRejected = document.getElementById('stat-rejected');
    
    if (statPending) statPending.textContent = data.pending || 0;
    if (statAwaitingHead) statAwaitingHead.textContent = data.awaitingHead || 0;
    if (statPublished) statPublished.textContent = data.published || 0;
    if (statRejected) statRejected.textContent = data.rejected || 0;
    
    // Update head admin listing stats (Head Admin dashboard - Listings section)
    const statHeadPending = document.getElementById('stat-head-pending');
    const statHeadPublished = document.getElementById('stat-head-published');
    const statHeadRejected = document.getElementById('stat-head-rejected');
    
    if (statHeadPending) statHeadPending.textContent = data.awaitingHead || 0;
    if (statHeadPublished) statHeadPublished.textContent = data.published || 0;
    if (statHeadRejected) statHeadRejected.textContent = data.rejected || 0;
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

// ---------------- Utilities ----------------
function escapeHtml(s) {
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function exportData() {
  alert("Export started (demo).");
}

// ---------------- Admin Token Creation (client) ----------------
async function createAdminToken() {
  try {
    const btn = document.getElementById('createAdminTokenBtn');
    if (btn) btn.disabled = true;
    // optional: ask for expiry days (prompt) or keep as single-use no-expiry
    const expires = prompt('Optional: token expiry in days (leave empty for no expiry):', '');
    const body = {};
    if (expires && !isNaN(parseInt(expires))) body.expires_in_days = parseInt(expires);

    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to create token', true);
      if (btn) btn.disabled = false;
      return;
    }

    const out = document.getElementById('adminTokenResult');
    if (out) {
      out.textContent = `Token: ${data.token} `;
      // add a copy button
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'btn btn-sm btn-ghost';
      copyBtn.style.marginLeft = '8px';
      copyBtn.onclick = () => {
        try { navigator.clipboard.writeText(data.token); showToast('Token copied'); } catch (e) { alert(data.token); }
      };
      out.appendChild(copyBtn);
    } else {
      alert('Token: ' + data.token);
    }

    if (btn) btn.disabled = false;
  } catch (e) {
    console.error('Create token failed', e);
    showToast('Create token failed', true);
    const btn = document.getElementById('createAdminTokenBtn'); if (btn) btn.disabled = false;
  }
}

// ==================== SUCCESS STORIES ====================

let pendingStories = [];
let headPendingStories = [];
let headPublishedStories = [];
let headRejectedStories = [];
let allHeadAdminStories = [];

// Load pending stories for listing admin
async function loadPendingStories() {
  try {
    const response = await fetch('/api/admin/success-stories/pending');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load stories');
    }
    const data = await response.json();
    
    // Filter only 'pending' stories (not listing_admin_approved)
    pendingStories = Array.isArray(data) ? data.filter(s => s.status === 'pending') : [];
    document.getElementById('stat-stories-pending').textContent = pendingStories.length;
    renderStoriesTable();
  } catch (err) {
    console.error('Error loading stories:', err);
    document.getElementById('storiesTable').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#f44336">Error: ' + err.message + '</td></tr>';
  }
}

// Load pending stories for head admin
async function loadHeadAdminStories() {
  try {
    const response = await fetch('/api/admin/success-stories/pending');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load stories');
    }
    const data = await response.json();
    
    // Store all stories
    allHeadAdminStories = Array.isArray(data) ? data : [];
    
    // Filter by status
    headPendingStories = allHeadAdminStories.filter(s => s.status === 'listing_admin_approved');
    headPublishedStories = allHeadAdminStories.filter(s => s.status === 'published');
    headRejectedStories = allHeadAdminStories.filter(s => s.status === 'rejected');
    
    // Update counts
    document.getElementById('stat-stories-head-pending').textContent = headPendingStories.length;
    const statPublished = document.getElementById('stat-stories-head-published');
    const statRejected = document.getElementById('stat-stories-head-rejected');
    if (statPublished) statPublished.textContent = headPublishedStories.length;
    if (statRejected) statRejected.textContent = headRejectedStories.length;
    
    renderHeadStoriesTable();
    renderHeadPublishedStoriesTable();
    renderHeadRejectedStoriesTable();
  } catch (err) {
    console.error('Error loading head admin stories:', err);
    document.getElementById('headStoriesTable').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#f44336">Error: ' + err.message + '</td></tr>';
  }
}

function renderStoriesTable() {
  const tbody = document.getElementById('storiesTable');
  
  if (!pendingStories || pendingStories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No pending success stories</td></tr>';
    return;
  }

  tbody.innerHTML = pendingStories.map(story => `
    <tr>
      ${storiesSelectionActive ? `<td><input type="checkbox" onchange="toggleStorySelection(${story.id}, this.checked)" ${selectedStories.has(story.id) ? 'checked' : ''}></td>` : ''}
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.location}</td>
      <td>${story.business_type}</td>
      <td><span class="badge" style="background:#ffc107;color:#000">Pending</span></td>
      <td style="text-align:right">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'listing-admin')">Review</button>
      </td>
    </tr>
  `).join('');
}

function toggleStorySelection(storyId, checked) {
  if (checked) {
    selectedStories.add(storyId);
  } else {
    selectedStories.delete(storyId);
  }
}

function renderHeadStoriesTable() {
  const tbody = document.getElementById('headStoriesTable');
  
  if (!headPendingStories || headPendingStories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No stories awaiting final approval</td></tr>';
    return;
  }

  tbody.innerHTML = headPendingStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.listing_admin_notes || 'N/A'}</td>
      <td><span class="badge" style="background:#4CAF50;color:#fff">Listing Admin Approved</span></td>
      <td style="text-align:right">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'head-admin')">Review</button>
      </td>
    </tr>
  `).join('');
}

function renderHeadPublishedStoriesTable() {
  const tbody = document.getElementById('headPublishedStoriesTable');
  
  if (!headPublishedStories || headPublishedStories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No published success stories</td></tr>';
    return;
  }

  tbody.innerHTML = headPublishedStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td><span class="badge" style="background:#2196F3;color:#fff">Published</span></td>
    </tr>
  `).join('');
}

function renderHeadRejectedStoriesTable() {
  const tbody = document.getElementById('headRejectedStoriesTable');
  
  if (!headRejectedStories || headRejectedStories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No rejected success stories</td></tr>';
    return;
  }

  tbody.innerHTML = headRejectedStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.head_admin_notes || 'N/A'}</td>
      <td><span class="badge" style="background:#f44336;color:#fff">Rejected</span></td>
    </tr>
  `).join('');
}

async function openStoryModal(storyId, role) {
  try {
    const stories = role === 'head-admin' ? headPendingStories : pendingStories;
    const story = stories.find(s => s.id === storyId);
    
    if (!story) {
      showToast('Story not found', true);
      return;
    }

    const html = `
      <div style="color:#666;font-size:14px">
        <p><strong>Business:</strong> ${story.business_name}</p>
        <p><strong>Location:</strong> ${story.location}</p>
        <p><strong>Type:</strong> ${story.business_type}</p>
        <p><strong>Investor:</strong> ${story.investor_name}</p>
        <p><strong>Email:</strong> ${story.contact_email || 'N/A'}</p>
        <img src="${story.image_url}" alt="${story.business_name}" style="max-width:100%;max-height:300px;border-radius:4px;margin:10px 0">
        <p><strong>Description:</strong></p>
        <p>${story.description}</p>
        <p><strong>Achievement:</strong></p>
        <p>${story.key_achievement}</p>
        ${story.listing_admin_notes ? `<p><strong>Listing Admin Notes:</strong><br>${story.listing_admin_notes}</p>` : ''}
      </div>
    `;

    document.getElementById('storyModalTitle').textContent = 'Success Story Review';
    document.getElementById('storyModalBody').innerHTML = html;

    const actionsDiv = document.getElementById('storyModalActions');
    if (role === 'listing-admin') {
      actionsDiv.innerHTML = `
        <button class="btn btn-primary" onclick="approveStory(${storyId})">Approve & Send to Head Admin</button>
        <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
      `;
    } else {
      actionsDiv.innerHTML = `
        <button class="btn btn-primary" onclick="publishStory(${storyId})">Publish Story</button>
        <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
      `;
    }

    document.getElementById('storyModal').classList.add('open');
  } catch (err) {
    console.error('Error opening story modal:', err);
    showToast('Error loading story', true);
  }
}

function closeStoryModal() {
  document.getElementById('storyModal').classList.remove('open');
}

async function approveStory(storyId) {
  try {
    const notes = prompt('Add notes (optional):');
    const response = await fetch(`/api/admin/success-stories/${storyId}/listing-admin-approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ notes: notes || '' })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Story approved! Awaiting head admin final approval');
    closeStoryModal();
    loadPendingStories();
  } catch (err) {
    console.error('Error approving story:', err);
    showToast(err.message || 'Error approving story', true);
  }
}

async function publishStory(storyId) {
  try {
    const notes = prompt('Add notes (optional):');
    const response = await fetch(`/api/admin/success-stories/${storyId}/head-admin-approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ notes: notes || '' })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Story published! 🎉');
    closeStoryModal();
    loadHeadAdminStories();
  } catch (err) {
    console.error('Error publishing story:', err);
    showToast(err.message || 'Error publishing story', true);
  }
}

function openRejectStoryModal(storyId) {
  const reason = prompt('Reason for rejection:');
  if (reason) {
    rejectStory(storyId, reason);
  }
}

async function rejectStory(storyId, reason) {
  try {
    const response = await fetch(`/api/admin/success-stories/${storyId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ notes: reason })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Story rejected');
    closeStoryModal();
    const user = await getUserRole();
    if (user.admin_role === 'listing_admin') {
      loadPendingStories();
    } else {
      loadHeadAdminStories();
    }
  } catch (err) {
    console.error('Error rejecting story:', err);
    showToast(err.message || 'Error rejecting story', true);
  }
}

function switchStoriesView(view) {
  // For now just show pending
  renderStoriesTable();
}

// Stories bulk action tracking
let selectedStories = new Set();
let storiesSelectionActive = false;

function toggleStoriesSelectMode() {
  storiesSelectionActive = !storiesSelectionActive;
  selectedStories.clear();
  
  const btn = document.getElementById('toggleStoriesSelectBtn');
  btn.textContent = storiesSelectionActive ? 'Disable Select' : 'Toggle Select';
  
  const table = document.getElementById('storiesTable');
  table.parentElement.classList.toggle('selection-active');
  renderStoriesTable();
}

function clearStoriesSelection() {
  selectedStories.clear();
  renderStoriesTable();
}

async function bulkApproveStories() {
  if (selectedStories.size === 0) {
    showToast('Please select at least one story', true);
    return;
  }
  
  const confirmed = confirm(`Approve ${selectedStories.size} story/stories?`);
  if (!confirmed) return;
  
  try {
    let approved = 0;
    for (const storyId of selectedStories) {
      const response = await fetch(`/api/admin/success-stories/${storyId}/listing-admin-approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ notes: '' })
      });
      
      if (response.ok) approved++;
    }
    
    showToast(`Approved ${approved} story/stories`);
    selectedStories.clear();
    loadPendingStories();
  } catch (err) {
    showToast('Error approving stories', true);
  }
}

async function bulkRejectStories() {
  if (selectedStories.size === 0) {
    showToast('Please select at least one story', true);
    return;
  }
  
  const reason = prompt(`Reason for rejecting ${selectedStories.size} story/stories:`);
  if (!reason) return;
  
  try {
    let rejected = 0;
    for (const storyId of selectedStories) {
      const response = await fetch(`/api/admin/success-stories/${storyId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ notes: reason })
      });
      
      if (response.ok) rejected++;
    }
    
    showToast(`Rejected ${rejected} story/stories`);
    selectedStories.clear();
    loadPendingStories();
  } catch (err) {
    showToast('Error rejecting stories', true);
  }
}
