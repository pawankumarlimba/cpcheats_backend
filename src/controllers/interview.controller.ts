import { Request, Response, NextFunction } from 'express';
import { Interview } from '../models/interview.model.js';
import { InterviewAnalist } from '../models/interview-analist.model.js';

export class InterviewController {
  // GET: Fetch paginated interviews (issee: true)
  async showInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '6', 10);
      const skip = (page - 1) * limit;

      const blogs = await Interview.find({ issee: true }).skip(skip).limit(limit);
      const totalBlogs = await Interview.countDocuments({ issee: true });

      return res.status(200).json({
        blogs,
        totalPages: Math.ceil(totalBlogs / limit),
        currentPage: page
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching interviews', error: error.message });
    }
  }

  // POST: Show home interviews (limit 6, issee: true)
  async showHomeInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const blogs = await Interview.find({ issee: true }).limit(6);
      return res.status(200).json({ blogs });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching home interviews', error: error.message });
    }
  }

  // POST: Submit a new interview (sets issee: true for immediate dev visibility)
  async sendInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, companyname, details, date, slug, accessToken } = req.body;
      const newInterview = await Interview.create({
        name,
        companyname,
        details,
        date,
        slug,
        accessToken,
        issee: true
      });

      return res.status(200).json({
        message: 'interview added successfully',
        success: true,
        savedInterview: newInterview
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Find interview by ID and get related posts
  async findInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'Slug/ID is required' });
      }

      const post = await Interview.findById(slug);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const companyNameRegex = post.companyname ? escapeRegex(post.companyname) : '';
      const nameRegex = post.name ? escapeRegex(post.name) : '';
      const detailsRegex = post.details ? escapeRegex(post.details) : '';

      const relatedPosts = await Interview.find({
        $and: [
          { issee: true },
          { _id: { $ne: slug } },
          {
            $or: [
              { companyname: { $regex: companyNameRegex, $options: 'i' } },
              { name: { $regex: nameRegex, $options: 'i' } },
              { details: { $regex: detailsRegex, $options: 'i' } }
            ]
          }
        ]
      }).limit(10);

      return res.status(200).json({ post, relatedPosts });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  // POST: Search interviews by query
  async searchInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { searchQuery } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const posts = await Interview.find({
        issee: true,
        $or: [
          { companyname: { $regex: searchQuery, $options: 'i' } },
          { name: { $regex: searchQuery, $options: 'i' } }
        ]
      });

      return res.status(200).json({ response: posts });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  // POST: Verify interview (Admin approval - sets issee: true)
  async verifyInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'ID is required' });
      }

      const post = await Interview.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      post.issee = true;
      await post.save();

      return res.status(200).json({ message: 'Interview verified successfully', success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Show all interviews for admin (no issee: true filter)
  async showInterviewAll(req: Request, res: Response, next: NextFunction) {
    try {
      const blogs = await Interview.find().sort({ createdAt: -1 });
      return res.status(200).json({ blogs });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ---------------- INTERVIEW ANALYZER HANDLERS ----------------

  async analyzerSidebar(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await InterviewAnalist.find({}).sort({ company: 1 });
      const response = list.map(item => ({
        companyname: item.company,
        slug: item.slug
      }));
      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching interviews', error: error.message });
    }
  }

  async analyzerSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'interview slug is required' });
      }

      const interview = await InterviewAnalist.findOne({ slug });
      if (!interview) {
        return res.status(404).json({ message: 'interview not found' });
      }

      const prevInterviewAnalist = await InterviewAnalist.findOne(
        { slug: { $lt: slug } },
        { company: 1, slug: 1 }
      ).sort({ slug: -1 });

      const nextInterviewAnalist = await InterviewAnalist.findOne(
        { slug: { $gt: slug } },
        { company: 1, slug: 1 }
      ).sort({ slug: 1 });

      return res.status(200).json({
        interview,
        prevInterviewAnalist: prevInterviewAnalist || null,
        nextInterviewAnalist: nextInterviewAnalist || null
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async analyzerFind(req: Request, res: Response, next: NextFunction) {
    try {
      const { searchQuery } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ message: 'Company name is required' });
      }

      const list = await InterviewAnalist.find({
        company: { $regex: searchQuery, $options: 'i' }
      });

      if (!list.length) {
        return res.status(404).json({ message: 'No company found' });
      }

      const response = list.map(item => ({
        name: item.company,
        slug: item.slug
      }));

      return res.status(200).json({ response });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async analyzerAlgorithm(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await InterviewAnalist.find().limit(3);
      return res.status(200).json({ response: list }); // note: nextjs returned response: list or similar
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
}

export const interviewController = new InterviewController();
