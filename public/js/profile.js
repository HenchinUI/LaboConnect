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

    // Hide business-only sections for investor users
    if (sesData.user.user_type === 'investor') {
      const myListingsSection = document.getElementById('myListingsSection');
      if (myListingsSection) myListingsSection.style.display = 'none';
      
      const notificationsSection = document.getElementById('notificationsSection');
      if (notificationsSection) notificationsSection.style.display = 'none';
    }

    // Load verification status
    await loadVerificationStatus();

    // Load notifications
    await loadNotifications();

    // Load transaction dashboards (sales for business, purchases for investor)
    await loadTransactionDashboards();

    // Setup event listeners
    setupEventListeners();
    
    // Setup verification modal
    setupVerificationModal();
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
  
  if (profileInitials && profilePictureImg) {
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
  }

  // Personal Info
  const nameDisplay = document.getElementById('nameDisplay');
  if (nameDisplay) nameDisplay.textContent = data.username || 'Not provided';
  
  const emailDisplay = document.getElementById('emailDisplay');
  if (emailDisplay) emailDisplay.textContent = data.email || 'Not provided';
  
  const contactDisplay = document.getElementById('contactDisplay');
  if (contactDisplay) contactDisplay.textContent = data.contact_number || 'Not provided';

  // Bio
  const bioDisplay = document.getElementById('bioDisplay');
  if (bioDisplay) bioDisplay.textContent = data.bio || 'No bio added yet';

  // Populate edit fields
  const fullNameInput = document.getElementById('fullNameInput');
  if (fullNameInput) fullNameInput.value = data.username || '';
  
  const emailInput = document.getElementById('emailInput');
  if (emailInput) emailInput.value = data.email || '';
  
  const contactInput = document.getElementById('contactInput');
  if (contactInput) contactInput.value = data.contact_number || '';
  
  const bioInput = document.getElementById('bioInput');
  if (bioInput) bioInput.value = data.bio || '';

  // Update stats
  const listingsCountEl = document.getElementById('listingsCount');
  if (listingsCountEl) listingsCountEl.textContent = data.listings_count || 0;
  
  const inquiriesCountEl = document.getElementById('inquiriesCount');
  if (inquiriesCountEl) inquiriesCountEl.textContent = data.inquiries_count || 0;

  // Member since date
  if (data.created_at) {
    const date = new Date(data.created_at);
    const year = date.getFullYear();
    const memberSinceEl = document.getElementById('memberSince');
    if (memberSinceEl) memberSinceEl.textContent = year;
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

// Convert notification status codes to user-friendly messages
function getStatusMessage(status) {
  const statusMap = {
    'system_admin_approved': 'Pre-approved by System Admin',
    'published': 'Published & Live',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'pending': 'Pending Review'
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
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
    const statusMessage = getStatusMessage(notif.status);

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
              ${statusMessage}
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

// Load transaction dashboards based on user type
async function loadTransactionDashboards() {
  try {
    // Get user session to check user type
    const sesRes = await fetch('/api/session', { credentials: 'same-origin' });
    const sesData = await sesRes.json();
    
    if (!sesData.user) return;

    const userType = sesData.user.user_type;
  } catch (e) {
    console.error('Error loading transaction dashboards:', e);
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

  // Only setup if elements exist (profile.html, not user-dashboard.html)
  if (editToggleBtn) editToggleBtn.addEventListener('click', toggleEditMode);
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
  if (shareProfileBtn) shareProfileBtn.addEventListener('click', shareProfile);
  if (uploadPictureBtn && profilePictureInput) {
    uploadPictureBtn.addEventListener('click', () => profilePictureInput.click());
    profilePictureInput.addEventListener('change', handleProfilePictureChange);
  }

  // Success story modal handlers
  const closeSuccessModal = document.getElementById('closeSuccessModal');
  const cancelSuccessBtn = document.getElementById('cancelSuccessBtn');
  const successStoryForm = document.getElementById('successStoryForm');
  const uploadImageBtn = document.getElementById('uploadImageBtn');
  const successImageInput = document.getElementById('successImageInput');

  if (closeSuccessModal) closeSuccessModal.addEventListener('click', closeSuccessStoryModal);
  if (cancelSuccessBtn) cancelSuccessBtn.addEventListener('click', closeSuccessStoryModal);
  if (successStoryForm) successStoryForm.addEventListener('submit', submitSuccessStory);
  if (uploadImageBtn && successImageInput) {
    uploadImageBtn.addEventListener('click', () => successImageInput.click());
    successImageInput.addEventListener('change', handleSuccessImageUpload);
  }

  // Business type dropdown handler
  const businessTypeSelect = document.getElementById('successBusinessType');
  if (businessTypeSelect) {
    businessTypeSelect.addEventListener('change', handleBusinessTypeChange);
  }
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
  if (!messageEl) return; // Element doesn't exist on this page
  
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

// Load and display verification status
async function loadVerificationStatus() {
  try {
    const res = await fetch('/api/verification/status', {
      credentials: 'same-origin'
    });
    
    if (!res.ok) {
      console.error('Failed to load verification status');
      return;
    }
    
    const data = await res.json();
    displayVerificationStatus(data);
  } catch (e) {
    console.error('Error loading verification status:', e);
  }
}

// Display verification status and update badge
function displayVerificationStatus(status) {
  const statusText = document.getElementById('verificationStatusText');
  const statusDesc = document.getElementById('verificationDescription');
  const requestBtn = document.getElementById('requestVerificationBtn');
  const badge = document.getElementById('profileVerifiedBadge');
  const statusContainer = document.getElementById('verificationStatusContainer');
  const badgeDiv = document.getElementById('verificationBadge');
  
  // Skip if elements don't exist (e.g., on user-dashboard.html)
  if (!statusText || !statusDesc || !requestBtn || !badge || !statusContainer || !badgeDiv) {
    return;
  }
  
  if (status.status === 'verified') {
    statusText.textContent = 'Verified ✓';
    statusDesc.textContent = 'Your account has been verified. You can now submit listings and send inquiries.';
    requestBtn.style.display = 'none';
    badge.style.display = 'flex';
    badgeDiv.className = 'verification-status-verified';
    badgeDiv.innerHTML = '✓';
    statusContainer.style.background = '#d1fae5';
  } else if (status.status === 'pending') {
    statusText.textContent = 'Verification Pending';
    statusDesc.textContent = 'Your verification request is under review. Please wait for approval.';
    requestBtn.style.display = 'none';
    badge.style.display = 'none';
    badgeDiv.className = 'verification-status-pending';
    badgeDiv.innerHTML = '⏳';
    statusContainer.style.background = '#fef3c7';
  } else {
    statusText.textContent = 'Not Verified';
    statusDesc.textContent = 'Verify your account to unlock features like submitting listings and sending inquiries.';
    requestBtn.style.display = 'block';
    badge.style.display = 'none';
    badgeDiv.className = 'verification-status-unverified';
    badgeDiv.innerHTML = '✕';
    statusContainer.style.background = '#fee2e2';
  }
}

// Setup verification modal
function setupVerificationModal() {
  const modal = document.getElementById('verificationModal');
  const cameraModal = document.getElementById('cameraModal');
  const closeBtn = document.getElementById('closeVerificationModal');
  const requestBtn = document.getElementById('requestVerificationBtn');
  const form = document.getElementById('verificationForm');
  
  // Exit early if required elements don't exist
  if (!modal || !cameraModal || !closeBtn || !requestBtn || !form) {
    console.warn('Verification modal elements not found, skipping setup');
    return;
  }
  
  let selfieFile = null;
  let idFile = null;
  let userEmail = null;
  let currentCameraMode = null; // 'selfie' or 'id'
  let cameraStream = null;
  
  // Camera functions
  async function startCamera(mode) {
    currentCameraMode = mode;
    const cameraTitle = document.getElementById('cameraModalTitle');
    const video = document.getElementById('cameraVideo');
    
    if (mode === 'selfie') {
      cameraTitle.textContent = 'Position your face in the center';
    } else {
      cameraTitle.textContent = 'Capture your ID document clearly';
    }
    
    cameraModal.style.display = 'flex';
    
    try {
      const constraints = {
        video: {
          facingMode: mode === 'selfie' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = cameraStream;
      video.play();
    } catch (err) {
      console.error('Camera error:', err);
      showVerificationMessage('Camera access denied or not available. Please use upload option.', 'error');
      cameraModal.style.display = 'none';
    }
  }
  
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    cameraModal.style.display = 'none';
  }
  
  function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('captureCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Flip horizontally for selfie
    if (currentCameraMode === 'selfie') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        showVerificationMessage('Failed to capture photo. Please try again.', 'error');
        return;
      }
      
      if (currentCameraMode === 'selfie') {
        selfieFile = blob;
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('selfiePreviewImage').src = e.target.result;
          document.getElementById('selfiePreviewImage').style.display = 'block';
        };
        reader.onerror = () => {
          showVerificationMessage('Failed to process selfie. Please try again.', 'error');
        };
        reader.readAsDataURL(blob);
        document.getElementById('selfieFileName').textContent = 'Selfie captured';
        document.getElementById('proceedFromStep1Btn').disabled = false;
      } else {
        idFile = blob;
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('idPreviewImage').src = e.target.result;
          document.getElementById('idPreviewImage').style.display = 'block';
        };
        reader.onerror = () => {
          showVerificationMessage('Failed to process ID document. Please try again.', 'error');
        };
        reader.readAsDataURL(blob);
        document.getElementById('idFileName').textContent = 'ID captured';
        document.getElementById('proceedFromStep2Btn').disabled = false;
      }
      
      stopCamera();
    }, 'image/jpeg', 0.95);
  }
  
  // Open modal
  requestBtn.addEventListener('click', async () => {
    modal.style.display = 'block';
    showVerificationStep(1);
    resetVerificationForm();
    
    // Get user email
    try {
      const res = await fetch('/api/user-info');
      if (res.ok) {
        const data = await res.json();
        userEmail = data.email;
        document.getElementById('userEmailDisplay').textContent = userEmail;
      }
    } catch (err) {
      console.error('Error getting user email:', err);
      userEmail = 'your registered email';
      document.getElementById('userEmailDisplay').textContent = userEmail;
    }
  });
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    stopCamera();
  });
  
  document.getElementById('closeVerificationSuccessBtn').addEventListener('click', () => {
    modal.style.display = 'none';
    stopCamera();
  });
  
  // Click outside modal to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      stopCamera();
    }
  });
  
  // Camera modal controls
  document.getElementById('captureCameraBtn').addEventListener('click', () => {
    capturePhoto();
  });
  
  document.getElementById('cancelCameraBtn').addEventListener('click', () => {
    stopCamera();
  });
  
  // ===== STEP 1: SELFIE UPLOAD =====
  document.getElementById('uploadSelfieBtn').addEventListener('click', () => {
    document.getElementById('selfiePhotoInput').click();
  });
  
  document.getElementById('takeSelfieBtn').addEventListener('click', () => {
    startCamera('selfie');
  });
  
  document.getElementById('selfiePhotoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showVerificationMessage('File size must be less than 5MB', 'error');
        return;
      }
      
      selfieFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('selfiePreviewImage').src = ev.target.result;
        document.getElementById('selfiePreviewImage').style.display = 'block';
      };
      reader.readAsDataURL(file);
      
      document.getElementById('selfieFileName').textContent = file.name;
      document.getElementById('proceedFromStep1Btn').disabled = false;
      hideVerificationMessage();
    }
  });
  
  document.getElementById('proceedFromStep1Btn').addEventListener('click', () => {
    if (!selfieFile) {
      showVerificationMessage('Please upload a selfie first', 'error');
      return;
    }
    showVerificationStep(2);
  });
  
  // ===== STEP 2: ID DOCUMENT UPLOAD =====
  document.getElementById('uploadIDBtn').addEventListener('click', () => {
    document.getElementById('idDocumentInput').click();
  });
  
  document.getElementById('takeIDBtn').addEventListener('click', () => {
    startCamera('id');
  });
  
  document.getElementById('idDocumentInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showVerificationMessage('File size must be less than 5MB', 'error');
        return;
      }
      
      idFile = file;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('idPreviewImage').src = ev.target.result;
          document.getElementById('idPreviewImage').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
      
      document.getElementById('idFileName').textContent = file.name;
      document.getElementById('proceedFromStep2Btn').disabled = false;
      hideVerificationMessage();
    }
  });
  
  document.getElementById('proceedFromStep2Btn').addEventListener('click', () => {
    if (!idFile) {
      showVerificationMessage('Please upload an ID document first', 'error');
      return;
    }
    showVerificationStep(3);
  });
  
  document.getElementById('backToStep1Btn').addEventListener('click', () => {
    showVerificationStep(1);
  });
  
  // ===== STEP 3: SEND EMAIL OTP =====
  document.getElementById('sendEmailOTPBtn').addEventListener('click', async () => {
    if (!userEmail) {
      showVerificationMessage('Email not found. Please refresh the page.', 'error');
      return;
    }
    
    const btn = document.getElementById('sendEmailOTPBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    try {
      const res = await fetch('/api/verification/send-email-otp', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send OTP');
      }
      
      const data = await res.json();
      
      showVerificationMessage('OTP sent to your email!', 'success');
      
      setTimeout(() => {
        showVerificationStep(4);
        hideVerificationMessage();
      }, 2000);
    } catch (err) {
      showVerificationMessage(err.message || 'Failed to send OTP', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Verification Code';
    }
  });
  
  document.getElementById('backToStep2Btn').addEventListener('click', () => {
    showVerificationStep(2);
  });
  
  // ===== STEP 4: VERIFY OTP & SUBMIT =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otpInput = document.getElementById('verificationOTPInput');
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
      showVerificationMessage('Please enter a valid 6-digit code', 'error');
      return;
    }
    
    if (!selfieFile || !idFile) {
      showVerificationMessage('Missing selfie or ID document', 'error');
      return;
    }
    
    const verifyBtn = document.getElementById('verifyOTPBtn');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    
    try {
      // Step 1: Verify OTP
      const verifyRes = await fetch('/api/verification/verify-email-otp', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, email: userEmail })
      });
      
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Invalid verification code');
      }
      
      showVerificationMessage('Code verified! Submitting verification...', 'success');
      
      // Step 2: Submit verification with both photos
      setTimeout(async () => {
        try {
          const formData = new FormData();
          formData.append('selfiePhoto', selfieFile);
          formData.append('idDocument', idFile);
          formData.append('email', userEmail);
          
          const submitRes = await fetch('/api/verification/submit-new-flow', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
          });
          
          if (!submitRes.ok) {
            const err = await submitRes.json();
            throw new Error(err.error || 'Failed to submit verification');
          }
          
          showVerificationStep(5);
          hideVerificationMessage();
          
          // Reload verification status after 3 seconds
          setTimeout(async () => {
            await loadVerificationStatus();
          }, 3000);
        } catch (err) {
          showVerificationMessage(err.message || 'Failed to submit verification', 'error');
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Verify & Submit';
        }
      }, 1500);
    } catch (err) {
      showVerificationMessage(err.message || 'Invalid verification code', 'error');
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify & Submit';
    }
  });
  
  document.getElementById('backToStep3Btn').addEventListener('click', () => {
    showVerificationStep(3);
  });
  
  function showVerificationStep(step) {
    document.getElementById('verificationStep1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('verificationStep2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('verificationStep3').style.display = step === 3 ? 'block' : 'none';
    document.getElementById('verificationStep4').style.display = step === 4 ? 'block' : 'none';
    document.getElementById('verificationStep5').style.display = step === 5 ? 'block' : 'none';
    
    if (step === 4) {
      document.getElementById('verificationOTPInput').focus();
    }
  }
  
  function resetVerificationForm() {
    selfieFile = null;
    idFile = null;
    document.getElementById('selfiePhotoInput').value = '';
    document.getElementById('idDocumentInput').value = '';
    document.getElementById('verificationOTPInput').value = '';
    document.getElementById('selfiePreviewImage').style.display = 'none';
    document.getElementById('idPreviewImage').style.display = 'none';
    document.getElementById('selfieFileName').textContent = 'No photo selected';
    document.getElementById('idFileName').textContent = 'No document selected';
    document.getElementById('proceedFromStep1Btn').disabled = true;
    document.getElementById('proceedFromStep2Btn').disabled = true;
    hideVerificationMessage();
  }
  
  function showVerificationMessage(msg, type) {
    const msgEl = document.getElementById('verificationMessage');
    msgEl.textContent = msg;
    msgEl.style.background = type === 'error' ? '#ffebee' : '#e8f5e9';
    msgEl.style.color = type === 'error' ? '#c62828' : '#2e7d32';
    msgEl.style.borderLeft = `4px solid ${type === 'error' ? '#f44336' : '#4CAF50'}`;
    msgEl.style.display = 'block';
  }
  
  function hideVerificationMessage() {
    document.getElementById('verificationMessage').style.display = 'none';
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

// Open success story modal for a specific listing from table
async function openSuccessStoryModalForListing(listingId, listingTitle, listingImage, inquiryId) {
  try {
    // Check if a success story exists for this listing and if it's published
    const res = await fetch(`/api/investor/success-story/${listingId}`, {
      credentials: 'same-origin'
    });

    if (res.ok) {
      const story = await res.json();
      
      // If story is published, redirect to success.html with modal open
      if (story.status === 'published') {
        window.location.href = `/components/success.html?storyId=${story.id}&viewModal=true`;
        return;
      }

      // If story already exists but is not published (pending/system_admin_approved/rejected)
      // show a message to user
      if (story && story.id) {
        showMessage(`You've already submitted a success story for this listing. Status: ${story.status}. Please wait for admin review.`, 'info');
        return;
      }
    }

    // Otherwise, open modal to create/edit success story
    const modal = document.getElementById('successStoryModal');
    const select = document.getElementById('successListingSelect');
    const form = document.getElementById('successStoryForm');
    
    // Populate the dropdown with the specific listing
    select.innerHTML = `<option value="${listingId}" selected>${listingTitle}</option>`;
    select.disabled = true;
    
    // Add visual indicator that listing is locked
    select.style.backgroundColor = '#f3f4f6';
    select.style.cursor = 'not-allowed';
    select.style.fontWeight = '500';
    
    // Display the listing image at the top of the modal
    const listingImagePreview = document.getElementById('listingImagePreview');
    if (listingImagePreview) {
      if (listingImage) {
        listingImagePreview.src = listingImage;
        listingImagePreview.style.display = 'block';
      } else {
        listingImagePreview.style.display = 'none';
      }
    }
    
    // Enable the form for submission
    form.style.pointerEvents = 'auto';
    form.style.opacity = '1';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share Success Story';
    }
    
    modal.style.display = 'block';
  } catch (err) {
    console.error('Error checking success story:', err);
    
    // Fallback: open modal to create/edit
    const modal = document.getElementById('successStoryModal');
    const select = document.getElementById('successListingSelect');
    const form = document.getElementById('successStoryForm');
    
    select.innerHTML = `<option value="${listingId}" selected>${listingTitle}</option>`;
    select.disabled = true;
    select.style.backgroundColor = '#f3f4f6';
    select.style.cursor = 'not-allowed';
    select.style.fontWeight = '500';
    
    const listingImagePreview = document.getElementById('listingImagePreview');
    if (listingImagePreview && listingImage) {
      listingImagePreview.src = listingImage;
      listingImagePreview.style.display = 'block';
    }
    
    // Enable the form for submission
    form.style.pointerEvents = 'auto';
    form.style.opacity = '1';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share Success Story';
    }
    
    modal.style.display = 'block';
  }
}

