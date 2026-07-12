import mongoose, { Schema, Document } from 'mongoose';

export interface ISheet {
  name: string;
}

export interface ICheck {
  user: string;
}

export interface IProblem extends Document {
  topicnameslug: string[];
  sheets: ISheet[];
  problemtitle: string;
  ischeack: ICheck[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcodeLink?: string;
  createdAt: Date;
}

const SheetSchema = new Schema<ISheet>({
  name: { type: String }
}, { _id: false });

const CheckSchema = new Schema<ICheck>({
  user: { type: String, required: true }
}, { _id: false });

const ProblemSchema = new Schema<IProblem>({
  topicnameslug: [{ type: String }],
  sheets: { type: [SheetSchema], default: [] },
  problemtitle: { type: String, required: true, unique: true },
  ischeack: { type: [CheckSchema], default: [] },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  leetcodeLink: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Problem = mongoose.models.Problem || mongoose.model<IProblem>('Problem', ProblemSchema);
