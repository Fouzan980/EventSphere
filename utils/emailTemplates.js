/**
 * EventSphere — Centralised Email Templates
 * All templates share the same deep-purple brand shell.
 * Usage: import { welcomeEmail, ticketConfirmEmail, ... } from './emailTemplates';
 */

// ─── Shared Brand Shell ───────────────────────────────────────────────────────
const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EventSphere</title>
</head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="
        max-width:600px;
        background:linear-gradient(145deg,#1a1035 0%,#12082b 100%);
        border-radius:20px;overflow:hidden;
        box-shadow:0 25px 60px rgba(106,17,203,0.4);
        border:1px solid rgba(139,92,246,0.25);
      ">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6a11cb 0%,#8b5cf6 50%,#a855f7 100%);padding:40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;padding:14px;margin-bottom:16px;">
              <span style="font-size:36px;line-height:1;">🎪</span>
            </div>
            <h1 style="margin:0 0 6px;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">EventSphere</h1>
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:3px;text-transform:uppercase;">Your Event Universe</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px 48px;">${bodyContent}</td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid rgba(139,92,246,0.2);margin:0;"/></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px 32px;text-align:center;">
            <p style="margin:0 0 6px;color:#7c3aed;font-size:13px;font-weight:600;">EventSphere Platform</p>
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
              This is an automated notification — please do not reply to this email.<br/>
              If you didn't expect this, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

// ─── Reusable inner pieces ────────────────────────────────────────────────────
const ctaBtn = (href, label) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
    <tr><td align="center">
      <a href="${href}" style="
        display:inline-block;
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        color:#fff;font-size:15px;font-weight:700;
        text-decoration:none;padding:14px 40px;border-radius:12px;
        letter-spacing:0.5px;box-shadow:0 8px 24px rgba(168,85,247,0.4);
      ">${label} &rarr;</a>
    </td></tr>
  </table>`;

const infoBox = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="
    background:rgba(139,92,246,0.1);border-radius:14px;
    border:1px solid rgba(139,92,246,0.3);margin:24px 0;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      ${rows.map(([k, v]) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td style="width:140px;color:#a78bfa;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${k}</td>
            <td style="color:#e2d9f3;font-size:14px;font-weight:500;">${v}</td>
          </tr>
        </table>`).join('')}
    </td></tr>
  </table>`;

const badge = (label, color = '#7c3aed') =>
  `<span style="display:inline-block;background:${color}22;color:${color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;border:1px solid ${color}44;">${label}</span>`;

// ─── 1. Welcome Email ─────────────────────────────────────────────────────────
const roleFeatures = {
  Organizer: ['Create & manage events', 'Manage exhibitor booths & floor plans', 'Review attendee applications', 'Access analytics & insights'],
  Exhibitor:  ['Browse and join events', 'Reserve exhibition booths', 'Showcase your brand', 'Connect with attendees'],
  Attendee:   ['Discover upcoming events', 'Register & book tickets', 'Bookmark favourite events', 'Build your schedule'],
};
const roleEmoji = { Organizer: '🎯', Exhibitor: '🏢', Attendee: '🎟️' };

const welcomeEmail = (name, role = 'Attendee') => shell(`
  <h2 style="margin:0 0 6px;color:#e2d9f3;font-size:24px;font-weight:700;">Welcome aboard, ${name}! 👋</h2>
  <p style="margin:0 0 24px;color:#a78bfa;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">
    ${roleEmoji[role] || '🎪'} ${role}
  </p>
  <p style="margin:0 0 20px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Your EventSphere account has been <strong style="color:#a855f7;">successfully created</strong>. We're thrilled to have you join our event universe!
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.1);border-radius:14px;border:1px solid rgba(139,92,246,0.3);margin-bottom:8px;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 14px;color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">🚀 What's waiting for you</p>
      ${(roleFeatures[role] || roleFeatures.Attendee).map(f => `<p style="margin:0 0 8px;color:#d8b4fe;font-size:14px;">✅ &nbsp;${f}</p>`).join('')}
    </td></tr>
  </table>
  ${ctaBtn('http://localhost:5173/login', 'Go to Dashboard')}
