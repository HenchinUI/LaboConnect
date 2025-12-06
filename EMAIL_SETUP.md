# Email Notification Setup Guide

## Overview
The email notification system is built into the backend (`server.js`). It currently logs to the console and the database (`email_logs` table). To activate real email sending, you need to integrate an email service.

## How It Works (Currently)

1. **When an inquiry is submitted:**
   - Server checks if listing owner has opted in (`notification_preferences.email_new_inquiry = true`)
   - Calls `sendInquiryNotificationEmail(inquiry, listing, owner_id)` asynchronously
   - Logs email intent to `email_logs` table with status `'logged'`
   - Logs to console: `[EMAIL] To: owner@email.com, Subject: New Inquiry: Property Title`

2. **Email flow:**
   - Owner creates listing → listing linked to their user account (owner_id)
   - Investor sends inquiry → inquiry stored with owner_id and emailed to owner
   - Owner checks notification bell (polls `/api/inquiries/count?owner_id=X`)
   - Owner clicks bell → navigates to `/components/inquiries.html`
   - Owner marks inquiry as read → notification badge updates

## To Enable Real Emails

### Option 1: SendGrid (Recommended for Production)

**Install SendGrid package:**
```bash
npm install @sendgrid/mail
```

**Update `server.js` - replace the `sendInquiryNotificationEmail` function:**

```javascript
const sgMail = require('@sendgrid/mail');

// Initialize at app startup (after imports)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function sendInquiryNotificationEmail(inquiry, listing, owner_id) {
  setImmediate(async () => {
    try {
      if (!SENDGRID_API_KEY) {
        console.warn('[EMAIL] SendGrid API key not configured. Skipping email send.');
        return;
      }

      // Get owner's email from users table
      const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [owner_id]);
      if (!users.length) return console.log('Owner email not found');
      const ownerEmail = users[0].email;

      const msg = {
        to: ownerEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@laboconnect.ph',
        subject: `New Inquiry: ${listing.title}`,
        html: `
          <h2>New Inquiry for Your Listing</h2>
          <p><strong>Listing:</strong> ${listing.title}</p>
          <p><strong>From:</strong> ${inquiry.first_name} ${inquiry.last_name}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Contact:</strong> ${inquiry.contact_number}</p>
          ${inquiry.company ? `<p><strong>Company:</strong> ${inquiry.company}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${inquiry.message || '(no message)'}</p>
          <hr>
          <p><a href="http://laboconnect.ph/components/inquiries.html">View Inquiry in Dashboard</a></p>
        `
      };

      await sgMail.send(msg);

      // Log success
      await db.query(
        'INSERT INTO email_logs (user_id, inquiry_id, email_address, subject, status, sent_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [owner_id, inquiry.id, ownerEmail, msg.subject, 'sent']
      );

      console.log(`[EMAIL] Sent to ${ownerEmail}`);
    } catch (e) {
      console.error('Email notification error:', e);
      // Log failure
      try {
        const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [owner_id]);
        if (users.length) {
          await db.query(
            'INSERT INTO email_logs (user_id, inquiry_id, email_address, subject, status) VALUES ($1, $2, $3, $4, $5)',
            [owner_id, inquiry.id, users[0].email, `New Inquiry: ${listing.title}`, 'failed']
          );
        }
      } catch (logErr) {
        console.error('Failed to log email error:', logErr);
      }
    }
  });
}
```

**Set environment variables (.env or system):**
```
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@laboconnect.ph
```

### Option 2: Nodemailer (For Gmail or Custom SMTP)

**Install Nodemailer:**
```bash
npm install nodemailer
```

**Update `server.js` - replace the function:**

```javascript
const nodemailer = require('nodemailer');

// Initialize transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD  // app password (not regular password)
  }
});

