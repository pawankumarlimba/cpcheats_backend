import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { Newsletter } from '../models/newsletter.model.js';
import { emailService } from './email.service.js';
import { config } from '../config/env.js';

export class UserService {
  private userRepository = new UserRepository();

  private async generateUsername(name: string): Promise<string> {
    const baseUsername = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let username = baseUsername;
    let counter = 1;

    while (await this.userRepository.findByUsername(username)) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    return username;
  }

  async signup(name: string, email: string, password: string): Promise<any> {
    if (!name || !email || !password) {
      throw new Error('Name, Email and Password are required');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already registered');
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const username = await this.generateUsername(name);

    const newUser = await this.userRepository.create({
      username,
      name,
      email,
      password: hashedPassword,
    });

    // Handle Newsletter subscription automatically
    const existingNewsletter = await Newsletter.findOne({ email });
    if (!existingNewsletter) {
      await Newsletter.create({ email });
    }

    // Send Welcome Email
    const subject = 'Welcome to Cp Cheats Newsletter – Your Gateway to CP Mastery! 🚀';
    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
        <p>Hi there, ${name}</p>
        <p>Thank you for subscribing to the <strong>Cp Cheats Newsletter! 🎉</strong> We’re thrilled to have you on board.</p>
        <ul>
          <li><strong>✅ Copy-paste functions</strong> to save time in contests and coding challenges ⏳</li>
          <li><strong>✅ Real interview experiences</strong> from top candidates to help you prepare smarter 💼</li>
        </ul>
        <p>Stay tuned for our upcoming editions! Happy Coding! 🚀</p>
        <p><strong>Best Regards,</strong><br><strong>Pawan Kumar</strong><br>Founder, Cp Cheats</p>
      </body>
      </html>
    `;

    try {
      await emailService.sendEmail({
        useremail: email,
        subject,
        text: 'Welcome to Cp Cheats Newsletter',
        html
      });
    } catch (err) {
      console.error('Failed to send welcome email upon registration:', err);
    }

    return newUser;
  }

  async login(email: string, password: string, deviceInfo?: string): Promise<any> {
    if (!email || !password) {
      throw new Error('Email and Password are required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not registered');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password || '');
    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }

    // Generate JWT token
    const tokenData = { id: user._id, email: user.email };
    const token = jwt.sign(tokenData, config.jwtSecret, {
      expiresIn: '10d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10); // 10 days from now

    // Clean up expired tokens
    const now = new Date();
    user.accessToken = user.accessToken.filter(
      (t: any) => new Date(t.expiresAt) > now
    );

    // Add new token
    user.accessToken.push({
      token,
      deviceInfo,
      createdAt: new Date(),
      expiresAt,
    });

    await user.save();

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      accessToken: token,
    };
  }

  async sendOtp(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userRepository.setOtp(email, otp);

    // Send OTP email
    await emailService.sendEmail({
      useremail: email,
      subject: 'CP Cheats - OTP Verification Code',
      text: `Your OTP is: ${otp}`,
      html: `<p>Your verification code is: <strong>${otp}</strong>. It will expire shortly.</p>`
    });
  }

  async verifyOtp(email: string, otpCode: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.otp || !user.otp.otp) return false;

    // Check if OTP matches and is less than 15 minutes old
    const fifteenMinutes = 15 * 60 * 1000;
    const isOtpValid = user.otp.otp === otpCode;
    const isNotExpired = new Date().getTime() - new Date(user.otp.otpCreatedAt || 0).getTime() < fifteenMinutes;

    if (isOtpValid && isNotExpired) {
      // Clear OTP
      user.otp = {};
      await user.save();
      return true;
    }

    return false;
  }

  async findUserByToken(token: string): Promise<any> {
    const user = await this.userRepository.findOne({
      'accessToken.token': token,
      'accessToken.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid token or session expired');
    }

    return user;
  }

  async changePassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);
    await user.save();
  }

  async changeName(email: string, name: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    user.name = name;
    await user.save();
  }

  async changeEmail(currentEmail: string, newEmail: string): Promise<void> {
    const user = await this.userRepository.findByEmail(currentEmail);
    if (!user) throw new Error('User not found');

    const exists = await this.userRepository.findByEmail(newEmail);
    if (exists) throw new Error('New email is already in use');

    user.email = newEmail;
    await user.save();
  }
}

export const userService = new UserService();
