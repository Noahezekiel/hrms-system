import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

let transporter: Transporter | null = null;

export const getEmailTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP configuration incomplete. Email sending will be disabled.');
    // Create a dummy transporter that logs instead of sending
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      logger.error('SMTP connection error:', error);
    } else {
      logger.info('SMTP connection verified successfully');
    }
  });

  return transporter;
};

export const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}) => {
  try {
    const transporter = getEmailTransporter();
    const from = options.from || process.env.SMTP_FROM || 'noreply@hrms.com';

    const mailOptions = {
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Email sending failed');
  }
};

export default { getEmailTransporter, sendEmail };