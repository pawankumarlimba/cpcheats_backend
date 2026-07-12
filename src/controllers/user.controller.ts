import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/user.service.js';
import { Admin } from '../models/admin.model.js';
import { config } from '../config/env.js';

export class UserController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, Password } = req.body;
      const user = await userService.signup(name, email, Password);
      return res.status(200).json({
        message: 'User registered successfully',
        success: true,
        savedUser: user
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, Password, deviceInfo } = req.body;
      const result = await userService.login(email, Password, deviceInfo);
      return res.status(200).json({
        message: 'Login successful',
        success: true,
        user: result
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await userService.sendOtp(email);
      return res.status(200).json({ message: 'OTP sent successfully', success: true });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const isValid = await userService.verifyOtp(email, otp);
      if (isValid) {
        return res.status(200).json({ message: 'OTP verified successfully', success: true });
      } else {
        return res.status(400).json({ error: 'Invalid or expired OTP', success: false });
      }
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async findUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = req.body;
      const user = await userService.findUserByToken(accessToken);
      return res.status(200).json({
        success: true,
        user: {
          username: user.username,
          name: user.name,
          email: user.email
        }
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message, success: false });
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword } = req.body;
      await userService.changePassword(email, newPassword);
      return res.status(200).json({ message: 'Password changed successfully', success: true });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async changeName(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name } = req.body;
      await userService.changeName(email, name);
      return res.status(200).json({ message: 'Name changed successfully', success: true });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async changeEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentEmail, newEmail } = req.body;
      await userService.changeEmail(currentEmail, newEmail);
      return res.status(200).json({ message: 'Email changed successfully', success: true });
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ error: 'Admin user not registered' });
      }

      const isPasswordValid = admin.password === password;
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Password is wrong' });
      }

      const tokenData = { id: admin._id, email: admin.email };
      const token = jwt.sign(tokenData, config.jwtSecret, { expiresIn: '10d' });

      admin.accessToken = token;
      await admin.save();

      return res.status(200).json({
        message: 'Login successful',
        success: true,
        user: {
          email,
          accessToken: token
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
