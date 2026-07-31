const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
// User must set EMAIL_USER and EMAIL_PASS in .env
// For Gmail: use App Password (not regular password)
// Go to: Google Account > Security > 2-Step Verification > App Passwords
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email verification link
const sendVerificationEmail = async (to, token) => {
  const transporter = createTransporter();
  const verifyUrl = `http://localhost:5173/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"TradeGuard AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: '✅ Verify Your TradeGuard AI Account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ TradeGuard AI</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Shipment Risk Intelligence</p>
        </div>
        <div style="padding: 32px; color: #e2e8f0;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Verify Your Email</h2>
          <p>Thank you for signing up! Click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't create an account, you can safely ignore this email.</p>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours.</p>
        </div>
        <div style="background: #1e293b; padding: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 TradeGuard AI. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (to, token) => {
  const transporter = createTransporter();
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"TradeGuard AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔑 Reset Your TradeGuard AI Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ TradeGuard AI</h1>
        </div>
        <div style="padding: 32px; color: #e2e8f0;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour.</p>
        </div>
        <div style="background: #1e293b; padding: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 TradeGuard AI. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    return false;
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (to, username) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"TradeGuard AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 Welcome to TradeGuard AI, ${username}!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome Aboard!</h1>
        </div>
        <div style="padding: 32px; color: #e2e8f0;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Hello, ${username}!</h2>
          <p>Your TradeGuard AI account is now active. Here's what you can do:</p>
          <ul style="color: #cbd5e1; line-height: 2;">
            <li>🧠 <strong>AI Risk Predictions</strong> — Analyze shipment delay probability</li>
            <li>🌍 <strong>Live Weather Detection</strong> — Real-time weather API integration</li>
            <li>📊 <strong>Dashboard Analytics</strong> — Visual charts and risk metrics</li>
            <li>📋 <strong>Shipment History</strong> — Track all past predictions</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:5173/dashboard" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
        <div style="background: #1e293b; padding: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 TradeGuard AI. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Welcome email failed:', error.message);
    return false;
  }
};

// Send high-risk shipment alert
const sendRiskAlertEmail = async (to, shipmentData) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"TradeGuard AI Alert" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🚨 HIGH RISK ALERT: ${shipmentData.origin} → ${shipmentData.destination}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 High Risk Alert</h1>
        </div>
        <div style="padding: 32px; color: #e2e8f0;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Shipment Flagged as High Risk</h2>
          <table style="width: 100%; color: #cbd5e1; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;"><strong>Route</strong></td><td style="padding: 8px; border-bottom: 1px solid #1e293b;">${shipmentData.origin} → ${shipmentData.destination}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;"><strong>Risk Score</strong></td><td style="padding: 8px; border-bottom: 1px solid #1e293b; color: #ef4444; font-weight: bold;">${shipmentData.riskScore}/100</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;"><strong>Prediction</strong></td><td style="padding: 8px; border-bottom: 1px solid #1e293b; color: #ef4444;">${shipmentData.prediction}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;"><strong>Predicted Delay</strong></td><td style="padding: 8px; border-bottom: 1px solid #1e293b;">${shipmentData.predictedDelay} days</td></tr>
            <tr><td style="padding: 8px;"><strong>Weight</strong></td><td style="padding: 8px;">${shipmentData.weight} kg</td></tr>
          </table>
          <div style="background: #1e293b; border-radius: 12px; padding: 16px; margin-top: 24px;">
            <p style="color: #f59e0b; margin: 0; font-weight: bold;">⚠️ Recommended Actions:</p>
            <ul style="color: #94a3b8; margin: 8px 0 0;">
              <li>Consider alternative routes or carriers</li>
              <li>Notify receiving party of potential delay</li>
              <li>Monitor weather conditions along the route</li>
            </ul>
          </div>
        </div>
        <div style="background: #1e293b; padding: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 TradeGuard AI. Automated Alert System.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Risk alert email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Risk alert email failed:', error.message);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendRiskAlertEmail
};
