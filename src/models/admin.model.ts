import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email?: string;
  password?: string;
  accessToken?: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String },
  password: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
