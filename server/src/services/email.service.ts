import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

/**
 * Send an email using the configured SMTP server.
 * Falls back to logging in development if credentials are missing.
 */
export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        logger.info("── SIMULATED EMAIL ──");
        logger.info(`To:      ${to}`);
        logger.info(`Subject: ${subject}`);
        logger.info(`Body:    ${text}`);
        if (html) logger.debug(`HTML:    Available`);
        logger.info("─────────────────────");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: env.EMAIL_FROM,
            to,
            subject,
            text,
            html,
        });
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error("Failed to send email:", error);
        throw error;
    }
}

/**
 * Send a welcome email to a new campus admin.
 */
export async function sendCampusAdminInvitation({
    adminName,
    adminEmail,
    campusName,
    temporaryPassword,
}: {
    adminName: string;
    adminEmail: string;
    campusName: string;
    temporaryPassword: string;
}) {
    const loginUrl = `${env.CLIENT_URL}/login`;

    const subject = `Welcome to Nallas TalentSecure — ${campusName}`;
    const text = `
    Hi ${adminName},

    Welcome to Nallas TalentSecure! You have been appointed as the Campus Admin for ${campusName}.

    Your login credentials:
    Email: ${adminEmail}
    Temporary Password: ${temporaryPassword}

    Please log in here to complete your setup: ${loginUrl}

    For security reasons, you will be required to change your password upon your first login.

    Best regards,
    The Nallas Team
  `.trim();

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Welcome to Nallas TalentSecure</h2>
      <p>Hi <strong>${adminName}</strong>,</p>
      <p>You have been appointed as the Campus Admin for <strong>${campusName}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Your login credentials:</p>
        <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${adminEmail}</p>
        <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${temporaryPassword}</code></p>
      </div>

      <p>Please log in to complete your institution's profile and start managing your students.</p>
      
      <a href="${loginUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">
        Access Campus Portal
      </a>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
        Note: You will be required to change your password upon your first login.
      </p>
    </div>
  `;

    return sendEmail({ to: adminEmail, subject, text, html });
}
