import { Request, Response, NextFunction } from 'express';
import { CommentRepository } from '../repositories/comment.repository.js';
import { v4 as uuidv4 } from 'uuid';

export class CommentController {
  private commentRepository = new CommentRepository();

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const initialPostId = req.query.initialPostId as string;
      const currentPage = parseInt((req.query.currentPage as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '5', 10);
      const skip = (currentPage - 1) * limit;

      if (!initialPostId) {
        return res.status(400).json({ error: 'initialPostId is required' });
      }

      // Escape regex special chars
      const safePostId = initialPostId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const filter = { initialPostId: { $regex: new RegExp(`^${safePostId}$`) } };

      const comments = await this.commentRepository.find(filter, null, {
        skip,
        limit,
        sort: { createdAt: -1 }
      });

      const totalComments = await this.commentRepository.count(filter);

      return res.status(200).json({
        comments,
        totalPages: Math.ceil(totalComments / limit),
        currentPage
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
  }

  async sendComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { initialPostId, data, user } = req.body;
      if (!initialPostId || !data || !user) {
        return res.status(400).json({ message: 'post id is required' });
      }

      const newComment = await this.commentRepository.create({
        initialPostId,
        data,
        user,
        replies: []
      });

      return res.status(200).json({
        message: 'Comment added successfully',
        success: true,
        savedcomment: newComment
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async sendReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentid, username, content } = req.body;
      if (!commentid || !username || !content) {
        return res.status(400).json({ message: 'Comment ID, username, and content are required' });
      }

      const replyid = uuidv4();
      const updatedComment = await this.commentRepository.addReply(commentid, {
        replyid,
        commentid,
        username,
        content
      });

      if (!updatedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      return res.status(200).json({
        message: 'Reply added successfully',
        success: true,
        updatedComment
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async likeHandle(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentid, user } = req.body;
      if (!commentid || !user) {
        return res.status(400).json({ message: 'commentid and user is required' });
      }

      const updated = await this.commentRepository.toggleUpvote(commentid, user);
      if (!updated) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      return res.status(200).json({
        message: 'Like updated successfully',
        success: true,
        savedcomment: updated
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.body;
      if (!commentId) {
        return res.status(400).json({ message: 'Comment ID is required' });
      }

      const deleted = await this.commentRepository.delete(commentId);
      if (!deleted) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      return res.status(200).json({
        message: 'Comment deleted successfully',
        success: true
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentid, replyid } = req.body;
      if (!commentid || !replyid) {
        return res.status(400).json({ message: 'Comment ID and Reply ID are required' });
      }

      const updated = await this.commentRepository.deleteReply(commentid, replyid);
      if (!updated) {
        return res.status(404).json({ error: 'Comment or reply not found' });
      }

      return res.status(200).json({
        message: 'Reply deleted successfully',
        success: true
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const commentController = new CommentController();
