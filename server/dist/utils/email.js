"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationStatusEmail = exports.sendApplicationSubmissionEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("./logger"));
// Get email configuration from environment
const getEmailConfig = () => ({
    host: process.env.SMTP_HOST || '172.24.46.52',
    port: parseInt(process.env.SMTP_PORT || '25', 10),
    from: process.env.SMTP_FROM || 'AP_SDM_SKD APPS STORE <noreply@ap.denso.com>',
});
// Create transporter
const createTransporter = () => {
    const config = getEmailConfig();
    return nodemailer_1.default.createTransport({
        host: config.host,
        port: config.port,
        secure: false, // Port 25 is not secure
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
        },
        connectionTimeout: 10000, // 10 seconds
        socketTimeout: 10000,
    });
};
// Send email
const sendEmail = async (options) => {
    try {
        const config = getEmailConfig();
        const transporter = createTransporter();
        const mailOptions = {
            from: config.from,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        };
        const info = await transporter.sendMail(mailOptions);
        logger_1.default.info('Email sent successfully', {
            messageId: info.messageId,
            to: options.to,
            subject: options.subject,
        });
        return true;
    }
    catch (error) {
        logger_1.default.error('Failed to send email', {
            error: error instanceof Error ? error.message : 'Unknown error',
            to: options.to,
            subject: options.subject,
        });
        return false;
    }
};
exports.sendEmail = sendEmail;
// Send application submission notification
const sendApplicationSubmissionEmail = async (data) => {
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'thammaphon.chittasuwanna.a3q@ap.denso.com';
    const baseUrl = process.env.VITE_API_URL?.replace('/api', '') || 'http://10.73.148.75:3006';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #374151; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 0 auto; padding: 24px; }
        .title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0; }
        .info { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 13px; color: #6b7280; }
        .info-value { font-size: 14px; color: #111827; margin-top: 2px; }
        .btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
        .btn:hover { background: #1d4ed8; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">New Application Submitted</h1>
        
        <div class="info">
          <div class="info-row">
            <div class="info-label">Application</div>
            <div class="info-value">${data.appName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Category</div>
            <div class="info-value">${data.category}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Submitted by</div>
            <div class="info-value">${data.submittedBy}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Submitted at</div>
            <div class="info-value">${data.submittedAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })}</div>
          </div>
        </div>

        <p style="margin: 20px 0;">
          <a href="${baseUrl}/admin/applications" class="btn">Review Application</a>
        </p>

        <p class="footer">SDM&SKD Apps Store • DENSO Innovation Hub</p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: notificationEmail,
        subject: `[Apps Store] New: ${data.appName}`,
        html,
    });
};
exports.sendApplicationSubmissionEmail = sendApplicationSubmissionEmail;
// Send application status update notification
const sendApplicationStatusEmail = async (data) => {
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'thammaphon.chittasuwanna.a3q@ap.denso.com';
    const statusColor = data.status === 'approved' ? '#16a34a' : '#dc2626';
    const statusBg = data.status === 'approved' ? '#dcfce7' : '#fee2e2';
    const statusText = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #374151; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 0 auto; padding: 24px; }
        .title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0; }
        .info { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 13px; color: #6b7280; }
        .info-value { font-size: 14px; color: #111827; margin-top: 2px; }
        .status { display: inline-block; padding: 4px 12px; background: ${statusBg}; color: ${statusColor}; border-radius: 4px; font-weight: 600; font-size: 13px; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Application ${statusText}</h1>
        
        <div class="info">
          <div class="info-row">
            <div class="info-label">Application</div>
            <div class="info-value">${data.appName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Status</div>
            <div class="info-value"><span class="status">${statusText}</span></div>
          </div>
          <div class="info-row">
            <div class="info-label">Reviewed by</div>
            <div class="info-value">${data.reviewedBy}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Reviewed at</div>
            <div class="info-value">${data.reviewedAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })}</div>
          </div>
          ${data.reason
        ? `
          <div class="info-row">
            <div class="info-label">Reason</div>
            <div class="info-value">${data.reason}</div>
          </div>
          `
        : ''}
        </div>

        <p class="footer">SDM&SKD Apps Store • DENSO Innovation Hub</p>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: notificationEmail,
        subject: `[Apps Store] ${statusText}: ${data.appName}`,
        html,
    });
};
exports.sendApplicationStatusEmail = sendApplicationStatusEmail;
exports.default = {
    sendEmail: exports.sendEmail,
    sendApplicationSubmissionEmail: exports.sendApplicationSubmissionEmail,
    sendApplicationStatusEmail: exports.sendApplicationStatusEmail,
};
