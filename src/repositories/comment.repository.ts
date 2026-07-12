import { BaseRepository } from './base.repository.js';
import { Comment, IComment } from '../models/comment.model.js';

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(Comment);
  }

  async getCommentsByPost(postId: string): Promise<IComment[]> {
    return this.find({ initialPostId: postId }, null, { sort: { createdAt: -1 } });
  }

  async toggleUpvote(commentId: string, username: string): Promise<IComment | null> {
    const comment = await this.findById(commentId);
    if (!comment) return null;

    const alreadyUpvoted = comment.upvotes.some(up => up.user === username);
    if (alreadyUpvoted) {
      // Remove upvote
      return this.model.findByIdAndUpdate(
        commentId,
        { $pull: { upvotes: { user: username } } },
        { new: true }
      ).exec();
    } else {
      // Add upvote
      return this.model.findByIdAndUpdate(
        commentId,
        { $push: { upvotes: { user: username } } },
        { new: true }
      ).exec();
    }
  }

  async addReply(commentId: string, reply: { replyid: string; commentid: string; username: string; content: string }): Promise<IComment | null> {
    return this.model.findByIdAndUpdate(
      commentId,
      { $push: { replies: reply } },
      { new: true }
    ).exec();
  }

  async deleteReply(commentId: string, replyid: string): Promise<IComment | null> {
    return this.model.findByIdAndUpdate(
      commentId,
      { $pull: { replies: { replyid } } },
      { new: true }
    ).exec();
  }
}
