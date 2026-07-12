import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service.js';

export class AIController {
  async explainCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code || code.trim() === '') {
        return res.status(400).json({ error: 'Code is required' });
      }

      const explanation = await aiService.explainCode(code);
      return res.status(200).json({ explanation });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to generate explanation' });
    }
  }

  async getHints(req: Request, res: Response, next: NextFunction) {
    try {
      const { question } = req.body;
      if (!question || question.trim() === '') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const hints = await aiService.generateHints(question);
      return res.status(200).json({ hints });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to generate hints' });
    }
  }

  async generateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { question, language } = req.body;
      if (!question || question.trim() === '') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const code = await aiService.generateCodeSolution(question, language);
      return res.status(200).json({ code });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to generate code' });
    }
  }

  async generateDSAResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt, problemTitle } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      let augmentedPrompt = prompt;

      // Inject problem and comment data context from MongoDB (MCP Q&A logic)
      if (problemTitle) {
        const { Problem } = await import('../models/problem.model.js');
        const { Comment } = await import('../models/comment.model.js');

        const problem = (await Problem.findOne({ problemtitle: problemTitle }).lean().exec()) as any;
        if (problem) {
          const comments = await Comment.find({ initialPostId: problem._id }).lean().exec();
          
          let problemContext = `\nContext on target problem:\n- Title: ${problem.problemtitle}\n- Difficulty: ${problem.difficulty}\n- Topics: ${problem.topicnameslug.join(', ')}\n- Leetcode: ${problem.leetcodeLink || 'N/A'}`;
          
          if (comments.length > 0) {
            problemContext += `\n- Student Discussions/Comments:\n${comments.map(c => `  * ${c.user}: ${c.data}`).join('\n')}`;
          }

          augmentedPrompt = `User question: "${prompt}"\n${problemContext}\n\nPlease answer the user's question leveraging this local problem details and discussions.`;
        }
      }

      const result = await aiService.generateDSAResponse(augmentedPrompt);
      return res.status(200).json({ result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to generate content.' });
    }
  }
}

export const aiController = new AIController();
