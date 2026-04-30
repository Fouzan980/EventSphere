/**
 * Generates a stunning HTML welcome email for new EventSphere users.
 * @param {string} name - The user's display name
 * @param {string} role - The user's role (Organizer, Exhibitor, Attendee)
 * @returns {string} HTML string
 */
const welcomeEmailTemplate = (name, role) => {
  const roleEmoji = {
    Organizer: '🎯',
    Exhibitor: '🏢',
    Attendee: '🎟️',
  };
  const roleLabel = role || 'Attendee';
  const emoji = roleEmoji[roleLabel] || '🎪';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to EventSphere</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0a1e;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1e;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="
          max-width:600px;
          background: linear-gradient(145deg, #1a1035 0%, #12082b 100%);
          border-radius:20px;
          overflow:hidden;
          box-shadow: 0 25px 60px rgba(106,17,203,0.4);
          border: 1px solid rgba(139,92,246,0.25);
        ">

          <!-- Header Banner -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #6a11cb 0%, #8b5cf6 50%, #a855f7 100%);
              padding: 50px 40px 40px;
              text-align: center;
            ">
              <!-- Logo / Brand -->
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;padding:16px;margin-bottom:20px;">
                <span style="font-size:40px;line-height:1;">🎪</span>
              </div>
              <h1 style="
                margin:0 0 8px 0;
                color:#ffffff;
                font-size:32px;
                font-weight:800;
                letter-spacing:-0.5px;
              ">EventSphere</h1>
              <p style="
                margin:0;
                color:rgba(255,255,255,0.8);
                font-size:14px;
                letter-spacing:3px;
                text-transform:uppercase;
              ">Your Event Universe Awaits</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 44px 48px;">

              <!-- Greeting -->
              <h2 style="
                margin:0 0 8px 0;
                color:#e2d9f3;
                font-size:26px;
                font-weight:700;
              ">Welcome aboard, ${name}! 👋</h2>
              <p style="
                margin:0 0 28px 0;
                color:#a78bfa;
                font-size:14px;
                font-weight:600;
                text-transform:uppercase;
                letter-spacing:2px;
              ">${emoji} ${roleLabel}</p>

              <p style="
                margin:0 0 24px 0;
                color:#c4b5fd;
                font-size:16px;
                line-height:1.7;
              ">
                Your EventSphere account has been <strong style="color:#a855f7;">successfully created</strong>.
                We're thrilled to have you join our community of event enthusiasts, creators, and innovators.
              </p>

              <p style="
                margin:0 0 36px 0;
                color:#c4b5fd;
                font-size:16px;
                line-height:1.7;
              ">
                As a <strong style="color:#e9d5ff;">${roleLabel}</strong>, you now have access to everything EventSphere has to offer — from
                discovering amazing events to managing your own.
              </p>

              <!-- Role Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="
                background:rgba(139,92,246,0.1);
                border-radius:14px;
                border:1px solid rgba(139,92,246,0.3);
                margin-bottom:36px;
                overflow:hidden;
              ">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px 0;color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
                      🚀 What's waiting for you
                    </p>
                    ${roleLabel === 'Organizer' ? `
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Create and manage events</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Manage exhibitor booths &amp; floor plans</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Review attendee applications</p>
                      <p style="margin:0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Access analytics &amp; insights</p>
                    ` : roleLabel === 'Exhibitor' ? `
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Browse and join events</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Reserve exhibition booths</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Showcase your brand</p>
                      <p style="margin:0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Connect with attendees</p>
                    ` : `
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Discover upcoming events</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Register &amp; book tickets</p>
                      <p style="margin:0 0 10px 0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Bookmark favourite events</p>
                      <p style="margin:0;color:#d8b4fe;font-size:15px;">✅ &nbsp;Build your event schedule</p>
                    `}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173/login" style="
                      display:inline-block;
                      background: linear-gradient(135deg, #7c3aed, #a855f7);
                      color:#ffffff;
                      font-size:16px;
                      font-weight:700;
                      text-decoration:none;
                      padding:16px 44px;
                      border-radius:12px;
                      letter-spacing:0.5px;
                      box-shadow: 0 8px 24px rgba(168,85,247,0.4);
                    ">
                      Go to Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <hr style="border:none;border-top:1px solid rgba(139,92,246,0.2);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 48px 36px;text-align:center;">
              <p style="margin:0 0 8px 0;color:#7c3aed;font-size:13px;font-weight:600;">EventSphere Platform</p>
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                This email was sent because you registered at EventSphere.<br/>
                If you didn't sign up, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

module.exports = welcomeEmailTemplate;
