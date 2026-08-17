const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Configured via standard SMTP env parameters
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Default fallback service using service option (e.g. Gmail)
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const getWelcomeHtmlTemplate = ({ studentName, email, admissionNumber, tempPassword }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EduSphere</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; text-align: left;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6D28D9 0%, #2563EB 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">EduSphere</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; color: #e0e7ff;">AI-Powered Educational ERP Platform</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Welcome to EduSphere, ${studentName}!</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your student portal account has been successfully created. You now have full access to your adaptive learning pathways, class schedules, and academic intelligence.
              </p>
              
              <!-- Credentials Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td colspan="2" style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6D28D9;">
                    Student Login Credentials
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 40%;">Student Name</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Admission Number</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 800; color: #6D28D9; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${admissionNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Login Email / Username</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b;">Temporary Password</td>
                  <td style="padding: 12px 18px; font-size: 16px; font-weight: 800; color: #059669; font-family: monospace;">${tempPassword}</td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px;">
                <strong>🔒 First Login Security Notice:</strong> For account security, you will be required to update your temporary password upon logging into the platform for the first time.
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173/login" style="background: linear-gradient(135deg, #6D28D9 0%, #2563EB 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px;">Launch EduSphere Portal &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; 2026 EduSphere AI-Powered Educational ERP Platform. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendStudentRegistrationEmail = async ({
  studentName,
  email,
  admissionNumber,
  tempPassword,
}) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "Nodemailer Warning: EMAIL_USER or EMAIL_PASS not configured in .env file."
      );
      return { success: false, message: "SMTP credentials missing in .env" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"EduSphere Administration" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to EduSphere - Your Student Account Credentials",
      text: `Dear ${studentName},

Your EduSphere account has been created successfully.

Login Credentials:
Admission Number: ${admissionNumber}
Email: ${email}
Temporary Password: ${tempPassword}

Login URL: http://localhost:5173/login

For security, you must change your password after your first login.

Regards,
EduSphere Administration`,
      html: getWelcomeHtmlTemplate({ studentName, email, admissionNumber, tempPassword }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send welcome email:", error.message);
    return { success: false, error: error.message };
  }
};

