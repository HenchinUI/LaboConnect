/**
 * Email Service using SendGrid
 * Handles sending verification emails to users
 */

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@laboconnect.com';
const SENDGRID_REPLY_EMAIL = process.env.SENDGRID_REPLY_EMAIL || 'support@laboconnect.com';

/**
 * Generate a random verification code
 * @returns {string} 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification email with OTP code
 * @param {string} email - Recipient email address
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<void>}
 */
async function sendVerificationEmail(email, verificationCode, userName = 'User') {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .warning { background: #fffbf0; border-left: 4px solid #ff9800; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LaboConnect Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Thank you for registering with LaboConnect! To complete your email verification, please use the verification code below:</p>
              
              <div class="code-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code:</p>
                <div class="code">${verificationCode}</div>
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This verification code will expire in <strong>30 minutes</strong>. If you didn't request this code, please ignore this email.
              </div>
              
              <p>If you're having trouble, you can copy and paste the code above into the verification field on our website.</p>
              
              <p>Best regards,<br>The LaboConnect Team</p>
              
              <div class="footer">
                <p>LaboConnect © 2025 | Municipality of Labo, Camarines Norte</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      replyTo: SENDGRID_REPLY_EMAIL,
      subject: 'LaboConnect Email Verification - ' + verificationCode,
      html: htmlContent,
      text: `Your LaboConnect verification code is: ${verificationCode}\n\nThis code will expire in 30 minutes. If you didn't request this, please ignore this email.`
    };

    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @param {string} userType - 'investor', 'business', or 'admin'
 * @returns {Promise<void>}
 */
async function sendWelcomeEmail(email, userName, userType = 'user') {
  try {
    const welcomeMessages = {
      investor: 'Explore investment opportunities in Labo and grow your business with us.',
      business: 'Start listing your business and connect with investors in Labo.',
      admin: 'You now have access to the LaboConnect admin panel.'
    };

    const message = welcomeMessages[userType] || welcomeMessages.investor;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LaboConnect!</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>🎉 Your email has been verified successfully!</p>
              <p>${message}</p>
              
              <a href="https://laboconnect.com/components/index.html" class="button">Get Started</a>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br>The LaboConnect Team</p>
              
              <div class="footer">
                <p>LaboConnect © 2025 | Municipality of Labo, Camarines Norte</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      replyTo: SENDGRID_REPLY_EMAIL,
      subject: 'Welcome to LaboConnect!',
      html: htmlContent,
      text: `Welcome to LaboConnect, ${userName}! Your email has been verified successfully.`
    };

    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail
};
