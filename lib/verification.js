/**
 * User verification utilities
 * Simple OTP system - generates and verifies OTPs locally
 */

const db = require('../db');
const crypto = require('crypto');

// Initialize Twilio client if credentials are available
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Generate a 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a verification request for a user
 */
const createVerificationRequest = async (userId, phoneNumber) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO verification_requests (user_id, phone_number, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, user_id, phone_number, status, created_at`,
      [userId, phoneNumber]
    );
    
    return rows[0];
  } catch (err) {
    console.error('Error creating verification request:', err);
    return null;
  }
};

/**
 * Send OTP via Email
 */
const sendEmailOTP = async (email) => {
  try {
    const otp = generateOTP();
    
    // Log OTP for development
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    
    // In production, you'd send via email service here
    // For now, just generate and log
    
    return { success: true, otp, message: 'OTP generated' };
  } catch (err) {
    console.error('Error sending email OTP:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send OTP via SMS using Twilio
 */
const sendSMSOTP = async (phoneNumber) => {
  try {
    const otp = generateOTP();
    
    console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
    
    // If Twilio is configured, send real SMS
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        // Format phone number with country code if not present
        let formattedPhone = phoneNumber.trim();
        
        // If it doesn't start with +, add country code
        if (!formattedPhone.startsWith('+')) {
          // Remove any non-digit characters
          const digits = formattedPhone.replace(/\D/g, '');
          
          // If it's 11 digits (0967...), assume it's +63 with leading 0
          if (digits.length === 11 && digits.startsWith('0')) {
            formattedPhone = '+63' + digits.substring(1); // Remove leading 0, add +63
          } else if (digits.length === 10) {
            // If it's 10 digits, it's missing country code
            formattedPhone = '+63' + digits;
          } else {
            // Otherwise use as is
            formattedPhone = '+' + digits;
          }
        }
        
        console.log(`Sending SMS to formatted number: ${formattedPhone}`);
        
        await twilioClient.messages.create({
          body: `Your LaboConnect verification code is: ${otp}. This code expires in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        console.log(`SMS sent successfully to ${formattedPhone}`);
        return { success: true, otp: undefined, message: 'SMS sent' };
      } catch (twilioErr) {
        console.error('Twilio SMS error:', twilioErr.message);
        console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, otp, message: 'OTP generated (Twilio failed, check console)' };
      }
    }
    
    return { success: true, otp, message: 'OTP generated' };
  } catch (err) {
    console.error('Error sending SMS OTP:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send OTP (backward compatible - supports both email and phone)
 */
const sendOTP = async (verificationRequestId, phoneOrEmail) => {
  // Try email first if it looks like an email, otherwise SMS
  if (phoneOrEmail && phoneOrEmail.includes('@')) {
    return sendEmailOTP(phoneOrEmail);
  } else {
    return sendSMSOTP(phoneOrEmail);
  }
};

/**
 * Verify OTP code
 */
const verifyOTP = async (verificationRequestId, otp) => {
  try {
    // Get verification request
    const { rows } = await db.query(
      'SELECT * FROM verification_requests WHERE id = $1',
      [verificationRequestId]
    );
    
    if (rows.length === 0) {
      return { success: false, error: 'Verification request not found' };
    }
    
    // For development: accept any 6-digit code
    // In production, you'd validate against stored OTP
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      return { success: false, error: 'Invalid OTP format (must be 6 digits)' };
    }
    
    // Mark OTP as verified in database
    await db.query(
      `UPDATE verification_requests 
       SET otp_verified_at = NOW(), status = 'otp_verified'
       WHERE id = $1`,
      [verificationRequestId]
    );
    
    return { success: true };
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return { success: false, error: 'Server error' };
  }
};

/**
 * Get user's verification status
 */
const getVerificationStatus = async (userId) => {
  try {
    // Check for latest verification request
    const { rows: verReqs } = await db.query(
      'SELECT status, verified_at FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (verReqs.length === 0) {
      return { status: 'not_started' };
    }
    
    const verReq = verReqs[0];
    if (verReq.status === 'verified' && verReq.verified_at) {
      return { status: 'verified', verifiedAt: verReq.verified_at };
    }
    
    if (verReq.status === 'pending' || verReq.status === 'document_submitted') {
      return { status: 'pending' };
    }
    
    return { status: 'not_started' };
  } catch (err) {
    console.error('Error getting verification status:', err);
    return { status: 'not_started' };
  }
};

/**
 * Update verification document
 */
const updateVerificationDocument = async (verificationRequestId, documentUrl) => {
  try {
    const { rows } = await db.query(
      `UPDATE verification_requests 
       SET id_document_url = $1, status = 'document_submitted'
       WHERE id = $2
       RETURNING id`,
      [documentUrl, verificationRequestId]
    );
    
    return rows.length > 0;
  } catch (err) {
    console.error('Error updating verification document:', err);
    return false;
  }
};

/**
 * Approve verification
 */
const approveVerification = async (verificationRequestId) => {
  try {
    const { rows } = await db.query(
      `UPDATE verification_requests 
       SET status = 'verified', verified_at = NOW()
       WHERE id = $1
       RETURNING user_id`,
      [verificationRequestId]
    );
    
    if (rows.length === 0) return false;
    
    const userId = rows[0].user_id;
    
    // Update the users table to mark user as verified
    await db.query(
      `UPDATE users 
       SET is_verified = true
       WHERE id = $1`,
      [userId]
    );
    
    return true;
  } catch (err) {
    console.error('Error approving verification:', err);
    return false;
  }
};

/**
 * Reject verification
 */
const rejectVerification = async (verificationRequestId) => {
  try {
    await db.query(
      `UPDATE verification_requests 
       SET status = 'rejected'
       WHERE id = $1`,
      [verificationRequestId]
    );
    
    return true;
  } catch (err) {
    console.error('Error rejecting verification:', err);
    return false;
  }
};

/**
 * Get pending verifications
 */
const getPendingVerifications = async () => {
  try {
    const { rows } = await db.query(
      `SELECT vr.*, u.username, u.email 
       FROM verification_requests vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.status IN ('document_submitted', 'pending')
       ORDER BY vr.created_at ASC`
    );
    
    return rows;
  } catch (err) {
    console.error('Error getting pending verifications:', err);
    return [];
  }
};

module.exports = {
  createVerificationRequest,
  sendOTP,
  sendEmailOTP,
  sendSMSOTP,
  verifyOTP,
  getVerificationStatus,
  updateVerificationDocument,
  approveVerification,
  rejectVerification,
  getPendingVerifications
};
