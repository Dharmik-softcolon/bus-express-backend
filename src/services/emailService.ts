import nodemailer from 'nodemailer';
import config from '../config/config.js';
import { logError, logInfo } from '../utils/logger.js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.HOST || 'smtp.gmail.com',
      port: parseInt(config.email.PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.USER,
        pass: config.email.PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: config.email.FROM_EMAIL || config.email.USER,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logInfo('Email sent successfully', { messageId: result.messageId, to: options.to });
      return true;
    } catch (error) {
      logError('Failed to send email', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to Bus Express';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Bus Express!</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for registering with Bus Express. We're excited to have you on board!</p>
        <p>You can now:</p>
        <ul>
          <li>Search and book bus tickets</li>
          <li>Manage your bookings</li>
          <li>Track your journey</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Bus Express Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendBookingConfirmation(
    userEmail: string,
    userName: string,
    bookingDetails: any
  ): Promise<boolean> {
    const subject = `Booking Confirmation - ${bookingDetails.bookingReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmed!</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
          <p><strong>Bus:</strong> ${bookingDetails.bus.busName} (${bookingDetails.bus.busNumber})</p>
          <p><strong>Route:</strong> ${bookingDetails.route.from.city} to ${bookingDetails.route.to.city}</p>
          <p><strong>Journey Date:</strong> ${new Date(bookingDetails.journeyDate).toLocaleDateString()}</p>
          <p><strong>Seats:</strong> ${bookingDetails.seats.map((seat: any) => seat.seatNumber).join(', ')}</p>
          <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
          <p><strong>Boarding Point:</strong> ${bookingDetails.boardingPoint}</p>
          <p><strong>Dropping Point:</strong> ${bookingDetails.droppingPoint}</p>
        </div>
        
        <p>Please arrive at the boarding point 15 minutes before departure time.</p>
        <p>If you need to cancel or modify your booking, please contact our support team.</p>
        <p>Have a safe journey!</p>
        <p>Best regards,<br>Bus Express Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendBookingCancellation(
    userEmail: string,
    userName: string,
    bookingDetails: any,
    refundAmount: number
  ): Promise<boolean> {
    const subject = `Booking Cancelled - ${bookingDetails.bookingReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Cancelled</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has been cancelled. Here are the details:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Cancellation Details</h3>
          <p><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
          <p><strong>Original Amount:</strong> ₹${bookingDetails.totalAmount}</p>
          <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
          <p><strong>Cancellation Reason:</strong> ${bookingDetails.cancellationReason || 'Not specified'}</p>
        </div>
        
        <p>The refund will be processed within 3-5 business days to your original payment method.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>We hope to serve you again soon!</p>
        <p>Best regards,<br>Bus Express Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const subject = 'Password Reset Request';
    const resetUrl = `${config.app.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password for your Bus Express account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Bus Express Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendEmailVerification(userEmail: string, verificationToken: string): Promise<boolean> {
    const subject = 'Verify Your Email Address';
    const verificationUrl = `${config.app.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering with Bus Express!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>Bus Express Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
