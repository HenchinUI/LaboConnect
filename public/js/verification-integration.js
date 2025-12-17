/**
 * Verification Integration for Listing Form
 * Checks user verification status before allowing listing submission
 */

// Check verification status on page load
async function checkVerificationStatus() {
  try {
    const response = await fetch('/api/verification/status');
    const status = await response.json();
    
    if (status.status === 'not_started' || status.status === 'unverified') {
      // User not verified - show verification requirement
      showVerificationRequirement();
    } else if (status.status === 'rejected') {
      // User verification rejected
      showVerificationRejected(status.rejection_reason);
    } else if (status.status === 'approved') {
      // User is verified - enable listing form
      enableListingForm();
    } else {
      // Verification pending or in progress
      showVerificationPending(status.status);
    }
  } catch (err) {
    console.error('Error checking verification status:', err);
  }
}

function showVerificationRequirement() {
  const submitForm = document.getElementById('submitFormWrap');
  if (!submitForm) return;
  
  submitForm.innerHTML = `
    <div class="verification-requirement-card" style="padding: 30px; text-align: center; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin-bottom: 15px;">Identity Verification Required</h3>
      <p style="color: #856404; margin-bottom: 20px; line-height: 1.5;">
        To protect our community and ensure trustworthy listings, we require all users to verify their identity before submitting properties.
      </p>
      <button type="button" onclick="openVerificationModal()" class="btn" style="background: #ffc107; color: #333; padding: 12px 30px; font-weight: bold;">
        Verify Your Identity Now
      </button>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">
        This typically takes 5 minutes and requires a photo ID.
      </p>
    </div>
  `;
}

function showVerificationPending(status) {
  const submitForm = document.getElementById('submitFormWrap');
  if (!submitForm) return;
  
  const statusMessages = {
    'pending': 'Your verification has been created. Please complete the process.',
    'otp_sent': 'OTP code has been sent. Please verify your phone number.',
    'otp_verified': 'Your phone has been verified. Please upload your ID document.',
    'document_verified': 'Your documents have been received. Our team will review within 24-48 hours.'
  };
  
  submitForm.innerHTML = `
    <div class="verification-pending-card" style="padding: 30px; text-align: center; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
      <h3 style="color: #155724; margin-bottom: 15px;">Verification in Progress</h3>
      <p style="color: #155724; margin-bottom: 20px; line-height: 1.5;">
        ${statusMessages[status] || 'Your verification is being processed.'}
      </p>
      <button type="button" onclick="openVerificationModal()" class="btn" style="background: #28a745; color: white; padding: 12px 30px; font-weight: bold;">
        Continue Verification
      </button>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">
        You'll be able to submit listings once verification is complete.
      </p>
    </div>
  `;
}

function showVerificationRejected(reason) {
  const submitForm = document.getElementById('submitFormWrap');
  if (!submitForm) return;
  
  submitForm.innerHTML = `
    <div class="verification-rejected-card" style="padding: 30px; text-align: center; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">
      <h3 style="color: #721c24; margin-bottom: 15px;">Verification Could Not Be Completed</h3>
      <p style="color: #721c24; margin-bottom: 15px; line-height: 1.5;">
        <strong>Reason:</strong> ${reason || 'Your verification was not approved. Please contact support for more information.'}
      </p>
      <button type="button" onclick="openVerificationModal()" class="btn" style="background: #dc3545; color: white; padding: 12px 30px; font-weight: bold;">
        Try Again
      </button>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">
        Contact our support team if you believe this is an error.
      </p>
    </div>
  `;
}

function enableListingForm() {
  // Form is already enabled - just ensure the submit section is visible
  const submitSection = document.getElementById('submitListing');
  if (submitSection) {
    submitSection.style.display = 'block';
    const submitFormWrap = document.getElementById('submitFormWrap');
    if (submitFormWrap) {
      submitFormWrap.classList.add('visible');
    }
  }
}

// Intercept listing form submission to check verification
async function checkVerificationBeforeSubmit(event) {
  event.preventDefault();
  
  try {
    const response = await fetch('/api/verification/status');
    const status = await response.json();
    
    if (!status.status || status.status === 'not_started' || status.status === 'unverified' || status.status === 'rejected') {
      alert('Please complete your identity verification before submitting a listing.');
      openVerificationModal();
      return false;
    }
    
    if (status.status !== 'approved') {
      alert('Your verification is still being processed. Please wait for approval before submitting listings.');
      return false;
    }
    
    // User is verified - proceed with form submission
    submitListingForm(event);
  } catch (err) {
    console.error('Error checking verification:', err);
    alert('Error verifying your account. Please try again.');
  }
}

// Original listing form submission function (to be called after verification check)
async function submitListingForm(event) {
  event.preventDefault();
  
  try {
    const form = document.getElementById('listingForm');
    const formData = new FormData(form);
    
    // Get user ID from session
    const sessionResponse = await fetch('/api/session');
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.authenticated) {
      alert('Please log in first');
      return;
    }
    
    formData.append('user_id', sessionData.user.id);
    
    const response = await fetch('/api/listings', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Listing submitted successfully! Our team will review it shortly.');
      form.reset();
      // Submit for approval workflow
      if (data.id) {
        await fetch(`/api/listings/${data.id}/submit-for-approval`, { method: 'POST' });
      }
    } else {
      alert(data.error || 'Error submitting listing');
    }
  } catch (err) {
    console.error('Error submitting listing:', err);
    alert('Error submitting listing. Please try again.');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated and verified
  fetch('/api/session')
    .then(res => res.json())
    .then(data => {
      if (data.authenticated) {
        checkVerificationStatus();
        
        // Update form submission handler
        const listingForm = document.getElementById('listingForm');
        if (listingForm) {
          listingForm.addEventListener('submit', checkVerificationBeforeSubmit);
        }
      } else {
        // User not authenticated - hide listing form
        const submitSection = document.getElementById('submitListing');
        if (submitSection) {
          submitSection.style.display = 'none';
        }
      }
    })
    .catch(err => console.error('Error checking session:', err));
});