function sendInquiryNotificationEmail(inquiry, listing, owner_id) {
  setImmediate(async () => {
    try {
      // Get owner's email from users table
      const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [owner_id]);
      if (!users.length) return console.log('Owner email not found');
      const ownerEmail = users[0].email;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: ownerEmail,
        subject: `New Inquiry: ${listing.title}`,
        html: `
          <h2>New Inquiry for Your Listing</h2>
          <p><strong>Listing:</strong> ${listing.title}</p>
          <p><strong>From:</strong> ${inquiry.first_name} ${inquiry.last_name}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Contact:</strong> ${inquiry.contact_number}</p>
          ${inquiry.company ? `<p><strong>Company:</strong> ${inquiry.company}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${inquiry.message || '(no message)'}</p>
        `
      };

      await transporter.sendMail(mailOptions);

      // Log success
      await db.query(
        'INSERT INTO email_logs (user_id, inquiry_id, email_address, subject, status, sent_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [owner_id, inquiry.id, ownerEmail, mailOptions.subject, 'sent']
      );

      console.log(`[EMAIL] Sent to ${ownerEmail}`);
    } catch (e) {
      console.error('Email notification error:', e);
    }
  });
}
```

**Environment variables (.env):**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### Option 3: AWS SES (For Production Scale)

**Install AWS SDK:**
```bash
npm install aws-sdk
```

**Update `server.js`:**

```javascript
const AWS = require('aws-sdk');

const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'ap-southeast-1'
});

function sendInquiryNotificationEmail(inquiry, listing, owner_id) {
  setImmediate(async () => {
    try {
      const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [owner_id]);
      if (!users.length) return console.log('Owner email not found');
      const ownerEmail = users[0].email;

      const params = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@laboconnect.ph',
        Destination: { ToAddresses: [ownerEmail] },
        Message: {
          Subject: { Data: `New Inquiry: ${listing.title}` },
          Body: {
            Html: {
              Data: `
                <h2>New Inquiry for Your Listing</h2>
                <p><strong>Listing:</strong> ${listing.title}</p>
                <p><strong>From:</strong> ${inquiry.first_name} ${inquiry.last_name}</p>
                <p><strong>Email:</strong> ${inquiry.email}</p>
                <p><strong>Contact:</strong> ${inquiry.contact_number}</p>
              `
            }
          }
        }
      };

      await ses.sendEmail(params).promise();

      await db.query(
        'INSERT INTO email_logs (user_id, inquiry_id, email_address, subject, status, sent_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [owner_id, inquiry.id, ownerEmail, `New Inquiry: ${listing.title}`, 'sent']
      );

      console.log(`[EMAIL] Sent to ${ownerEmail}`);
    } catch (e) {
      console.error('Email notification error:', e);
    }
  });
}
```

## Testing Emails Locally

1. **Use Mailtrap** (free service for testing):
   - Create free account at https://mailtrap.io
   - Get SMTP credentials
   - Use Nodemailer with those credentials
   - Emails won't actually send but you'll see them in Mailtrap inbox

2. **Check database logs:**
   ```sql
   SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
   ```

3. **Check server console:**
   ```
   [EMAIL] To: owner@email.com, Subject: New Inquiry: Commercial Lot
   [EMAIL] From: John Doe <john@investor.com>
   ```

## Notification Preferences API

Users can opt-out of email notifications:

**GET user preferences:**
```bash
GET /api/user/:user_id/notification-prefs
```

**Update preferences:**
```bash
POST /api/user/:user_id/notification-prefs
Content-Type: application/json

{
  "email_new_inquiry": false,
  "email_digest": true
}
```

## Email Logs

Check email delivery status:

```sql
-- All sent emails
SELECT * FROM email_logs WHERE status = 'sent' ORDER BY created_at DESC;

-- Failed emails
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;

-- Summary by user
SELECT user_id, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM email_logs
GROUP BY user_id;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check `SENDGRID_API_KEY` or SMTP credentials in `.env` |
| Wrong sender | Update `SENDGRID_FROM_EMAIL` or `EMAIL_USER` env var |
| Bounced emails | Verify owner email in users table is correct |
| Authentication failed | Check API key has proper scopes/permissions |
| Rate limiting | Use SendGrid/SES queue instead of sending immediately |

## Next Steps

1. Install your chosen email service package
2. Add API keys to `.env`
3. Update the `sendInquiryNotificationEmail` function in `server.js`
4. Test with a real inquiry
5. Check `email_logs` table for delivery status
