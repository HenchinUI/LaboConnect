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
    } else if (adminRole === 'system_admin') {
      titleEl.textContent = 'System Admin Dashboard';
      badgeEl.textContent = 'System Admin';
      document.getElementById('listing-admin-section').classList.add('active');
      loadSystemAdminData();
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

// Load data for System Admin
function loadSystemAdminData() {
  switchView('pending');
  loadAdminStats();
  loadPendingStories();
}

// Load data for Verification Admin
async function loadVerificationAdminData() {
  try {
    // Set initial view to pending
    currentVerificationView = 'pending';
    
    // Mark pending button as active
    const buttons = document.querySelectorAll('#verification-tab button.btn-ghost');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase() === 'pending') {
        btn.classList.add('active');
      }
    });
    
    // Load verifications
    await loadVerifications();
  } catch (err) {
    console.warn('Could not load verification admin data:', err);
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

// Load and display verifications (for verification admin)
let currentVerificationView = 'pending';
async function loadVerifications() {
  console.log('[loadVerifications] Loading view:', currentVerificationView);
  try {
    let endpoint = '/api/admin/verifications/pending';
    if (currentVerificationView === 'verified') {
      endpoint = '/api/admin/verifications/verified';
    } else if (currentVerificationView === 'rejected') {
      endpoint = '/api/admin/verifications/rejected';
    }
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (currentVerificationView === 'pending') {
      renderPendingVerifications(data);
    } else if (currentVerificationView === 'verified') {
      renderVerifiedUsers(data);
    } else if (currentVerificationView === 'rejected') {
      renderRejectedUsers(data);
    }
    
    // Update stats
    loadVerificationStats();
  } catch (err) {
    console.warn('Error loading verifications:', err);
    const container = document.getElementById('verificationsList');
    if (container) {
      container.innerHTML = '<p class="muted">Error loading verifications</p>';
    }
  }
}

// Switch verification view (pending/verified/rejected)
function switchVerificationView(view) {
  console.log('[switchVerificationView] Switching to view:', view);
  currentVerificationView = view;
  
  // Update button styling
  const buttons = document.querySelectorAll('#verification-tab button.btn-ghost');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(view)) {
      btn.classList.add('active');
    }
  });
  
  // Load the view
  loadVerifications();
}

// Render pending verifications
function renderPendingVerifications(requests) {
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
      ${req.id_document_url ? `<div class="admin-item-meta"><a href="${req.id_document_url}" target="_blank" class="link">View Document</a></div>` : ''}
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn btn-secondary" onclick="viewVerificationDetails(${req.id})">View Details</button>
        <button class="btn btn-success" onclick="approveVerification(${req.id})">Verify</button>
        <button class="btn btn-danger" onclick="rejectVerification(${req.id})">Reject</button>
      </div>
    </div>
  `).join('');
}

// Render verified users
function renderVerifiedUsers(users) {
  const container = document.getElementById('verificationsList');
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="muted">No verified users</p>';
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="admin-item">
      <div class="admin-item-title">${user.user_name || 'Unknown User'}</div>
      <div class="admin-item-meta">Email: ${user.user_email || 'N/A'}</div>
      <div class="admin-item-meta">Phone: ${user.phone_number || 'N/A'}</div>
      <div class="admin-item-meta">Verified: <strong>${new Date(user.verified_at).toLocaleDateString()}</strong></div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn btn-secondary" onclick="viewVerificationDetails(${user.id})">View Details</button>
      </div>
    </div>
  `).join('');
}

