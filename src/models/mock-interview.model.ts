import mongoose, { Schema, Document } from 'mongoose';

export interface IMockInterview extends Document {
  jsonMockResp: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  createdBy: string;
  createdAt: Date;
  mockId: string;
}

const MockInterviewSchema = new Schema<IMockInterview>({
  jsonMockResp: { type: String, required: true },
  jobPosition: { type: String, required: true },
  jobDesc: { type: String, required: true },
  jobExperience: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  mockId: { type: String, required: true, unique: true }
});

export const MockInterview = mongoose.models.MockInterview || mongoose.model<IMockInterview>('MockInterview', MockInterviewSchema);
