import mongoose, { Schema, Document } from 'mongoose';

export interface IAlgorithm extends Document {
  name: string;
  slug: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  use: string;
  code: Map<string, string>;
  execute: string;
  user?: string;
  accessToken?: string;
  createdAt: Date;
}

const AlgorithmSchema = new Schema<IAlgorithm>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
  use: { type: String, required: true },
  code: { type: Map, of: String, required: true },
  execute: { type: String, required: true },
  user: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Algorithm = mongoose.models.Algorithm || mongoose.model<IAlgorithm>('Algorithm', AlgorithmSchema);
