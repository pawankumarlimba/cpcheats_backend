import mongoose, { Schema, Document } from 'mongoose';

export interface IUpvote {
  user?: string;
}

export interface IReply {
  replyid?: string;
  commentid?: string;
  username?: string;
  content?: string;
}

export interface IComment extends Document {
  initialPostId: string;
  user: string;
  data: string;
  upvotes: IUpvote[];
  replies: IReply[];
  createdAt: Date;
}

const UpvoteSchema = new Schema<IUpvote>({
  user: { type: String }
}, { _id: false });

const ReplySchema = new Schema<IReply>({
  replyid: { type: String },
  commentid: { type: String },
  username: { type: String },
  content: { type: String }
});

const CommentSchema = new Schema<IComment>({
  initialPostId: { type: String, required: true },
  user: { type: String, required: true },
  data: { type: String, required: true },
  upvotes: { type: [UpvoteSchema], default: [] },
  replies: { type: [ReplySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Unique index for (commentId, upvotedUser)
CommentSchema.index({ _id: 1, 'upvotes.user': 1 }, { unique: true });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
