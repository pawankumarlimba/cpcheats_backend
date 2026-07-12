import mongoose, { Schema, Document } from 'mongoose';

export interface IDsaProblem {
  problemid: string;
}

export interface IDsa extends Document {
  topicname: string;
  sheet: string;
  slug: string;
  problems: IDsaProblem[];
  createdAt: Date;
}

const DsaProblemSchema = new Schema<IDsaProblem>({
  problemid: { type: String, required: true }
}, { _id: false });

const DsaSchema = new Schema<IDsa>({
  topicname: { type: String, required: true },
  sheet: { type: String, required: true },
  slug: { type: String, required: true },
  problems: { type: [DsaProblemSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Dsa = mongoose.models.Dsa || mongoose.model<IDsa>('Dsa', DsaSchema);
