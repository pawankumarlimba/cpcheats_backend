import { Request, Response, NextFunction } from 'express';
import { problemService } from '../services/problem.service.js';

export class ProblemController {
  async getUserSolveStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const stats = await problemService.getUserSolveStats(userId);
      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async getUserTopicStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const stats = await problemService.getUserTopicStats(userId);
      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async getTopicCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, slug } = req.body;
      if (!userId || !slug) {
        return res.status(400).json({ message: 'User ID and slug are required' });
      }
      const result = await problemService.getTopicCount(userId, slug);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async getUserSheetTopicStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, slug } = req.body;
      if (!userId || !slug) {
        return res.status(400).json({ message: 'User ID and slug are required' });
      }
      const result = await problemService.getUserSheetTopicStats(userId, slug);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async getSheetProblemsCategorized(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'Slug is required' });
      }
      const result = await problemService.getSheetProblemsCategorized(slug);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async addCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, problemId } = req.body;
      await problemService.addCheck(problemId, userId);
      return res.status(200).json({ message: 'problem solve', success: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  async removeCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, problemId } = req.body;
      await problemService.removeCheck(problemId, userId);
      return res.status(200).json({ message: 'problem check removed', success: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }
}

export const problemController = new ProblemController();
