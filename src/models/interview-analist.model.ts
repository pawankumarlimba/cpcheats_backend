import mongoose, { Schema, Document } from 'mongoose';

export interface ITopicObj {
  name: string;
  value: number;
}

export interface ITopicYear {
  year: string;
  obj: ITopicObj[];
}

export interface IProblemYear {
  year: string;
  title: string;
  practice: string;
  frequency: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface IInterviewAnalist extends Document {
  company: string;
  year: number;
  slug: string;
  topics: ITopicYear[];
  problems: IProblemYear[];
  createdAt: Date;
}

const TopicObjSchema = new Schema<ITopicObj>({
  name: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const TopicYearSchema = new Schema<ITopicYear>({
  year: { type: String, required: true },
  obj: { type: [TopicObjSchema], default: [] }
}, { _id: false });

const ProblemYearSchema = new Schema<IProblemYear>({
  year: { type: String, required: true },
  title: { type: String, required: true },
  practice: { type: String, required: true },
  frequency: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true }
}, { _id: false });

const InterviewAnalistSchema = new Schema<IInterviewAnalist>({
  company: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  slug: { type: String, required: true, unique: true },
  topics: { type: [TopicYearSchema], default: [] },
  problems: { type: [ProblemYearSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const InterviewAnalist = mongoose.models.InterviewAnalist || mongoose.model<IInterviewAnalist>('InterviewAnalist', InterviewAnalistSchema);
