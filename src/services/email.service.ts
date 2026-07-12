import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: config.emailUser,
          pass: config.emailPass,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(options: { useremail: string; subject: string; text: string; html: string }): Promise<any> {
    const { useremail, subject, text, html } = options;

    if (!config.emailUser || !config.emailPass) {
      console.log('----------------- MAIL LOG (SMTP credentials missing) -----------------');
      console.log(`To: ${useremail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('---------------------------------------------------------------------');
      return { messageId: 'mock-id-local-testing' };
    }

    try {
      const transporter = this.getTransporter();
      const mailOption = {
        from: `Cp Cheats <${config.emailUser}>`,
        to: useremail,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOption);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
