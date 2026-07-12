import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAnswer extends Document {
  mockIdRef: string;
  question: string;
  correctAns?: string;
  userAns?: string;
  feedback?: string;
  rating?: string;
  userEmail?: string;
  createdAt: Date;
}

const UserAnswerSchema = new Schema<IUserAnswer>({
  mockIdRef: { type: String, required: true },
  question: { type: String, required: true },
  correctAns: { type: String },
  userAns: { type: String },
  feedback: { type: String },
  rating: { type: String },
  userEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const UserAnswer = mongoose.models.UserAnswer || mongoose.model<IUserAnswer>('UserAnswer', UserAnswerSchema);
