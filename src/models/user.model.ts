import mongoose, { Schema, Document } from 'mongoose';

export interface IToken {
  token: string;
  deviceInfo?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  username?: string;
  name?: string;
  email: string;
  password?: string;
  accessToken: IToken[];
  otp?: {
    otp?: string;
    otpCreatedAt?: Date;
  };
  createdAt: Date;
  deletedAt?: Date | null;
}

const TokenSchema = new Schema<IToken>({
  token: { type: String, required: true },
  deviceInfo: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const UserSchema = new Schema<IUser>({
  username: { type: String },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  accessToken: { type: [TokenSchema], default: [] },
  otp: {
    otp: { type: String, required: false },
    otpCreatedAt: { type: Date, required: false }
  },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