`);

// ─── 2. Ticket / Event Booking Confirmation ───────────────────────────────────
const ticketConfirmEmail = (name, event) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Booking Confirmed! 🎉</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, your ticket for <strong style="color:#a855f7;">${event.title}</strong> is confirmed. See you there!
  </p>
  ${infoBox([
    ['📅 Date',     new Date(event.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
    ['🕐 Time',     event.time || 'TBA'],
    ['📍 Location', event.location || 'TBA'],
    ['🏷️ Category', event.category || 'General'],
    ['💰 Price',    event.price === 0 ? 'Free' : `$${event.price}`],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">Keep this email as your booking reference. Check the dashboard for your full schedule.</p>
  ${ctaBtn('http://localhost:5173/dashboard', 'View My Schedule')}
`);

// ─── 3. Application Submitted (Exhibitor) ─────────────────────────────────────
const applicationSubmittedEmail = (name, eventTitle, companyName) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Application Submitted 📋</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, your exhibitor application for
    <strong style="color:#a855f7;">${eventTitle}</strong> has been received.
  </p>
  ${infoBox([
    ['🏢 Company',   companyName || 'N/A'],
    ['📋 Status',    'Pending Review'],
    ['⏱️ Next Step', 'The organizer will review your application and notify you.'],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    You'll receive another email once the organizer has made a decision. In the meantime, you can track your application status in your dashboard.
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/applications', 'Track Application')}
`);

// ─── 4. Application Approved (Exhibitor) ─────────────────────────────────────
const applicationApprovedEmail = (name, eventTitle, boothInfo) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Application Approved! 🎊</h2>
  <p style="margin:0 0 6px;color:#10b981;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">✅ Approved</p>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Congratulations <strong style="color:#e9d5ff;">${name}</strong>! Your application to exhibit at
    <strong style="color:#a855f7;">${eventTitle}</strong> has been <strong style="color:#10b981;">approved</strong>.
  </p>
  ${infoBox([
    ['🎪 Event',     eventTitle],
    ['🗂️ Booth',     boothInfo || 'To be assigned — check your floor plan'],
    ['✅ Status',    'Approved'],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    Head to your dashboard to view your assigned booth and floor plan details.
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/floor-plan', 'View Floor Plan')}
`);

// ─── 5. Application Rejected (Exhibitor) ─────────────────────────────────────
const applicationRejectedEmail = (name, eventTitle) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Application Update</h2>
  <p style="margin:0 0 6px;color:#ef4444;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">❌ Not Selected</p>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, thank you for your interest in exhibiting at
    <strong style="color:#a855f7;">${eventTitle}</strong>. Unfortunately, your application was not selected at this time.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.08);border-radius:14px;border:1px solid rgba(239,68,68,0.25);margin:0 0 24px;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0;color:#fca5a5;font-size:14px;line-height:1.7;">
        Don't be discouraged — there are many more events on EventSphere. Browse other upcoming events and apply for future opportunities.
      </p>
    </td></tr>
  </table>
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    We appreciate your time and hope to see you at future EventSphere events!
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/events', 'Browse Other Events')}
`);

// ─── 6. Event Created (Organizer confirmation) ───────────────────────────────
const eventCreatedEmail = (name, event) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Event Published! 🚀</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, your event <strong style="color:#a855f7;">${event.title}</strong> has been successfully created and is now live.
  </p>
  ${infoBox([
    ['🎪 Event',     event.title],
    ['📅 Date',     new Date(event.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
    ['📍 Location', event.location || 'TBA'],
    ['🏷️ Category', event.category || 'General'],
    ['💰 Price',    event.price === 0 ? 'Free' : `$${event.price}`],
    ['👥 Capacity', event.capacity || 'Unlimited'],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    Attendees and exhibitors can now discover and register for your event. Manage everything from your organizer dashboard.
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/events', 'Manage Events')}
`);