// Render rejected users
function renderRejectedUsers(users) {
  const container = document.getElementById('verificationsList');
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="muted">No rejected verifications</p>';
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="admin-item">
      <div class="admin-item-title">${user.user_name || 'Unknown User'}</div>
      <div class="admin-item-meta">Email: ${user.user_email || 'N/A'}</div>
      <div class="admin-item-meta">Phone: ${user.phone_number || 'N/A'}</div>
      <div class="admin-item-meta">Rejection Reason: <strong>${user.rejection_reason || 'No reason provided'}</strong></div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn btn-secondary" onclick="viewVerificationDetails(${user.id})">View Details</button>
        <button class="btn btn-danger" onclick="deleteVerification(${user.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Approve verification
async function approveVerification(requestId) {
  if (!confirm('Are you sure you want to verify this user?')) return;
  
  try {
    const response = await fetch(`/api/admin/verifications/${requestId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: '' })
    });
    
    const data = await response.json();
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('User verified successfully!');
      loadVerifications();
    }
  } catch (err) {
    console.error('Error approving verification:', err);
    alert('Error approving verification');
  }
}

// Reject verification
async function rejectVerification(requestId) {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;
  
  try {
    const response = await fetch(`/api/admin/verifications/${requestId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('Verification rejected');
      loadVerifications();
    }
  } catch (err) {
    console.error('Error rejecting verification:', err);
    alert('Error rejecting verification');
  }
}

// Delete verification request
async function deleteVerification(requestId) {
  if (!confirm('Are you sure you want to delete this verification request? This action cannot be undone.')) return;
  
  try {
    const response = await fetch(`/api/admin/verifications/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('Verification request deleted');
      loadVerifications();
    }
  } catch (err) {
    console.error('Error deleting verification:', err);
    alert('Error deleting verification');
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
  console.log('[switchHeadAdminTab] Switching to tab:', tab);
  
  // Hide all tabs within head admin section
  document.querySelectorAll('#head-admin-section > div[id$="-tab"]').forEach(el => {
    console.log('[switchHeadAdminTab] Hiding tab:', el.id);
    el.style.display = 'none';
  });
  
  // Update buttons
  document.querySelectorAll('#head-admin-section .tab-btn').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected tab - construct proper ID for head admin tabs
  let tabId = tab === 'success-stories' ? 'head-admin-success-stories-tab' : (tab + '-tab');
  const tabEl = document.getElementById(tabId);
  console.log('[switchHeadAdminTab] Tab element found:', !!tabEl, tabId);
  
  if (tabEl) {
    tabEl.style.display = 'block';
    console.log('[switchHeadAdminTab] Tab displayed:', tab);
    
    if (event && event.target) {
      event.target.classList.add('active');
    }
    
    // Load data for listings tab
    if (tab === 'listings') {
      console.log('[switchHeadAdminTab] Loading listings');
      loadAdminStats();
    }
    // Load data for success stories tab
    else if (tab === 'success-stories') {
      console.log('[switchHeadAdminTab] Loading success stories');
      loadHeadAdminStories().then(() => {
        // Auto-switch to first non-empty view
        console.log('[switchHeadAdminTab] After loading, auto-switching to first non-empty view');
        console.log('[switchHeadAdminTab] headPendingStories:', headPendingStories ? headPendingStories.length : 'null');
        console.log('[switchHeadAdminTab] headPublishedStories:', headPublishedStories ? headPublishedStories.length : 'null');
        console.log('[switchHeadAdminTab] headRejectedStories:', headRejectedStories ? headRejectedStories.length : 'null');
        
        if (headPendingStories && headPendingStories.length > 0) {
          console.log('[switchHeadAdminTab] Switching to pending view');
          switchHeadAdminStoriesView('pending');
        } else if (headPublishedStories && headPublishedStories.length > 0) {
          console.log('[switchHeadAdminTab] Switching to published view');
          switchHeadAdminStoriesView('published');
        } else if (headRejectedStories && headRejectedStories.length > 0) {
          console.log('[switchHeadAdminTab] Switching to rejected view');
          switchHeadAdminStoriesView('rejected');
        } else {
          console.log('[switchHeadAdminTab] No stories found in any category');
        }
      });
    }
    // Load data for admin management tab
    else if (tab === 'admin-management') {
      console.log('[switchHeadAdminTab] Loading admin management');
      loadAdminsList();
    }
  } else {
    console.warn('[switchHeadAdminTab] Tab element not found:', tabId);
  }
}

// Verification Admin tab switching
function switchVerificationAdminTab(tab) {
  console.log('[switchVerificationAdminTab] Switching to tab:', tab);
  
  // Hide all tabs within verification admin section
  document.querySelectorAll('#verification-admin-section > div[id$="-tab"]').forEach(el => {
    console.log('[switchVerificationAdminTab] Hiding tab:', el.id);
    el.style.display = 'none';
  });
  
  // Update buttons
  document.querySelectorAll('#verification-admin-section .tab-btn').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected tab
  let tabId;
  if (tab === 'verifications') {
    tabId = 'verification-tab';
  } else if (tab === 'admin-management') {
    tabId = 'verification-admin-management-tab';
  } else {
    tabId = tab + '-tab';
  }
  
  const tabEl = document.getElementById(tabId);
  console.log('[switchVerificationAdminTab] Tab element found:', !!tabEl, tabId);
  
  if (tabEl) {
    tabEl.style.display = 'block';
    console.log('[switchVerificationAdminTab] Tab displayed:', tab);
    
    if (event && event.target) {
      event.target.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tab === 'verifications') {
      console.log('[switchVerificationAdminTab] Loading verifications');
      loadVerifications();
    } else if (tab === 'admin-management') {
      console.log('[switchVerificationAdminTab] Loading admin management');
      loadAdminsList();
    }
  } else {
    console.warn('[switchVerificationAdminTab] Tab element not found:', tabId);
  }
}

function switchHeadAdminStoriesView(view) {
  console.log('[switchHeadAdminStoriesView] Switching to view:', view);
  
  // Update active tab highlighting for head admin stories
  const storyButtons = document.querySelectorAll('#head-admin-success-stories-tab > div[style*="flex"] button.btn-ghost');
  storyButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Find and highlight the clicked button
  const activeStoryButton = Array.from(storyButtons).find(btn => {
    const text = btn.textContent.toLowerCase();
    return (view === 'pending' && (text.includes('awaiting') || text.includes('pending'))) || 
           (view === 'published' && text.includes('published')) || 
           (view === 'rejected' && text.includes('rejected'));
  });
  if (activeStoryButton) activeStoryButton.classList.add('active');
  
  // Hide all story views
  const pendingView = document.getElementById('pending-stories-view');
  const publishedView = document.getElementById('published-stories-view');
  const rejectedView = document.getElementById('rejected-stories-view');
  
  console.log('[switchHeadAdminStoriesView] View elements found - pending:', !!pendingView, 'published:', !!publishedView, 'rejected:', !!rejectedView);
  
  if (pendingView) pendingView.style.display = 'none';
  if (publishedView) publishedView.style.display = 'none';
  if (rejectedView) rejectedView.style.display = 'none';
  
  // Show selected view
  if (view === 'pending') {
    console.log('[switchHeadAdminStoriesView] Showing pending view');
    if (pendingView) pendingView.style.display = 'block';
  } else if (view === 'published') {
    console.log('[switchHeadAdminStoriesView] Showing published view');
    if (publishedView) publishedView.style.display = 'block';
  } else if (view === 'rejected') {
    console.log('[switchHeadAdminStoriesView] Showing rejected view');
    if (rejectedView) rejectedView.style.display = 'block';
  }
}

async function loadAdminsList() {
  try {
    // Get current user's role
    const userResponse = await fetch('/api/admin/user-info');
    const userData = await userResponse.json();
    const currentRole = userData.user.admin_role;
    
    const response = await fetch('/api/admin/all-admins');
    const admins = await response.json();
    
    // Filter admins to show only those with the same role as current user
    // EXCEPT for head_admin, who should see all admin types
    let filteredAdmins = admins;
    if (currentRole !== 'head_admin') {
      filteredAdmins = admins.filter(admin => admin.admin_role === currentRole);
    }
    
    // Find the correct adminsList container based on which section is active
    let container = null;
    const headAdminMgmtTab = document.getElementById('admin-management-tab');
    const systemAdminMgmtTab = document.getElementById('system-admin-management-tab');
    const verificationAdminMgmtTab = document.getElementById('verification-admin-management-tab');
    
    if (headAdminMgmtTab && headAdminMgmtTab.style.display !== 'none') {
      container = headAdminMgmtTab.querySelector('#adminsList');
    } else if (systemAdminMgmtTab && systemAdminMgmtTab.style.display !== 'none') {
      container = systemAdminMgmtTab.querySelector('#adminsList');
    } else if (verificationAdminMgmtTab && verificationAdminMgmtTab.style.display !== 'none') {
      container = verificationAdminMgmtTab.querySelector('#adminsList');
    }
    
    // Fallback to first adminsList if not found
    if (!container) {
      container = document.getElementById('adminsList');
    }
    
    if (!container) {
      console.error('[loadAdminsList] No adminsList container found');
      return;
    }
    
    if (!filteredAdmins || filteredAdmins.length === 0) {
      container.innerHTML = '<p class="muted">No admin accounts found with your role</p>';
      return;
    }
    
    // Only show edit/delete buttons for head admin
    const canEditDelete = currentRole === 'head_admin';
    
    container.innerHTML = filteredAdmins.map(admin => `
      <div class="admin-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid rgba(0,0,0,0.06);border-radius:8px;margin-bottom:10px">
        <div>
          <div class="admin-item-title">${admin.username}</div>
          <div class="admin-item-meta">Email: ${admin.email}</div>
          <div class="admin-item-meta">Role: <strong>${admin.admin_role.replace('_', ' ').toUpperCase()}</strong></div>
        </div>
        <div style="display:flex;gap:8px">
          ${canEditDelete ? `
            <button class="btn btn-sm btn-primary" onclick="openEditAdminModal(${admin.id}, '${admin.username}', '${admin.email}', '${admin.admin_role}')" style="padding:6px 12px;font-size:12px">Edit</button>
            <button class="btn btn-sm btn-ghost" style="background:#f44336;color:white;border:none;padding:6px 12px;font-size:12px;cursor:pointer" onclick="deleteAdmin(${admin.id}, '${admin.username}')">Delete</button>
          ` : ''}
        </div>
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
          <option value="verification_admin">Verification Admin</option>
          <option value="system_admin">System Admin</option>
          <option value="head_admin">Head Admin</option>
        `;
        document.getElementById('createAdminHint').textContent = 'As Head Admin, you can create Verification Admin, System Admin, or Head Admin roles.';
      } else if (adminRole === 'system_admin') {
        roleSelect.innerHTML += `<option value="system_admin">System Admin</option>`;
        document.getElementById('createAdminHint').textContent = 'As System Admin, you can only create other System Admins.';
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

function openEditAdminModal(adminId, username, email, adminRole) {
  const overlay = document.createElement('div');
  overlay.id = 'editAdminOverlay';
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
    z-index: 2000;
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

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Edit Admin Account</h3>
    
    <div style="margin-bottom: 12px;">
      <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">Username</label>
      <input type="text" id="editAdminUsername" value="${username}" style="width:100%;padding:8px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
    </div>

    <div style="margin-bottom: 12px;">
      <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">Email</label>
      <input type="email" id="editAdminEmail" value="${email}" style="width:100%;padding:8px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
    </div>

    <div style="margin-bottom: 12px;">
      <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">Role</label>
      <select id="editAdminRole" style="width:100%;padding:8px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
        <option value="system_admin" ${adminRole === 'system_admin' ? 'selected' : ''}>System Admin</option>
        <option value="verification_admin" ${adminRole === 'verification_admin' ? 'selected' : ''}>Verification Admin</option>
        <option value="head_admin" ${adminRole === 'head_admin' ? 'selected' : ''}>Head Admin</option>
      </select>
    </div>

    <div style="margin-bottom: 12px;">
      <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">New Password (leave blank to keep current)</label>
      <input type="password" id="editAdminPassword" placeholder="Leave empty to keep current password" style="width:100%;padding:8px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closeEditAdminModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditAdmin(${adminId})" style="padding: 10px 20px;">Save Changes</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function closeEditAdminModal() {
  const overlay = document.getElementById('editAdminOverlay');
  if (overlay) {
    overlay.remove();
  }
}

async function submitEditAdmin(adminId) {
  const username = document.getElementById('editAdminUsername').value.trim();
  const email = document.getElementById('editAdminEmail').value.trim();
  const adminRole = document.getElementById('editAdminRole').value;
  const newPassword = document.getElementById('editAdminPassword').value;

  if (!username || !email || !adminRole) {
    alert('Please fill in all required fields');
    return;
  }

  const body = { username, email, admin_role: adminRole };
  if (newPassword) {
    body.password = newPassword;
  }

  try {
    const response = await fetch(`/api/admin/update-admin/${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Admin account updated successfully');
    closeEditAdminModal();
    loadAdminsList();
  } catch (err) {
    console.error('Error updating admin:', err);
    showToast(err.message || 'Error updating admin account', true);
  }
}

async function deleteAdmin(adminId, username) {
  if (!confirm(`Delete admin account "${username}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/delete-admin/${adminId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Admin account deleted successfully');
    loadAdminsList();
  } catch (err) {
    console.error('Error deleting admin:', err);
    showToast(err.message || 'Error deleting admin account', true);
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

// System Admin tab switching
function switchSystemAdminTab(tab) {
  console.log('[switchSystemAdminTab] Switching to tab:', tab);
  
  // Hide all tabs in the listing-admin-section
  document.querySelectorAll('#listing-admin-section > div[id$="-tab"]').forEach(el => {
    console.log('[switchSystemAdminTab] Hiding tab:', el.id);
    el.style.display = 'none';
  });
  
  // Update buttons
  document.querySelectorAll('#listing-admin-section .tab-btn').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected tab - construct proper ID for system admin tabs
  let tabId;
  if (tab === 'success-stories') {
    tabId = 'system-admin-success-stories-tab';
  } else if (tab === 'admin-management') {
    tabId = 'system-admin-management-tab';
  } else {
    tabId = tab + '-tab';
  }
  
  const tabEl = document.getElementById(tabId);
  console.log('[switchSystemAdminTab] Tab element found:', !!tabEl, tabId);
  
  if (tabEl) {
    tabEl.style.display = 'block';
    console.log('[switchSystemAdminTab] Tab displayed:', tab);
    
    if (event && event.target) {
      event.target.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tab === 'property-listings') {
      console.log('[switchSystemAdminTab] Loading property listings');
      switchView('pending');
      loadAdminStats();
    } else if (tab === 'success-stories') {
      console.log('[switchSystemAdminTab] Loading success stories');
      loadPendingStories();
    } else if (tab === 'admin-management') {
      console.log('[switchSystemAdminTab] Loading admin management');
      loadAdminsList();
    }
  } else {
    console.warn('[switchSystemAdminTab] Tab element not found:', tabId);
  }
}

// Head Admin tab switching (existing function, ensure it's defined)

// ---------------- Load Listings ----------------
// Load listings for a specific view. Tries multiple endpoint fallbacks for compatibility.
async function loadListings(status = 'pending') {
  currentView = status;
  
  // Update active tab highlighting - find buttons in the currently active section
  const headAdminSection = document.getElementById('head-admin-section');
  const listingAdminSection = document.getElementById('listing-admin-section');
  let targetSection = null;
  
  if (headAdminSection?.classList.contains('active')) {
    targetSection = headAdminSection;
  } else if (listingAdminSection?.classList.contains('active')) {
    targetSection = listingAdminSection;
  }
  
  if (targetSection) {
    const buttons = targetSection.querySelectorAll('button.btn-ghost[onclick*="switchView"]');
    buttons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Find and highlight the active button
    const activeButton = Array.from(buttons).find(btn => {
      const text = btn.textContent.toLowerCase();
      return (status === 'pending' && text.includes('pending')) || 
             (status === 'approved' && (text.includes('published') || text.includes('final'))) || 
             (status === 'rejected' && text.includes('rejected'));
    });
    if (activeButton) activeButton.classList.add('active');
  }
  
  // Find the correct tbody based on which section is active
  let tbody = null;
  
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
  const isSystemAdmin = user.admin_role === 'system_admin';
  const isHeadAdmin = user.admin_role === 'head_admin';

  let listings = [];
  let endpoint = null;

  console.log(`[loadListings] Loading status="${status}", isSystemAdmin=${isSystemAdmin}, isHeadAdmin=${isHeadAdmin}`);

  // Use role-based endpoints for system and head admins
  if (isSystemAdmin && status === 'pending') {
    endpoint = '/api/admin/listings/pending-approval';
    console.log('[loadListings] Using system admin endpoint:', endpoint);
  } else if (isSystemAdmin && status === 'rejected') {
    endpoint = '/api/admin/listings/rejected';
    console.log('[loadListings] Using system admin rejected endpoint:', endpoint);
  } else if (isHeadAdmin && status === 'pending') {
    endpoint = '/api/admin/listings/pending-head-admin';
    console.log('[loadListings] Using head admin pending endpoint:', endpoint);
  } else if (isHeadAdmin && status === 'approved') {
    // For head admin, "approved" view shows all listings (or published ones)
    endpoint = '/api/admin/listings/approvals';
    console.log('[loadListings] Using head admin all approvals endpoint:', endpoint);
  } else if (isHeadAdmin && status === 'rejected') {
    endpoint = '/api/admin/listings/rejected';
    console.log('[loadListings] Using head admin rejected endpoint:', endpoint);
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
        
        // For head admin "approved" view, filter to show only published listings
        if (isHeadAdmin && status === 'approved') {
          const beforeFilter = listings.length;
          listings = listings.filter(l => l.listing_status === 'published');
          console.log(`[loadListings] Head admin approved filter: ${beforeFilter} -> ${listings.length} listings`);
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
    } else if (isSystemAdmin && status === 'pending') {
      // System admin pending view: Approve button
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
      <td style="vertical-align:middle">${ownerName}</td>
      <td style="vertical-align:middle">${adminApprovedByName}</td>
    `;

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
  console.log('[toggleSelectMode] selectionActive:', selectionActive);
  
  // Find the correct table wrap in the currently visible listings tab
  let tableWrap;
  let activeSection;
  const headAdminListingsTab = document.getElementById('listings-tab');
  const systemAdminListingsTab = document.getElementById('property-listings-tab');
  
  console.log('[toggleSelectMode] Head admin tab display:', headAdminListingsTab?.style.display);
  console.log('[toggleSelectMode] System admin tab display:', systemAdminListingsTab?.style.display);
  
  // Check which is actually visible (not just inline style, but computed visibility)
  const headAdminVisible = headAdminListingsTab && headAdminListingsTab.offsetHeight > 0;
  const systemAdminVisible = systemAdminListingsTab && systemAdminListingsTab.offsetHeight > 0;
  
  console.log('[toggleSelectMode] Head admin visible:', headAdminVisible);
  console.log('[toggleSelectMode] System admin visible:', systemAdminVisible);
  
  if (systemAdminVisible) {
    tableWrap = systemAdminListingsTab.querySelector('.admin-table-wrap');
    activeSection = document.getElementById('listing-admin-section');
    console.log('[toggleSelectMode] Using system admin listings table');
  } else if (headAdminVisible) {
    tableWrap = headAdminListingsTab.querySelector('.admin-table-wrap');
    activeSection = document.getElementById('head-admin-section');
    console.log('[toggleSelectMode] Using head admin listings table');
  }
  
  console.log('[toggleSelectMode] Table wrap found:', !!tableWrap);
  
  if (tableWrap) {
    if (selectionActive) {
      tableWrap.classList.add('selection-active');
      console.log('[toggleSelectMode] Added selection-active class');
      console.log('[toggleSelectMode] Table wrap classes after add:', tableWrap.className);
    } else {
      tableWrap.classList.remove('selection-active');
      console.log('[toggleSelectMode] Removed selection-active class');
      console.log('[toggleSelectMode] Table wrap classes after remove:', tableWrap.className);
    }
  } else {
    console.warn('[toggleSelectMode] No table wrap found');
  }
  
  // Show/hide action buttons - find them within the active section
  let approveBtn, rejectBtn, clearBtn;
  
  if (activeSection) {
    approveBtn = activeSection.querySelector('#approveSelectedBtn');
    rejectBtn = activeSection.querySelector('#rejectSelectedBtn');
    clearBtn = activeSection.querySelector('#clearSelectionBtn');
  } else {
    // Fallback to global search
    approveBtn = document.getElementById('approveSelectedBtn');
    rejectBtn = document.getElementById('rejectSelectedBtn');
    clearBtn = document.getElementById('clearSelectionBtn');
  }
  
  console.log('[toggleSelectMode] Looking for buttons in active section:', {
    approveBtn: !!approveBtn,
    rejectBtn: !!rejectBtn,
    clearBtn: !!clearBtn
  });
  
  if (selectionActive) {
    if (approveBtn) {
      approveBtn.style.removeProperty('display');
      approveBtn.style.display = 'block';
      console.log('[toggleSelectMode] Approve button display set to:', approveBtn.style.display);
    }
    if (rejectBtn) {
      rejectBtn.style.removeProperty('display');
      rejectBtn.style.display = 'block';
      console.log('[toggleSelectMode] Reject button display set to:', rejectBtn.style.display);
    }
    if (clearBtn) {
      clearBtn.style.removeProperty('display');
      clearBtn.style.display = 'block';
      console.log('[toggleSelectMode] Clear button display set to:', clearBtn.style.display);
    }
  } else {
    if (approveBtn) approveBtn.style.display = 'none';
    if (rejectBtn) rejectBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
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
    const user = JSON.parse(localStorage.getItem('laboCurrentUser')) || {};
    const isSystemAdmin = user.admin_role === 'system_admin';
    const isHeadAdmin = user.admin_role === 'head_admin';

    const promises = ids.map(id => {
      if (action === 'approve') {
        let url;
        if (isSystemAdmin) {
          url = `/api/admin/listings/${id}/approve`;
        } else if (isHeadAdmin) {
          // Check if we're in the rejected view - if so, use re-approve
          // Otherwise use publish endpoint
          if (currentView === 'rejected') {
            url = `/api/admin/listings/${id}/re-approve`;
          } else {
            url = `/api/admin/listings/${id}/publish`;
          }
        }
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: '' })
        });
      }
      if (action === 'delete') {
        return fetch(`/api/admin/listings/${id}`, { method: 'DELETE' });
      }
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
  
  // Update active tab highlighting for system admin and head admin listings
  // Find buttons in the currently active section
  const headAdminSection = document.getElementById('head-admin-section');
  const listingAdminSection = document.getElementById('listing-admin-section');
  let targetSection = null;
  
  if (headAdminSection?.classList.contains('active')) {
    targetSection = headAdminSection;
  } else if (listingAdminSection?.classList.contains('active')) {
    targetSection = listingAdminSection;
  }
  
  if (targetSection) {
    const buttons = targetSection.querySelectorAll('button.btn-ghost[onclick*="switchView"]');
    buttons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Find and highlight the clicked button
    const activeButton = Array.from(buttons).find(btn => {
      const text = btn.textContent.toLowerCase();
      return (view === 'pending' && text.includes('pending')) || 
             (view === 'approved' && (text.includes('published') || text.includes('final'))) || 
             (view === 'rejected' && text.includes('rejected'));
    });
    if (activeButton) activeButton.classList.add('active');
  }
  
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
      <div class="modal-content-wrapper">
        <div class="modal-left">
          <p><strong>Owner:</strong> ${ownerName || '-'}</p>
          <p><strong>Owner Email:</strong> ${ownerEmail ? `<a href="mailto:${escapeHtml(ownerEmail)}">${escapeHtml(ownerEmail)}</a>` : '-'}</p>
          <p><strong>Type:</strong> ${formatPropertyType(app.type)}</p>
          <p><strong>Status:</strong> ${escapeHtml(app.status)}</p>
          <p><strong>Price:</strong> ₱${app.price ? Number(app.price).toLocaleString('en-PH') : '-'}</p>
          <p><strong>Size:</strong> ${app.size ? escapeHtml(app.size) + ' m²' : '-'}</p>
          <p><strong>Description:</strong> ${escapeHtml(app.description)}</p>
        </div>
        <div class="modal-right">
          ${app.image_url ? `<div class="property-image-section"><h3>Property Image</h3><img class=\"modal-doc-thumb\" src=\"${escapeHtml(app.image_url)}\" alt=\"image\" onclick=\"openImagePreview('${escapeHtml(app.image_url)}')\" style=\"width:100%;cursor:pointer;\"></div>` : ''}
          <h3>Documents</h3>
          <div style="margin-top:8px">
            ${renderDocumentHTML(app.oct_tct_url, 'OCT / TCT')}
            ${renderDocumentHTML(app.tax_declaration_url, 'Tax Declaration')}
            ${renderDocumentHTML(app.doas_url, 'DOAS')}
            ${renderDocumentHTML(app.government_id_url, 'Government ID')}
          </div>
        </div>
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
    const isSystemAdmin = user.admin_role === 'system_admin';
    const isHeadAdmin = user.admin_role === 'head_admin';

    if (action === 'approve') {
      // For rejected listings in the rejected view, use re-approve endpoint
      // Otherwise use the normal approve endpoint
      if (isSystemAdmin) {
        url = `/api/admin/listings/${id}/approve`;
        opts.body = JSON.stringify({ notes: '' });
      } else if (isHeadAdmin) {
        // Check if we're in the rejected view - if so, use re-approve
        // Otherwise use publish endpoint
        if (currentView === 'rejected') {
          // Always use re-approve to change from 'rejected' to 'admin_approved'
          url = `/api/admin/listings/${id}/re-approve`;
          opts.body = JSON.stringify({ notes: '' });
        } else {
          url = `/api/admin/listings/${id}/publish`;
          opts.body = JSON.stringify({ notes: '' });
        }
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
      
      // Special handling for re-approve action - may need to publish afterward
      if (action === 'approve' && currentView === 'rejected' && isHeadAdmin) {
        const listing = rejectedListings.find(l => (l.listing_id || l.id) === id);
        const wasPublished = listing && listing.head_admin_approved_at;
        
        // Clear all listing arrays to ensure fresh reload
        pendingListings = [];
        approvedListings = [];
        rejectedListings = [];
        currentListings = [];
        
        // If it was previously published, call publish endpoint after re-approve
        if (wasPublished) {
          try {
            console.log(`[takeAction] Re-approved listing ${id}, now publishing...`);
            const publishRes = await fetch(`/api/admin/listings/${id}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: '' })
            });
            if (!publishRes.ok) {
              const publishErr = await publishRes.json();
              console.error('Publish after re-approve failed:', publishErr);
            }
          } catch (e) {
            console.error('Error publishing after re-approve:', e);
          }
        }
        
        // Fetch fresh data for all views
        const endpoints = {
          'pending': isHeadAdmin ? '/api/admin/listings/pending-head-admin' : '/api/admin/listings/pending-approval',
          'approved': '/api/admin/listings/approvals',
          'rejected': '/api/admin/listings/rejected'
        };
        
        for (const [status, endpoint] of Object.entries(endpoints)) {
          try {
            const response = await fetch(endpoint, { credentials: 'same-origin' });
            if (response.ok) {
              const listings = await response.json();
              if (status === 'pending') pendingListings = listings;
              else if (status === 'approved') approvedListings = listings;
              else if (status === 'rejected') rejectedListings = listings;
            }
          } catch (e) {
            console.error(`Error loading ${status} listings:`, e);
          }
        }
        
        await loadAdminStats();
        
        // Refresh all views' HTML to ensure clean display
        // Find tbody the same way loadListings does
        const headAdminSection = document.getElementById('head-admin-section');
        const listingAdminSection = document.getElementById('listing-admin-section');
        let tbody = null;
        
        if (headAdminSection?.classList.contains('active')) {
          tbody = headAdminSection.querySelector('tbody#appsTable');
        } else if (listingAdminSection?.classList.contains('active')) {
          tbody = listingAdminSection.querySelector('tbody#appsTable');
        } else {
          tbody = document.querySelector('tbody#appsTable');
        }
        
        if (tbody) {
          tbody.innerHTML = ''; // Clear to prevent stale data
        }
        
        // Determine target view based on previous state
        const targetView = wasPublished ? 'approved' : 'pending';
        currentView = targetView;
        await loadListings(targetView);
        showToast(`Listing re-approved and restored to ${wasPublished ? 'published' : 'pending'} view`);
      } else {
        // For other actions, clear and reload all views
        pendingListings = [];

        approvedListings = [];
        rejectedListings = [];
        currentListings = [];
        
        // Fetch fresh data for all views
        const endpoints = {
          'pending': isSystemAdmin ? '/api/admin/listings/pending-approval' : '/api/admin/listings/pending-head-admin',
          'approved': '/api/admin/listings/approvals',
          'rejected': '/api/admin/listings/rejected'
        };
        
        for (const [status, endpoint] of Object.entries(endpoints)) {
          try {
            const response = await fetch(endpoint, { credentials: 'same-origin' });
            if (response.ok) {
              const listings = await response.json();
              if (status === 'pending') pendingListings = listings;
              else if (status === 'approved') approvedListings = listings;
              else if (status === 'rejected') rejectedListings = listings;
            }
          } catch (e) {
            console.error(`Error loading ${status} listings:`, e);
          }
        }
        
        await loadAdminStats();
        
        // Refresh current view display
        // Find tbody the same way loadListings does
        const headAdminSection2 = document.getElementById('head-admin-section');
        const listingAdminSection2 = document.getElementById('listing-admin-section');
        let tbody2 = null;
        
        if (headAdminSection2?.classList.contains('active')) {
          tbody2 = headAdminSection2.querySelector('tbody#appsTable');
        } else if (listingAdminSection2?.classList.contains('active')) {
          tbody2 = listingAdminSection2.querySelector('tbody#appsTable');
        } else {
          tbody2 = document.querySelector('tbody#appsTable');
        }
        
        if (tbody2) {
          tbody2.innerHTML = ''; // Clear to prevent stale data
        }
        await loadListings(currentView);
        showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`);
      }
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
      const res = await fetch(`/api/admin/listings/${listingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      let data = {};
      try { data = await res.json(); } catch (e) { }

      if (res.ok) {
        closeAppModal();
        // Save current view to restore after reload
        const savedView = currentView;
        const user = JSON.parse(localStorage.getItem('laboCurrentUser')) || {};
        const isSystemAdmin = user.admin_role === 'system_admin';
        
        // Clear all listing arrays to ensure fresh reload
        pendingListings = [];
        approvedListings = [];
        rejectedListings = [];
        currentListings = [];
        
        // Fetch fresh data for all views
        const endpoints = {
          'pending': isSystemAdmin ? '/api/admin/listings/pending-approval' : '/api/admin/listings/pending-head-admin',
          'approved': '/api/admin/listings/approvals',
          'rejected': '/api/admin/listings/rejected'
        };
        
        for (const [status, endpoint] of Object.entries(endpoints)) {
          try {
            const response = await fetch(endpoint, { credentials: 'same-origin' });
            if (response.ok) {
              const listings = await response.json();
              if (status === 'pending') pendingListings = listings;
              else if (status === 'approved') approvedListings = listings;
              else if (status === 'rejected') rejectedListings = listings;
            }
          } catch (e) {
            console.error(`Error loading ${status} listings:`, e);
          }
        }
        
        await loadAdminStats();
        
        // Clear tbody to prevent stale HTML - find it the same way loadListings does
        const headAdminSection = document.getElementById('head-admin-section');
        const listingAdminSection = document.getElementById('listing-admin-section');
        let tbody = null;
        
        if (headAdminSection?.classList.contains('active')) {
          tbody = headAdminSection.querySelector('tbody#appsTable');
        } else if (listingAdminSection?.classList.contains('active')) {
          tbody = listingAdminSection.querySelector('tbody#appsTable');
        } else {
          tbody = document.querySelector('tbody#appsTable');
        }
        
        if (tbody) {
          tbody.innerHTML = '';
        }
        
        // Restore the original view and reload display once
        currentView = savedView;
        await loadListings(savedView);
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
        fetch(`/api/admin/listings/${id}/reject`, {
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
let rejectedStories = [];
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
    
    // Filter only 'pending' stories (not system_admin_approved)
    pendingStories = Array.isArray(data) ? data.filter(s => s.status === 'pending') : [];
    rejectedStories = Array.isArray(data) ? data.filter(s => s.status === 'rejected') : [];
    document.getElementById('stat-stories-pending').textContent = pendingStories.length;
    document.getElementById('stat-stories-rejected').textContent = rejectedStories.length;
    renderStoriesTable();
  } catch (err) {
    console.error('Error loading stories:', err);
    document.getElementById('storiesTable').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#f44336">Error: ' + err.message + '</td></tr>';
  }
}

// Load pending stories for head admin
async function loadHeadAdminStories() {
  try {
    console.log('[loadHeadAdminStories] Starting to load head admin stories');
    const response = await fetch('/api/admin/success-stories/pending');
    console.log('[loadHeadAdminStories] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load stories');
    }
    const data = await response.json();
    console.log('[loadHeadAdminStories] Got data:', data);
    console.log('[loadHeadAdminStories] Data is array:', Array.isArray(data));
    console.log('[loadHeadAdminStories] Data length:', Array.isArray(data) ? data.length : 'not an array');
    
    // Store all stories
    allHeadAdminStories = Array.isArray(data) ? data : [];
    console.log('[loadHeadAdminStories] All stories count:', allHeadAdminStories.length);
    
    // Filter by status and log each story
    headPendingStories = allHeadAdminStories.filter(s => {
      console.log('[loadHeadAdminStories] Checking story', s.id, '- status:', s.status, '- is system_admin_approved?', s.status === 'system_admin_approved');
      return s.status === 'system_admin_approved';
    });
    headPublishedStories = allHeadAdminStories.filter(s => s.status === 'published');
    headRejectedStories = allHeadAdminStories.filter(s => s.status === 'rejected');
    
    console.log('[loadHeadAdminStories] Pending:', headPendingStories.length, 'Published:', headPublishedStories.length, 'Rejected:', headRejectedStories.length);
    
    // Update counts
    document.getElementById('stat-stories-head-pending').textContent = headPendingStories.length;
    const statPublished = document.getElementById('stat-stories-head-published');
    const statRejected = document.getElementById('stat-stories-head-rejected');
    if (statPublished) statPublished.textContent = headPublishedStories.length;
    if (statRejected) statRejected.textContent = headRejectedStories.length;
    
    console.log('[loadHeadAdminStories] About to render tables');
    renderHeadStoriesTable();
    renderHeadPublishedStoriesTable();
    renderHeadRejectedStoriesTable();
    
    // Initialize active tab highlighting for stories
    switchHeadAdminStoriesView('pending');
    
    console.log('[loadHeadAdminStories] Finished rendering');
    
    return Promise.resolve();
  } catch (err) {
    console.error('Error loading head admin stories:', err);
    const tbody = document.getElementById('headStoriesTable');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#f44336">Error: ' + err.message + '</td></tr>';
    }
    return Promise.reject(err);
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
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'listing-admin')">Review</button>
        <button class="btn btn-sm btn-primary" onclick="openApproveStoryModal(${story.id})">Approve & Send</button>
        <button class="btn btn-sm btn-ghost" style="background:#f44336;color:white;border:none" onclick="openRejectStoryModal(${story.id})">Reject</button>
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

function renderRejectedStoriesTable() {
  const tbody = document.getElementById('storiesTable');
  
  if (!rejectedStories || rejectedStories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No rejected success stories</td></tr>';
    return;
  }

  tbody.innerHTML = rejectedStories.map(story => `
    <tr>
      ${storiesSelectionActive ? `<td><input type="checkbox" onchange="toggleStorySelection(${story.id}, this.checked)" ${selectedStories.has(story.id) ? 'checked' : ''}></td>` : ''}
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.location}</td>
      <td>${story.business_type}</td>
      <td><span class="badge" style="background:#f44336;color:#fff">Rejected</span></td>
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'listing-admin')">Review</button>
        <button class="btn btn-sm btn-primary" onclick="openApproveStoryModal(${story.id})">Re-Approve</button>
        <button class="btn btn-sm btn-ghost" style="background:#f44336;color:white;border:none" onclick="deleteStoryInline(${story.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function approveStoryInline(storyId) {
  try {
    const response = await fetch(`/api/admin/success-stories/${storyId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: '' })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showToast(error.error || 'Failed to approve story', true);
      return;
    }
    
    showToast('Story approved and sent to head admin');
    await loadPendingStories();
    switchStoriesView('pending');
  } catch (err) {
    console.error('Error approving story:', err);
    showToast('Error approving story', true);
  }
}

async function rejectStoryInline(storyId) {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;
  
  try {
    const response = await fetch(`/api/admin/success-stories/${storyId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showToast(error.error || 'Failed to reject story', true);
      return;
    }
    
    showToast('Story rejected');
    await loadPendingStories();
    switchStoriesView('rejected');
  } catch (err) {
    console.error('Error rejecting story:', err);
    showToast('Error rejecting story', true);
  }
}

async function deleteStoryInline(storyId) {
  if (!confirm('Delete this story permanently?')) return;
  
  try {
    const response = await fetch(`/api/admin/success-stories/${storyId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      showToast(error.error || 'Failed to delete story', true);
      return;
    }
    
    showToast('Story deleted');
    await loadPendingStories();
    switchStoriesView('rejected');
  } catch (err) {
    console.error('Error deleting story:', err);
    showToast('Error deleting story', true);
  }
}

function renderHeadStoriesTable() {
  console.log('[renderHeadStoriesTable] Called');
  const tbody = document.getElementById('headStoriesTable');
  console.log('[renderHeadStoriesTable] tbody found:', !!tbody);
  
  if (!tbody) {
    console.error('[renderHeadStoriesTable] tbody not found - cannot render');
    return;
  }
  
  console.log('[renderHeadStoriesTable] headPendingStories length:', headPendingStories ? headPendingStories.length : 'undefined');
  
  if (!headPendingStories || headPendingStories.length === 0) {
    console.log('[renderHeadStoriesTable] No pending stories - showing empty message');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No stories awaiting final approval</td></tr>';
    return;
  }

  console.log('[renderHeadStoriesTable] Rendering', headPendingStories.length, 'stories');
  tbody.innerHTML = headPendingStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.system_admin_name || 'N/A'}</td>
      <td><span class="badge" style="background:#4CAF50;color:#fff">System Admin Approved</span></td>
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'head-admin')">Review</button>
        <button class="btn btn-sm btn-primary" onclick="openPublishStoryModal(${story.id})">Publish</button>
        <button class="btn btn-sm btn-ghost" style="background:#f44336;color:white;border:none" onclick="openRejectStoryModal(${story.id})">Reject</button>
      </td>
    </tr>
  `).join('');
}

function renderHeadPublishedStoriesTable() {
  console.log('[renderHeadPublishedStoriesTable] Called');
  const tbody = document.getElementById('headPublishedStoriesTable');
  console.log('[renderHeadPublishedStoriesTable] tbody found:', !!tbody);
  
  if (!tbody) {
    console.error('[renderHeadPublishedStoriesTable] tbody not found - cannot render');
    return;
  }
  
  console.log('[renderHeadPublishedStoriesTable] headPublishedStories length:', headPublishedStories ? headPublishedStories.length : 'undefined');
  
  if (!headPublishedStories || headPublishedStories.length === 0) {
    console.log('[renderHeadPublishedStoriesTable] No published stories - showing empty message');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No published success stories</td></tr>';
    return;
  }

  console.log('[renderHeadPublishedStoriesTable] Rendering', headPublishedStories.length, 'stories');
  tbody.innerHTML = headPublishedStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td><span class="badge" style="background:#2196F3;color:#fff">Published</span></td>
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'head-admin')">Review</button>
        <button class="btn btn-sm btn-ghost" style="background:#f44336;color:white;border:none" onclick="openRejectStoryModal(${story.id})">Reject</button>
      </td>
    </tr>
  `).join('');
}

function renderHeadRejectedStoriesTable() {
  console.log('[renderHeadRejectedStoriesTable] Called');
  const tbody = document.getElementById('headRejectedStoriesTable');
  console.log('[renderHeadRejectedStoriesTable] tbody found:', !!tbody);
  
  if (!tbody) {
    console.error('[renderHeadRejectedStoriesTable] tbody not found - cannot render');
    return;
  }
  
  console.log('[renderHeadRejectedStoriesTable] headRejectedStories length:', headRejectedStories ? headRejectedStories.length : 'undefined');
  
  if (!headRejectedStories || headRejectedStories.length === 0) {
    console.log('[renderHeadRejectedStoriesTable] No rejected stories - showing empty message');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No rejected success stories</td></tr>';
    return;
  }

  console.log('[renderHeadRejectedStoriesTable] Rendering', headRejectedStories.length, 'stories');
  tbody.innerHTML = headRejectedStories.map(story => `
    <tr>
      <td><img src="${story.image_url}" alt="${story.business_name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="previewImage('${story.image_url}')"></td>
      <td><strong>${story.business_name}</strong></td>
      <td>${story.investor_name}</td>
      <td>${story.head_admin_notes || 'N/A'}</td>
      <td><span class="badge" style="background:#f44336;color:#fff">Rejected</span></td>
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-primary" onclick="openStoryModal(${story.id}, 'head-admin')">Review</button>
        <button class="btn btn-sm btn-primary" onclick="openPublishStoryModal(${story.id})">Re-Publish</button>
      </td>
    </tr>
  `).join('');
}

async function openStoryModal(storyId, role) {
  try {
    // Search for the story across all arrays
    let story = null;
    let storyStatus = null;
    
    if (role === 'head-admin') {
      story = headPendingStories.find(s => s.id === storyId);
      if (!story) story = headPublishedStories.find(s => s.id === storyId);
      if (!story) story = headRejectedStories.find(s => s.id === storyId);
      if (story) storyStatus = story.status;
    } else {
      story = pendingStories.find(s => s.id === storyId);
      if (!story) story = allHeadAdminStories?.find(s => s.id === storyId);
      if (story) storyStatus = story.status;
    }
    
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
        ${story.system_admin_notes ? `<p><strong>System Admin Notes:</strong><br>${story.system_admin_notes}</p>` : ''}
        ${story.head_admin_notes ? `<p><strong>Head Admin Notes:</strong><br>${story.head_admin_notes}</p>` : ''}
      </div>
    `;

    document.getElementById('storyModalTitle').textContent = 'Success Story Review';
    document.getElementById('storyModalBody').innerHTML = html;

    const actionsDiv = document.getElementById('storyModalActions');
    let actionButtons = '';

    if (role === 'listing-admin' || role === 'system-admin') {
      // System admin can approve pending, re-approve rejected, or reject any
      if (storyStatus === 'pending') {
        actionButtons = `
          <button class="btn btn-primary" onclick="openApproveStoryModal(${storyId})">Approve & Send to Head Admin</button>
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
        `;
      } else if (storyStatus === 'rejected') {
        actionButtons = `
          <button class="btn btn-primary" onclick="openApproveStoryModal(${storyId})">Re-Approve Story</button>
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Delete</button>
        `;
      } else if (storyStatus === 'system_admin_approved') {
        actionButtons = `
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
        `;
      }
    } else if (role === 'head-admin') {
      // Head admin can publish system-admin-approved stories, reject them, publish published stories is weird so maybe revoke, and re-approve rejected
      if (storyStatus === 'system_admin_approved') {
        actionButtons = `
          <button class="btn btn-primary" onclick="openPublishStoryModal(${storyId})">Publish Story</button>
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
        `;
      } else if (storyStatus === 'published') {
        actionButtons = `
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Reject</button>
        `;
      } else if (storyStatus === 'rejected') {
        actionButtons = `
          <button class="btn btn-primary" onclick="openPublishStoryModal(${storyId})">Re-Publish Story</button>
          <button class="btn btn-ghost" style="background:#f44336;color:white" onclick="openRejectStoryModal(${storyId})">Delete</button>
        `;
      }
    }

    actionsDiv.innerHTML = actionButtons;
    document.getElementById('storyModal').classList.add('open');
  } catch (err) {
    console.error('Error opening story modal:', err);
    showToast('Error loading story', true);
  }
}

function closeStoryModal() {
  document.getElementById('storyModal').classList.remove('open');
}

function openApproveStoryModal(storyId) {
  const overlay = document.createElement('div');
  overlay.id = 'approveStoryOverlay';
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

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Approve Success Story</h3>
    <p style="color: #666; margin-bottom: 20px;">Are you sure you want to approve this story?</p>
    
    <label style="display: block; margin-bottom: 15px;">
      <span style="font-size: 14px; font-weight: 500; display: block; margin-bottom: 8px;">Add notes (optional):</span>
      <textarea 
        id="approveStoryNotes" 
        placeholder="Add any notes..." 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; min-height: 80px; box-sizing: border-box; resize: vertical;"
      ></textarea>
    </label>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closeApproveStoryModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-primary" id="confirmApproveStoryBtn" style="padding: 10px 20px;">Approve</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('confirmApproveStoryBtn').addEventListener('click', async () => {
    const notes = document.getElementById('approveStoryNotes').value.trim();
    closeApproveStoryModal();
    await approveStory(storyId, notes);
  });
}

function closeApproveStoryModal() {
  const overlay = document.getElementById('approveStoryOverlay');
  if (overlay) {
    overlay.remove();
  }
}

function openPublishStoryModal(storyId) {
  const overlay = document.createElement('div');
  overlay.id = 'publishStoryOverlay';
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

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Publish Success Story</h3>
    <p style="color: #666; margin-bottom: 20px;">Are you sure you want to publish this story?</p>
    
    <label style="display: block; margin-bottom: 15px;">
      <span style="font-size: 14px; font-weight: 500; display: block; margin-bottom: 8px;">Add notes (optional):</span>
      <textarea 
        id="publishStoryNotes" 
        placeholder="Add any notes..." 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; min-height: 80px; box-sizing: border-box; resize: vertical;"
      ></textarea>
    </label>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closePublishStoryModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-primary" id="confirmPublishStoryBtn" style="padding: 10px 20px;">Publish</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('confirmPublishStoryBtn').addEventListener('click', async () => {
    const notes = document.getElementById('publishStoryNotes').value.trim();
    closePublishStoryModal();
    await publishStory(storyId, notes);
  });
}

function closePublishStoryModal() {
  const overlay = document.getElementById('publishStoryOverlay');
  if (overlay) {
    overlay.remove();
  }
}

async function approveStory(storyId, notes = '') {
  try {
    const response = await fetch(`/api/admin/success-stories/${storyId}/system-admin-approve`, {
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

async function publishStory(storyId, notes = '') {
  try {
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
  const overlay = document.createElement('div');
  overlay.id = 'storyRejectionOverlay';
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
  STORY_REJECTION_REASONS.forEach((reason) => {
    reasonsHTML += `
      <label style="display: block; margin-bottom: 12px; cursor: pointer;">
        <input type="radio" name="story_rejection_reason" value="${reason}" style="margin-right: 10px;">
        <span style="font-size: 14px;">${reason}</span>
      </label>
    `;
  });

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px;">Reject Success Story</h3>
    <p style="color: #666; margin-bottom: 20px;">Select a reason for rejecting this story:</p>
    
    <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
      ${reasonsHTML}
    </div>

    <div id="customReasonStoryContainer" style="display: none; margin-bottom: 20px;">
      <textarea 
        id="customReasonStory" 
        placeholder="Enter your custom rejection reason..." 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; min-height: 80px; box-sizing: border-box; resize: vertical;"
      ></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-ghost" onclick="closeRejectStoryModal()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-danger" id="confirmRejectStoryBtn" style="padding: 10px 20px;">Reject</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Show custom reason input when "Custom reason" is selected
  const radios = modal.querySelectorAll('input[name="story_rejection_reason"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customContainer = document.getElementById('customReasonStoryContainer');
      if (e.target.value === 'Custom reason') {
        customContainer.style.display = 'block';
        document.getElementById('customReasonStory').focus();
      } else {
        customContainer.style.display = 'none';
      }
    });
  });

  // Handle rejection confirmation
  document.getElementById('confirmRejectStoryBtn').addEventListener('click', async () => {
    const selectedRadio = modal.querySelector('input[name="story_rejection_reason"]:checked');
    if (!selectedRadio) {
      showToast('Please select a reason', true);
      return;
    }

    let reason = selectedRadio.value;
    if (reason === 'Custom reason') {
      const customText = document.getElementById('customReasonStory').value.trim();
      if (!customText) {
        showToast('Please enter a custom reason', true);
        return;
      }
      reason = customText;
    }

    // Close the modal
    closeRejectStoryModal();

    // Perform the rejection
    await rejectStory(storyId, reason);
  });
}

function closeRejectStoryModal() {
  const overlay = document.getElementById('storyRejectionOverlay');
  if (overlay) {
    overlay.remove();
  }
}

async function rejectStory(storyId, reason) {
  try {
    // Determine which endpoint to use based on admin role
    const user = JSON.parse(localStorage.getItem('laboCurrentUser')) || {};
    const isHeadAdmin = user.admin_role === 'head_admin';
    const endpoint = isHeadAdmin 
      ? `/api/admin/success-stories/${storyId}/head-admin-reject`
      : `/api/admin/success-stories/${storyId}/system-admin-reject`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ notes: reason })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Story rejected');
    closeStoryModal();
    
    // Reload appropriate view based on role
    if (isHeadAdmin) {
      await loadHeadAdminStories();
    } else {
      await loadPendingStories();
    }
  } catch (err) {
    console.error('Error rejecting story:', err);
    showToast(err.message || 'Error rejecting story', true);
  }
}

// Story rejection reasons (similar to listing rejection)
const STORY_REJECTION_REASONS = [
  'Inappropriate content',
  'Inaccurate or unverifiable information',
  'Photos are unclear or missing',
  'Does not meet success story requirements',
  'Duplicate story',
  'Violates platform terms and conditions',
  'Custom reason'
];

function switchStoriesView(view) {
  const currentStoriesView = view || 'pending';
  
  if (currentStoriesView === 'pending') {
    pendingStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderStoriesTable();
  } else if (currentStoriesView === 'rejected') {
    rejectedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderRejectedStoriesTable();
  }
}

// Stories bulk action tracking
let selectedStories = new Set();
let storiesSelectionActive = false;

function toggleStoriesSelectMode() {
  storiesSelectionActive = !storiesSelectionActive;
  selectedStories.clear();
  
  const btn = document.getElementById('toggleStoriesSelectBtn');
  btn.textContent = storiesSelectionActive ? 'Disable Select' : 'Toggle Select';
  
  // Show/hide action buttons
  const approveBtn = document.getElementById('approveStoriesSelectedBtn');
  const rejectBtn = document.getElementById('rejectStoriesSelectedBtn');
  const clearBtn = document.getElementById('clearStoriesSelectionBtn');
  
  if (storiesSelectionActive) {
    if (approveBtn) approveBtn.style.display = 'block';
    if (rejectBtn) rejectBtn.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'block';
  } else {
    if (approveBtn) approveBtn.style.display = 'none';
    if (rejectBtn) rejectBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
  }
  
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
      const response = await fetch(`/api/admin/success-stories/${storyId}/system-admin-approve`, {
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
