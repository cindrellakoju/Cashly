/**
 * Cashly Email Micro-Service for aaPanel PM2
 * Dispatches PIN recovery emails and onboarding OTPs via Gmail SMTP
 */

const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from local .env
dotenv.config({ path: path.join(__dirname, '.env') });

const nodemailer = require('nodemailer');

const PORT = process.env.EMAIL_SERVER_PORT || process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    const sender = process.env.GMAIL_USER || process.env.SYSTEM_EMAIL || 'Not configured';
    const hasPassword = Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SYSTEM_APP_PASSWORD);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'Cashly Email Dispatcher',
        sender,
        hasAppPasswordConfigured: hasPassword,
      })
    );
    return;
  }

  // POST /send-pin
  if (req.method === 'POST' && req.url === '/send-pin') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { target, newPin, recipientEmail } = payload;

        if (!recipientEmail || !newPin) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'MISSING_PARAMS', message: 'recipientEmail and newPin are required.' }));
          return;
        }

        const senderEmail = (
          process.env.GMAIL_USER ||
          process.env.SYSTEM_EMAIL ||
          'cindrellakoju@gmail.com'
        ).trim();

        const appPassword = (
          process.env.GMAIL_APP_PASSWORD ||
          process.env.SYSTEM_APP_PASSWORD ||
          ''
        ).replace(/\s+/g, '');

        if (!appPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'MISSING_APP_PASSWORD', message: 'GMAIL_APP_PASSWORD is not set in .env' }));
          return;
        }

        const pinLabel = target === 'admin' ? 'Admin Access PIN' : 'Account Vault PIN';
        const targetEmoji = target === 'admin' ? '👑' : '🏦';

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: senderEmail, pass: appPassword },
        });

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #eaeaea; padding: 26px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 38px; margin-bottom: 6px;">${targetEmoji}</div>
              <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 800;">Cashly</h2>
              <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Security PIN Reset Dispatch</p>
            </div>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 18px; margin-bottom: 18px; border: 1px solid #f3f4f6;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px;">Hello,</p>
              <p style="margin: 0 0 14px; color: #374151; font-size: 13px; line-height: 19px;">
                A request was received to reset your <strong>${pinLabel}</strong>:
              </p>
              <div style="text-align: center; padding: 16px; background-color: #ffffff; border-radius: 10px; border: 2px dashed #10b981; margin: 12px 0;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #059669; text-transform: uppercase; margin-bottom: 4px;">NEW ${pinLabel.toUpperCase()}</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #111827;">${newPin}</div>
              </div>
              <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                🔒 If you did not request this reset, please update your credentials inside the app immediately.
              </p>
            </div>
            <div style="border-top: 1px solid #f3f4f6; padding-top: 14px; text-align: center; color: #9ca3af; font-size: 11px;">
              Cashly Personal Finance • Automated Security Service
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Cashly Security" <${senderEmail}>`,
          to: recipientEmail,
          subject: `Your New ${pinLabel} is ${newPin} - Cashly`,
          text: `Cashly - ${pinLabel} Reset\n\nYour new 4-digit ${pinLabel} is: ${newPin}\n\n- Cashly Security`,
          html: htmlContent,
        });

        console.log(`[Email Dispatcher] Dispatched new PIN to ${recipientEmail}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'PIN email dispatched successfully via Gmail SMTP!', recipient: recipientEmail }));
      } catch (err) {
        console.error('[Email Dispatcher Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'SMTP_DISPATCH_FAILED', message: err?.message || 'Failed to dispatch email' }));
      }
    });
    return;
  }

  // POST /send-verification
  if (req.method === 'POST' && req.url === '/send-verification') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { recipientEmail, otp } = payload;

        if (!recipientEmail || !otp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'MISSING_PARAMS', message: 'recipientEmail and otp are required.' }));
          return;
        }

        const senderEmail = (
          process.env.GMAIL_USER ||
          process.env.SYSTEM_EMAIL ||
          'cindrellakoju@gmail.com'
        ).trim();

        const appPassword = (
          process.env.GMAIL_APP_PASSWORD ||
          process.env.SYSTEM_APP_PASSWORD ||
          ''
        ).replace(/\s+/g, '');

        if (!appPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'MISSING_APP_PASSWORD', message: 'GMAIL_APP_PASSWORD is not set in .env' }));
          return;
        }

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: senderEmail, pass: appPassword },
        });

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #eaeaea; padding: 26px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 38px; margin-bottom: 6px;">✉️</div>
              <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 800;">Cashly</h2>
              <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Email Verification Code</p>
            </div>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 18px; margin-bottom: 18px; border: 1px solid #f3f4f6;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px;">Hello,</p>
              <p style="margin: 0 0 14px; color: #374151; font-size: 13px; line-height: 19px;">
                Use the verification code below to confirm your email address for Cashly. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="text-align: center; padding: 16px; background-color: #ffffff; border-radius: 10px; border: 2px dashed #10b981; margin: 12px 0;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #059669; text-transform: uppercase; margin-bottom: 8px;">VERIFICATION CODE</div>
                <div style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #111827;">${otp}</div>
              </div>
              <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                🔒 If you did not request this, please ignore this email.
              </p>
            </div>
            <div style="border-top: 1px solid #f3f4f6; padding-top: 14px; text-align: center; color: #9ca3af; font-size: 11px;">
              Cashly Personal Finance • Email Verification Service
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Cashly" <${senderEmail}>`,
          to: recipientEmail,
          subject: `${otp} is your Cashly verification code`,
          text: `Your Cashly email verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
          html: htmlContent,
        });

        console.log(`[Email Dispatcher] Sent OTP ${otp} to ${recipientEmail}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Verification email dispatched!' }));
      } catch (err) {
        console.error('[Verification Email Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'SMTP_DISPATCH_FAILED', message: err?.message || 'Failed to dispatch email' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cashly Email Server listening on http://0.0.0.0:${PORT}`);
});