// ─── 7. Profile Updated ───────────────────────────────────────────────────────
const profileUpdatedEmail = (name) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Profile Updated ✏️</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, your EventSphere profile has been <strong style="color:#a855f7;">successfully updated</strong>.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.1);border-radius:14px;border:1px solid rgba(139,92,246,0.3);margin-bottom:24px;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0;color:#d8b4fe;font-size:14px;line-height:1.7;">
        If you did not make this change, please <strong style="color:#f87171;">secure your account immediately</strong> by changing your password.
      </p>
    </td></tr>
  </table>
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    Your profile information is used across the platform and may be visible to other users based on your role.
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/profile', 'View Profile')}
`);

// ─── 8. Password Changed ─────────────────────────────────────────────────────
const passwordChangedEmail = (name) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Password Changed 🔐</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, your EventSphere account password was just changed.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.08);border-radius:14px;border:1px solid rgba(239,68,68,0.25);margin-bottom:24px;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 6px;color:#fca5a5;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⚠️ Security Notice</p>
      <p style="margin:0;color:#fca5a5;font-size:14px;line-height:1.7;">
        If this wasn't you, your account may be compromised. Contact support immediately and change your password right away.
      </p>
    </td></tr>
  </table>
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    If this was you, no action is needed. Your new password is now active.
  </p>
  ${ctaBtn('http://localhost:5173/login', 'Sign In')}
`);

// ─── 8.1 Password Reset Request ──────────────────────────────────────────────
const passwordResetEmail = (name, resetUrl) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Password Reset Request 🔐</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, we received a request to reset your EventSphere account password.
  </p>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Click the button below to securely set a new password. This link will expire in 15 minutes.
  </p>
  ${ctaBtn(resetUrl, 'Reset Password')}
  <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.7;">
    If you did not request this, please ignore this email. Your account remains completely secure.
  </p>
`);

// ─── 9. New Exhibitor Application (Organizer notification) ───────────────────
const newApplicationNotifyEmail = (organizerName, exhibitorName, companyName, eventTitle) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">New Application Received 📬</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${organizerName}</strong>, a new exhibitor application has been submitted for your event.
  </p>
  ${infoBox([
    ['🎪 Event',     eventTitle],
    ['👤 Exhibitor', exhibitorName],
    ['🏢 Company',   companyName || 'N/A'],
    ['📋 Status',    'Awaiting Review'],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
    Review the application and approve or reject from your organizer dashboard.
  </p>
  ${ctaBtn('http://localhost:5173/dashboard/applications', 'Review Application')}
`);

// ─── 10. Contact / Subscribe Email ──────────────────────────────────────────────
const contactEmail = (name, message) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Welcome, ${name}! 🎉</h2>
  <p style="margin:0 0 16px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Thank you for reaching out via our Contact page.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.1);border-radius:14px;border:1px solid rgba(139,92,246,0.3);margin-bottom:16px;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 6px;color:#d8b4fe;font-size:16px;font-weight:700;">You have successfully subscribed to the newsletter!</p>
      <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">
        New event added news will come directly to you.
      </p>
    </td></tr>
  </table>
  ${message ? `<p style="font-size: 14px; color: #a78bfa; font-style: italic; margin-bottom: 24px;">We also received your message: "${message}"</p>` : ''}
  ${ctaBtn(process.env.FRONTEND_URL || 'http://localhost:5173', 'Explore Upcoming Events')}
`);

// ─── 11. Event Reminder Email ──────────────────────────────────────────────
const eventReminderEmail = (name, event) => shell(`
  <h2 style="margin:0 0 8px;color:#e2d9f3;font-size:24px;font-weight:700;">Event Reminder: 6 Hours Left! ⏳</h2>
  <p style="margin:0 0 24px;color:#c4b5fd;font-size:15px;line-height:1.7;">
    Hi <strong style="color:#e9d5ff;">${name}</strong>, just a quick reminder that <strong style="color:#a855f7;">${event.title}</strong> is starting today in 6 hours!
  </p>
  ${infoBox([
    ['📅 Date',     new Date(event.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
    ['🕐 Time',     event.time || 'TBA'],
    ['📍 Location', event.location || 'TBA'],
  ])}
  <p style="margin:0;color:#c4b5fd;font-size:14px;line-height:1.7;">Get ready for an amazing experience. See you soon!</p>
  ${ctaBtn(process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/dashboard/orders' : 'http://localhost:5173/dashboard/orders', 'View Ticket Details')}
`);

module.exports = {
  welcomeEmail,
  ticketConfirmEmail,
  applicationSubmittedEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  eventCreatedEmail,
  profileUpdatedEmail,
  passwordChangedEmail,
  passwordResetEmail,
  newApplicationNotifyEmail,
  contactEmail,
  eventReminderEmail,
};
