import mongoose, { Schema, Document } from 'mongoose';

export interface IFreqQuestion {
  question?: string;
  answer?: string;
}

export interface IAlgodetails extends Document {
  topicname: string;
  slug: string;
  details: string;
  freqquestion: IFreqQuestion[];
  createdAt: Date;
}

const FreqQuestionSchema = new Schema<IFreqQuestion>({
  question: { type: String },
  answer: { type: String }
}, { _id: false });

const AlgodetailsSchema = new Schema<IAlgodetails>({
  topicname: { type: String, required: true },
  slug: { type: String, required: true },
  details: { type: String, required: true },
  freqquestion: { type: [FreqQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Algodetails = mongoose.models.Algodetails || mongoose.model<IAlgodetails>('Algodetails', AlgodetailsSchema);
