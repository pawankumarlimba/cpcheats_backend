import { Request, Response, NextFunction } from 'express';
import { Algorithm } from '../models/algorithm.model.js';
import { Algodetails } from '../models/algodetails.model.js';

export class AlgorithmController {
  async findAlgorithm(req: Request, res: Response, next: NextFunction) {
    try {
      const { searchQuery } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ message: 'Company name is required' });
      }

      const algorithms = await Algorithm.find({
        name: { $regex: searchQuery, $options: 'i' }
      });

      if (!algorithms.length) {
        return res.status(404).json({ message: 'No algorithms found' });
      }

      const response = algorithms.map(alg => ({
        name: alg.name,
        slug: alg.slug
      }));

      return res.status(200).json({ response });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async searchAlgorithm(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'Algorithm slug is required' });
      }

      const algorithm = await Algorithm.findOne({ slug });
      if (!algorithm) {
        return res.status(404).json({ message: 'Algorithm not found' });
      }

      const prevAlgorithm = await Algorithm.findOne(
        { slug: { $lt: slug } },
        { name: 1, slug: 1 }
      ).sort({ slug: -1 });

      const nextAlgorithm = await Algorithm.findOne(
        { slug: { $gt: slug } },
        { name: 1, slug: 1 }
      ).sort({ slug: 1 });

      return res.status(200).json({
        algorithm,
        prevAlgorithm: prevAlgorithm || null,
        nextAlgorithm: nextAlgorithm || null
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async getSidebar(req: Request, res: Response, next: NextFunction) {
    try {
      const algorithms = await Algorithm.find({}).sort({ name: 1 });
      const response = algorithms.map(alg => ({
        name: alg.name,
        slug: alg.slug
      }));
      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching algorithms', error: error.message });
    }
  }

  async getHomeAlgorithms(req: Request, res: Response, next: NextFunction) {
    try {
      const algorithms = await Algorithm.find().limit(3);
      return res.status(200).json({ algorithm: algorithms });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error fetching algorithms', error: error.message });
    }
  }

  async getAlgorithmDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'Slug is required' });
      }

      const post = await Algodetails.findOne({ slug });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json({ post });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }

  async getAlgorithmQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ message: 'Slug is required' });
      }

      const post = await Algodetails.findOne({ slug }, { freqquestion: 1 });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json({ freqquestion: post.freqquestion });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
}

export const algorithmController = new AlgorithmController();
