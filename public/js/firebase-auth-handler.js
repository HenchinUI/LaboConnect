// Firebase Phone Authentication Handler for LaboConnect
import { auth } from './firebase-config.js';
import { signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let verificationId = null;

/**
 * Initialize reCAPTCHA verifier (called once on modal open)
 */
function initRecaptchaVerifier() {
  try {
    // Check if already initialized
    if (window.recaptchaVerifier) {
      return;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (token) => {
        console.log('reCAPTCHA callback:', token);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  } catch (err) {
    console.error('Error initializing reCAPTCHA:', err);
  }
}

/**
 * Send OTP via Firebase
 */
async function firebaseSendOTP(phoneNumber) {
  try {
    // Initialize reCAPTCHA if not already done
    if (!window.recaptchaVerifier) {
      initRecaptchaVerifier();
    }

    const appVerifier = window.recaptchaVerifier;

    // Format phone number if needed
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      const digits = formattedPhone.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('0')) {
        formattedPhone = '+63' + digits.substring(1); // Philippine number
      } else if (digits.length === 10) {
        formattedPhone = '+63' + digits;
      } else {
        formattedPhone = '+' + digits;
      }
    }

    console.log(`Sending OTP to: ${formattedPhone}`);

    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    
    // Store verification ID for later use
    verificationId = confirmationResult.verificationId;
    
    console.log('OTP sent successfully via Firebase');
    return { success: true, message: 'OTP sent to your phone' };
  } catch (err) {
    console.error('Firebase OTP error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Verify OTP code
 */
async function firebaseVerifyOTP(otpCode) {
  try {
    if (!verificationId) {
      throw new Error('No verification ID found. Please send OTP first.');
    }

    const credential = window.firebase.auth.PhoneAuthProvider.credential(verificationId, otpCode);
    const result = await auth.signInWithCredential(credential);
    
    console.log('OTP verified successfully');
    console.log('Firebase User ID:', result.user.uid);
    
    return { 
      success: true, 
      message: 'OTP verified successfully',
      firebaseUid: result.user.uid,
      phoneNumber: result.user.phoneNumber
    };
  } catch (err) {
    console.error('Firebase OTP verification error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Sign out user
 */
async function firebaseSignOut() {
  try {
    await auth.signOut();
    verificationId = null;
    return true;
  } catch (err) {
    console.error('Error signing out:', err);
    return false;
  }
}

export { 
  initRecaptchaVerifier, 
  firebaseSendOTP, 
  firebaseVerifyOTP, 
  getCurrentUser,
  firebaseSignOut
};