// Open success story modal and load purchased listings
async function openSuccessStoryModal() {
  const modal = document.getElementById('successStoryModal');
  const select = document.getElementById('successListingSelect');

  try {
    // Get investor's purchased listings
    const res = await fetch('/api/investor/dashboard/bought-listings', {
      credentials: 'same-origin'
    });

    if (!res.ok) {
      showMessage('Failed to load your listings', 'error');
      return;
    }

    const data = await res.json();
    
    // Populate dropdown with purchased listings
    select.innerHTML = '<option value="">Choose a listing you\'ve purchased</option>';
    select.disabled = false;
    select.style.backgroundColor = '';
    select.style.cursor = '';
    
    if (data.boughtListings && data.boughtListings.length > 0) {
      data.boughtListings.forEach(listing => {
        const option = document.createElement('option');
        option.value = listing.listing_id;
        option.textContent = listing.title;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = '<option value="">No purchases yet. Buy a listing first!</option>';
    }
  } catch (e) {
    console.error('Error loading listings:', e);
    showMessage('Failed to load listings', 'error');
  }

  modal.style.display = 'block';
}

// Close success story modal
function closeSuccessStoryModal() {
  const modal = document.getElementById('successStoryModal');
  const select = document.getElementById('successListingSelect');
  modal.style.display = 'none';
  
  // Reset form
  document.getElementById('successStoryForm').reset();
  document.getElementById('successStoryImage').style.display = 'none';
  document.getElementById('successImageMessage').textContent = '';
  document.getElementById('listingImagePreview').style.display = 'none';
  
  // Reset custom business type field
  document.getElementById('customBusinessTypeDiv').style.display = 'none';
  document.getElementById('successCustomBusinessType').value = '';
  
  // Reset category selection
  document.getElementById('categorySelectionDiv').style.display = 'none';
  document.getElementById('successCategory').value = '';
  
  // Reset select state
  select.disabled = false;
  select.style.backgroundColor = '';
  select.style.cursor = '';
  window.successImageData = null;
}

// Handle image upload for success story
async function handleSuccessImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    document.getElementById('successImageMessage').textContent = 'Image must be less than 5MB';
    document.getElementById('successImageMessage').style.color = '#ef4444';
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.getElementById('successStoryImage');
    img.src = event.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);

  // Upload file to server
  const formData = new FormData();
  formData.append('image', file);

  try {
    const msgEl = document.getElementById('successImageMessage');
    msgEl.textContent = 'Uploading image...';
    msgEl.style.color = '#3b82f6';

    const response = await fetch('/api/upload-success-story-image', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    window.successImageData = data.imageUrl; // Store URL instead of base64
    
    msgEl.textContent = 'Image uploaded successfully';
    msgEl.style.color = '#10b981';
  } catch (error) {
    document.getElementById('successImageMessage').textContent = 'Failed to upload image: ' + error.message;
    document.getElementById('successImageMessage').style.color = '#ef4444';
    window.successImageData = null;
  }
}

// Handle business type selection
function handleBusinessTypeChange(e) {
  const customBusinessTypeDiv = document.getElementById('customBusinessTypeDiv');
  const customBusinessTypeInput = document.getElementById('successCustomBusinessType');
  const categorySelectionDiv = document.getElementById('categorySelectionDiv');
  const categorySelect = document.getElementById('successCategory');
  
  if (e.target.value === 'Other') {
    customBusinessTypeDiv.style.display = 'block';
    categorySelectionDiv.style.display = 'block';
    customBusinessTypeInput.required = true;
    categorySelect.required = true;
  } else {
    customBusinessTypeDiv.style.display = 'none';
    categorySelectionDiv.style.display = 'none';
    customBusinessTypeInput.required = false;
    customBusinessTypeInput.value = '';
    categorySelect.required = false;
    categorySelect.value = '';
  }
}

// Submit success story (create or update)
async function submitSuccessStory(e) {
  e.preventDefault();

  const form = document.getElementById('successStoryForm');
  const storyId = form.getAttribute('data-story-id');
  const isEdit = !!storyId;

  const listingId = document.getElementById('successListingSelect').value;
  const businessName = document.getElementById('successBusinessName').value;
  const location = document.getElementById('successLocation').value;
  let businessType = document.getElementById('successBusinessType').value;
  let category = 'retail'; // Default category
  
  // If "Other" is selected, use the custom text and selected category
  if (businessType === 'Other') {
    businessType = document.getElementById('successCustomBusinessType').value;
    category = document.getElementById('successCategory').value;
    
    if (!businessType) {
      showMessage('Please specify a business type', 'error');
      return;
    }
    if (!category) {
      showMessage('Please select a category for your business type', 'error');
      return;
    }
  } else {
    // Auto-detect category from predefined business type
    const retailTypes = ['Retail Supermarket', 'Boutique'];
    const resortTypes = ['Restaurant', 'Café'];
    const agriTypes = ['Farm'];
    
    if (retailTypes.includes(businessType)) {
      category = 'retail';
    } else if (resortTypes.includes(businessType)) {
      category = 'resort';
    } else if (agriTypes.includes(businessType)) {
      category = 'agri';
    }
  }
  
  const description = document.getElementById('successDescription').value;
  const establishedYear = document.getElementById('successEstablishedYear').value;
  const keyAchievement = document.getElementById('successAchievement').value;
  const contactEmail = document.getElementById('successContactEmail').value;

  if (!listingId) {
    showMessage('Please select a listing', 'error');
    return;
  }

  // For create mode, require image. For edit mode, image is optional
  if (!isEdit && !window.successImageData) {
    showMessage('Please upload an image', 'error');
    return;
  }

  try {
    const msgDiv = document.getElementById('successFormMessage');
    msgDiv.style.display = 'block';
    msgDiv.className = '';
    msgDiv.textContent = isEdit ? 'Updating your success story...' : 'Uploading your success story...';

    const url = isEdit ? `/api/success-stories/${storyId}` : '/api/success-stories';
    const method = isEdit ? 'PUT' : 'POST';

    const body = {
      listingId: parseInt(listingId),
      location,
      businessName,
      description,
      businessType,
      category,
      establishedYear: establishedYear ? parseInt(establishedYear) : null,
      keyAchievement,
      contactEmail
    };

    // Only include image if it's new data (create mode or user uploaded new image)
    if (window.successImageData) {
      body.imageUrl = window.successImageData;
    }

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to ${isEdit ? 'update' : 'upload'} success story`);
    }

    msgDiv.className = 'success-message';
    msgDiv.textContent = isEdit ? 'Success story updated! 🎉' : 'Success story uploaded! 🎉';
    
    setTimeout(() => {
      closeSuccessStoryModal();
      showMessage(isEdit ? 'Your success story has been updated!' : 'Your success story has been shared!', 'success');
      // Reload success stories
      if (window.loadSuccessStories) {
        loadSuccessStories();
      }
    }, 1500);
  } catch (e) {
    console.error(`Error ${isEdit ? 'updating' : 'submitting'} success story:`, e);
    const msgDiv = document.getElementById('successFormMessage');
    msgDiv.className = 'error-message';
    msgDiv.textContent = e.message || `Failed to ${isEdit ? 'update' : 'upload'} success story`;
    msgDiv.style.display = 'block';
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
      const notifBtn = document.querySelector('#header-import #notifBtn');
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

      if (notifBtn && !notifBtn._wired) {
        notifBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (typeof openNotifications === 'function') {
            openNotifications();
          }
        });
        notifBtn._wired = true;
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
