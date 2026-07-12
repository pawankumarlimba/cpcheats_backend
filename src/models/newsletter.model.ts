import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email?: string;
  accessToken?: string;
  createdAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>({
  email: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Newsletter = mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