const getForgotPasswordHtmlTemplate = ({ userName, email, tempPassword }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - EduSphere</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #2563EB 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
    .logo-text { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; margin-top: 4px; }
    .content { padding: 35px 30px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6D28D9; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .field { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .field-label { color: #64748b; font-weight: 500; }
    .field-value { font-weight: 700; color: #10B981; font-family: monospace; font-size: 15px; }
    .btn-container { text-align: center; margin-top: 24px; margin-bottom: 24px; }
    .btn { background: linear-gradient(135deg, #6D28D9 0%, #2563EB 100%); color: #ffffff !important; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25); }
    .notice { background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; }
    .footer { background-color: #0f172a; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Edu<span style="color: #60A5FA;">Sphere</span></div>
      <div class="logo-subtitle">Password Recovery Request</div>
    </div>
    
    <div class="content">
      <div class="greeting">Hello, ${userName}!</div>
      <div class="text">
        We received a request to reset your password for your EduSphere account. A new temporary password has been generated for you below.
      </div>
      
      <div class="card">
        <div class="card-title">Temporary Login Password</div>
        <div class="field" style="margin-bottom: 0;">
          <span class="field-label">Temporary Password:</span>
          <span class="field-value">${tempPassword}</span>
        </div>
      </div>
      
      <div class="notice">
        <strong>First Login Security Notice:</strong> For security reasons, you will be required to change this temporary password immediately after logging in.
      </div>

      <div class="btn-container">
        <a href="http://localhost:5173/login" class="btn">Log In & Update Password &rarr;</a>
      </div>
    </div>

    <div class="footer">
      &copy; 2026 EduSphere AI ERP Platform. If you did not request a password reset, please contact support immediately.
    </div>
  </div>
</body>
</html>
  `;
};

const sendForgotPasswordEmail = async ({ userName, email, tempPassword }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "Nodemailer Warning: EMAIL_USER or EMAIL_PASS not configured in .env file."
      );
      return { success: false, message: "SMTP credentials missing in .env" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"EduSphere Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "EduSphere - Your Password Reset Request",
      text: `Hello ${userName},

Your password reset request has been processed.

Temporary Password: ${tempPassword}
Login URL: http://localhost:5173/login

Please log in and update your password immediately.

Regards,
EduSphere Security`,
      html: getForgotPasswordHtmlTemplate({ userName, email, tempPassword }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
    return { success: false, error: error.message };
  }
};

const getStaffWelcomeHtmlTemplate = ({ name, email, role, tempPassword }) => {
  const roleBadgeColor = role === "Admin" || role === "Administrator" ? "#6D28D9" : "#059669";
  const roleTitle = role === "Admin" || role === "Administrator" ? "Administrator Account" : "Faculty / Teacher Account";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EduSphere - Staff Access</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; text-align: left;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4338CA 0%, #6D28D9 50%, #2563EB 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">EduSphere</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; color: #e0e7ff;">Staff & Administrative Portal</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Welcome to EduSphere, ${name}!</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                An official account has been provisioned for you on the EduSphere AI ERP Platform with the role of <strong>${roleTitle}</strong>.
              </p>
              
              <!-- Credentials Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td colspan="2" style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${roleBadgeColor};">
                    ${roleTitle} Credentials
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 40%;">Full Name</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Assigned Role</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 800; color: ${roleBadgeColor}; border-bottom: 1px solid #f1f5f9;">${role}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Login Email / Username</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b;">Temporary Password</td>
                  <td style="padding: 12px 18px; font-size: 16px; font-weight: 800; color: #059669; font-family: monospace;">${tempPassword}</td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px;">
                <strong>🔒 Mandatory First-Login Password Change:</strong> For administrative security, you will be required to update your temporary password upon logging in.
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173/login" style="background: linear-gradient(135deg, #4338CA 0%, #2563EB 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px;">Log In to Staff Portal &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; 2026 EduSphere AI-Powered Educational ERP Platform. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendStaffRegistrationEmail = async ({ name, email, role, tempPassword }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "Nodemailer Warning: EMAIL_USER or EMAIL_PASS not configured in .env file."
      );
      return { success: false, message: "SMTP credentials missing in .env" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"EduSphere Administration" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to EduSphere - Your ${role} Account Credentials`,
      text: `Dear ${name},

Your EduSphere ${role} account has been created successfully.

Login Credentials:
Role: ${role}
Email: ${email}
Temporary Password: ${tempPassword}

Login URL: http://localhost:5173/login

For security reasons, you must change your temporary password upon your first login.

Regards,
EduSphere Administration`,
      html: getStaffWelcomeHtmlTemplate({ name, email, role, tempPassword }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Staff welcome email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send staff welcome email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendPaymentRequestEmail = async ({ applicantName, email, applicationId, admissionNumber, tempPassword }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Nodemailer Warning: EMAIL_USER or EMAIL_PASS not configured in .env file.");
      return { success: false, message: "SMTP credentials missing in .env" };
    }

    const transporter = createTransporter();

    const paymentLink = `http://localhost:5173/apply/payment?appId=${applicationId}`;
    const loginLink = `http://localhost:5173/login`;

    const mailOptions = {
      from: `"EduSphere Admissions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to EduSphere - Admission Approved, Credentials & Fee Payment Link",
      text: `Dear ${applicantName},

Great news! Your EduSphere admission application (${applicationId}) has been verified and approved ELIGIBLE by our Administration.

Your Student Login Credentials:
Admission Number: ${admissionNumber}
Login Email: ${email}
Temporary Password: ${tempPassword}

Registration Fee Payment Link:
${paymentLink}

Login Portal:
${loginLink}

Security Notice:
Upon logging in with your temporary password for the first time, you will be prompted to set your original permanent password.

Regards,
EduSphere Admissions Office`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px 0; color: #0f172a; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; text-align: left;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6D28D9 0%, #2563EB 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff;">EduSphere</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; color: #e0e7ff;">Admission Eligibility & Credentials Issued</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Congratulations, ${applicantName}!</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your admission application (<strong>${applicationId}</strong>) has been reviewed by the Administrator and verified as <strong>ELIGIBLE</strong>. Your student account credentials and registration fee payment link have been issued below.
              </p>

              <!-- Credentials Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td colspan="2" style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6D28D9;">
                    Student Login Credentials
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 40%;">Admission Number</td>
                  <td style="padding: 12px 18px; font-size: 15px; font-weight: 800; color: #6D28D9; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${admissionNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Login Email / Username</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b;">Temporary Password</td>
                  <td style="padding: 12px 18px; font-size: 16px; font-weight: 800; color: #059669; font-family: monospace;">${tempPassword}</td>
                </tr>
              </table>

              <!-- Registration Fee Payment Button -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #166534;">💳 Step 1: Complete ₹500 Registration Fee Payment</p>
                <a href="${paymentLink}" style="background: linear-gradient(135deg, #16a34a 0%, #2563EB 100%); color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Pay Registration Fee (₹500) &rarr;</a>
              </div>

              <!-- First Login Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px;">
                <strong>🔒 First Login & Password Setup:</strong> You can log into the portal using your Admission Number and Temporary Password. Upon your first login, the platform will prompt you to set your original permanent password.
              </div>

              <!-- Login Portal Link Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" style="background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 13px;">Go to Student Login Portal &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; 2026 EduSphere Admissions Office. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Eligibility & Credentials email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send eligibility email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendStudentRegistrationEmail,
  sendForgotPasswordEmail,
  sendStaffRegistrationEmail,
  sendPaymentRequestEmail,
};

