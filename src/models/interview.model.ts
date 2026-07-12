import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  name?: string;
  issee: boolean;
  companyname?: string;
  details?: string;
  date?: string;
  isemail: boolean;
  slug?: string;
  accessToken?: string;
  createdAt: Date;
}

const InterviewSchema = new Schema<IInterview>({
  name: { type: String },
  issee: { type: Boolean, default: false },
  companyname: { type: String },
  details: { type: String },
  date: { type: String },
  isemail: { type: Boolean, default: false },
  slug: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Interview = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
