import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@/auth';

// Create transporter for email sending
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || '';
  const emailPassword = process.env.EMAIL_PASSWORD || '';

  // Support multiple email services
  if (emailUser.includes('@gmail.com')) {
    // Gmail SMTP configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword, // Use Gmail App Password, not regular password
      },
    });
  } else {
    // Generic SMTP configuration for other providers
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientEmail, reportHTML, reportSubject } = await request.json();

    // Validate inputs
    if (!recipientEmail || !reportHTML) {
      return NextResponse.json(
        { error: 'Missing recipientEmail or reportHTML' },
        { status: 400 }
      );
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { 
          error: 'Email service not configured',
          message: 'Set EMAIL_USER and EMAIL_PASSWORD in .env file',
          details: 'For Gmail: Use account@gmail.com and App Password (not regular password). Get it from: https://myaccount.google.com/apppasswords',
          configured: false 
        },
        { status: 500 }
      );
    }

    const transporter = createTransporter();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: reportSubject || 'Laporan Penjualan Otomatis - Analistik UMKM',
      html: reportHTML,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully', email: recipientEmail },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to send email';
    let errorDetails = '';

    if (error instanceof Error) {
      if (error.message.includes('Invalid login') || error.message.includes('Bad credentials')) {
        errorMessage = 'Email authentication failed';
        errorDetails = 'Invalid EMAIL_USER or EMAIL_PASSWORD. For Gmail, use App Password from https://myaccount.google.com/apppasswords';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('EHOSTUNREACH')) {
        errorMessage = 'SMTP server connection failed';
        errorDetails = 'Cannot connect to email server. Check SMTP settings.';
      } else {
        errorDetails = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
