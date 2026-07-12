import { BaseRepository } from './base.repository.js';
import { User, IUser } from '../models/user.model.js';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return this.findOne({ username });
  }

  async addAccessToken(userId: string, tokenData: { token: string; deviceInfo?: string; expiresAt: Date }): Promise<IUser | null> {
    return this.update(userId, {
      $push: { accessToken: tokenData }
    });
  }

  async removeExpiredTokens(userId: string): Promise<IUser | null> {
    const now = new Date();
    return this.update(userId, {
      $pull: { accessToken: { expiresAt: { $lte: now } } }
    });
  }

  async setOtp(email: string, otp: string): Promise<any> {
    return this.updateOne(
      { email },
      {
        $set: {
          otp: {
            otp,
            otpCreatedAt: new Date()
          }
        }
      }
    );
  }
}
