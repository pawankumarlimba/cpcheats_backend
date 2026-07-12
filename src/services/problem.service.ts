import { ProblemRepository } from '../repositories/problem.repository.js';
import { redisService } from './redis.service.js';
import { Problem } from '../models/problem.model.js';

export class ProblemService {
  private problemRepository = new ProblemRepository();

  // Mark a problem as solved
  async addCheck(problemId: string, userId: string): Promise<void> {
    if (!problemId || !userId) {
      throw new Error('Problem ID and User ID are required');
    }

    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    const alreadyChecked = problem.ischeack.some(check => check.user === userId);
    if (!alreadyChecked) {
      await this.problemRepository.addCheck(problemId, userId);
    }

    // Invalidate Redis caches for this user
    await this.invalidateUserCache(userId);
  }

  // Mark a problem as unsolved
  async removeCheck(problemId: string, userId: string): Promise<void> {
    if (!problemId || !userId) {
      throw new Error('Problem ID and User ID are required');
    }

    await this.problemRepository.removeCheck(problemId, userId);

    // Invalidate Redis caches for this user
    await this.invalidateUserCache(userId);
  }

  // Get sheet-wise solve statistics
  async getUserSolveStats(userId: string): Promise<any> {
    const totalsCacheKey = 'problems:totals';
    const userCacheKey = `user:progress:${userId}`;

    // 1. Fetch Totals (Cache layer)
    let totals = await redisService.hgetall(totalsCacheKey);
    if (Object.keys(totals).length === 0) {
      const [total, neetcode, striver, lovebabbar] = await Promise.all([
        Problem.countDocuments(),
        Problem.countDocuments({ 'sheets.name': 'neetcode-150' }),
        Problem.countDocuments({ 'sheets.name': 'striver-a2z' }),
        Problem.countDocuments({ 'sheets.name': 'love-babbar-dsa' })
      ]);

      totals = {
        total: total.toString(),
        neetcode: neetcode.toString(),
        striver: striver.toString(),
        lovebabbar: lovebabbar.toString()
      };

      await redisService.hmset(totalsCacheKey, totals);
      await redisService.expire(totalsCacheKey, 24 * 60 * 60);
    }

    // 2. Fetch User Solve Progress (Cache layer)
    let userStats = await redisService.hgetall(userCacheKey);
    if (Object.keys(userStats).length === 0) {
      const solvedSheetsList = await Problem.aggregate([
        { $match: { 'ischeack.user': userId } },
        { $unwind: '$sheets' },
        { $group: { _id: '$sheets.name', count: { $sum: 1 } } }
      ]);

      const [solveTotal] = await Promise.all([
        Problem.countDocuments({ 'ischeack.user': userId })
      ]);

      const solvedMap: Record<string, number> = {
        'neetcode-150': 0,
        'striver-a2z': 0,
        'love-babbar-dsa': 0
      };

      solvedSheetsList.forEach(item => {
        if (item._id in solvedMap) {
          solvedMap[item._id] = item.count;
        }
      });

      userStats = {
        neetcodeSolve: solvedMap['neetcode-150'].toString(),
        striverSolve: solvedMap['striver-a2z'].toString(),
        lovebabbarSolve: solvedMap['love-babbar-dsa'].toString(),
        solve: solveTotal.toString()
      };

      await redisService.hmset(userCacheKey, userStats);
      await redisService.expire(userCacheKey, 2 * 60 * 60);
    }

    return {
      total: parseInt(totals.total, 10),
      neetcodetotal: parseInt(totals.neetcode, 10),
      staivertotal: parseInt(totals.striver, 10),
      lovebabertotal: parseInt(totals.lovebabbar, 10),
      neetcodesolve: parseInt(userStats.neetcodeSolve, 10),
      staiversolve: parseInt(userStats.striverSolve, 10),
      lovebabersolve: parseInt(userStats.lovebabbarSolve, 10),
      solve: parseInt(userStats.solve, 10),
    };
  }

  // Get topic-wise counts
  async getUserTopicStats(userId: string): Promise<any> {
    const userTopicCacheKey = `user:topics:${userId}`;

    let topicStats = await redisService.hgetall(userTopicCacheKey);
    if (Object.keys(topicStats).length === 0) {
      const topics = [
        'arrays', 'linkedList', 'binaryTree', 'graph', 'recursion',
        'binarySearch', 'hashing', 'string', 'twoPointer', 'binarySearchTree',
        'dynamicProgramming', 'sorting', 'stack', 'heap', 'maths',
        'greedy', 'queue', 'bitManipulation', 'python', 'slidingWindow'
      ];

      const topicSlugMap: Record<string, string> = {
        arrays: 'array',
        linkedList: 'linkedlist',
        binaryTree: 'binary-tree',
        graph: 'graph',
        recursion: 'recursion',
        binarySearch: 'binary-search',
        hashing: 'hashing',
        string: 'string',
        twoPointer: 'two-pointer',
        binarySearchTree: 'binary-search-tree',
        dynamicProgramming: 'dynamic-programming',
        sorting: 'sorting',
        stack: 'stack',
        heap: 'heap',
        maths: 'maths',
        greedy: 'greedy',
        queue: 'queue',
        bitManipulation: 'bitmanipulation',
        python: 'python',
        slidingWindow: 'sliding-window'
      };

      const solvedTopicsList = await Problem.aggregate([
        { $match: { 'ischeack.user': userId } },
        { $unwind: '$topicnameslug' },
        { $group: { _id: '$topicnameslug', count: { $sum: 1 } } }
      ]);

      const solvedMap: Record<string, number> = {};
      solvedTopicsList.forEach(item => {
        solvedMap[item._id] = item.count;
      });

      const stats: Record<string, string> = {};
      topics.forEach(t => {
        const slug = topicSlugMap[t];
        const count = solvedMap[slug] || 0;
        stats[t] = count.toString();
      });

      topicStats = stats;

      await redisService.hmset(userTopicCacheKey, topicStats);
      await redisService.expire(userTopicCacheKey, 2 * 60 * 60);
    }

    const result: Record<string, number> = {};
    for (const [key, val] of Object.entries(topicStats)) {
      result[key] = parseInt(val, 10);
    }

    return result;
  }

  // Get sheet-wise topic totals & user solved counts (OPTIMIZED)
  async getUserSheetTopicStats(userId: string, slug: string): Promise<any> {
    const cacheKey = `user:sheetstats:${userId}:${slug}`;

    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 1. Get total count and solved count for the entire sheet
    const [total, solve] = await Promise.all([
      Problem.countDocuments({ 'sheets.name': slug }),
      Problem.countDocuments({ 'sheets.name': slug, 'ischeack.user': userId })
    ]);

    // 2. Aggregate total counts grouped by topic
    const totalTopicCounts = await Problem.aggregate([
      { $match: { 'sheets.name': slug } },
      { $unwind: '$topicnameslug' },
      { $group: { _id: '$topicnameslug', count: { $sum: 1 } } }
    ]);

    // 3. Aggregate solved counts grouped by topic for this user
    const solvedTopicCounts = await Problem.aggregate([
      { $match: { 'sheets.name': slug, 'ischeack.user': userId } },
      { $unwind: '$topicnameslug' },
      { $group: { _id: '$topicnameslug', count: { $sum: 1 } } }
    ]);

    const totalMap: Record<string, number> = {};
    totalTopicCounts.forEach(item => {
      totalMap[item._id] = item.count;
    });

    const solvedMap: Record<string, number> = {};
    solvedTopicCounts.forEach(item => {
      solvedMap[item._id] = item.count;
    });

    // Match the topics required by the frontend
    const topicKeys = [
      { key: 'arrays', slug: 'array' },
      { key: 'linkedList', slug: 'linkedlist' },
      { key: 'binaryTree', slug: 'binary-tree' },
      { key: 'graph', slug: 'graph' },
      { key: 'recursion', slug: 'recursion' },
      { key: 'binarySearch', slug: 'binary-search' },
      { key: 'string', slug: 'string' },
      { key: 'twoPointer', slug: 'two-pointer' },
      { key: 'binarySearchTree', slug: 'binary-search-tree' },
      { key: 'dynamicProgramming', slug: 'dynamic-programming' },
      { key: 'sorting', slug: 'sorting' },
      { key: 'stack', slug: 'stack' },
      { key: 'heap', slug: 'heap' },
      { key: 'greedy', slug: 'greedy' },
      { key: 'queue', slug: 'queue' },
      { key: 'bitManipulation', slug: 'bitmanipulation' },
      { key: 'slidingWindow', slug: 'sliding-window' }
    ];

    const response: Record<string, any> = {
      solve,
      total
    };

    topicKeys.forEach(t => {
      response[t.key] = {
        solve: solvedMap[t.slug] || 0,
        total: totalMap[t.slug] || 0
      };
    });

    // Cache results for 2 hours
    await redisService.set(cacheKey, JSON.stringify(response), 2 * 60 * 60);

    return response;
  }

  // Get sheet-wise problems grouped by topic (OPTIMIZED)
  async getSheetProblemsCategorized(slug: string): Promise<any> {
    const cacheKey = `sheet:problems:${slug}`;

    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Single DB Query to fetch all problems
    const allProblems = await Problem.find({ 'sheets.name': slug }).lean().exec();

    const categorized: Record<string, any[]> = {
      array: [], linkedlist: [], 'binary-tree': [], graph: [], recursion: [],
      'binary-search': [], string: [], 'two-pointer': [], 'binary-search-tree': [],
      'dynamic-programming': [], sorting: [], stack: [], heap: [], greedy: [],
      queue: [], bitmanipulation: [], 'sliding-window': []
    };

    allProblems.forEach(p => {
      if (Array.isArray(p.topicnameslug)) {
        p.topicnameslug.forEach(topic => {
          if (topic in categorized) {
            categorized[topic].push(p);
          }
        });
      }
    });

    const response = {
      arrays: categorized.array,
      linkedList: categorized.linkedlist,
      binaryTree: categorized['binary-tree'],
      graph: categorized.graph,
      recursion: categorized.recursion,
      binarySearch: categorized['binary-search'],
      string: categorized.string,
      twoPointer: categorized['two-pointer'],
      binarySearchTree: categorized['binary-search-tree'],
      dynamicProgramming: categorized['dynamic-programming'],
      sorting: categorized.sorting,
      stack: categorized.stack,
      heap: categorized.heap,
      greedy: categorized.greedy,
      queue: categorized.queue,
      bitManipulation: categorized.bitmanipulation,
      slidingWindow: categorized['sliding-window']
    };

    // Cache problems for 1 hour
    await redisService.set(cacheKey, JSON.stringify(response), 60 * 60);

    return response;
  }

  // Helper to fetch topic-wise count for a single slug
  async getTopicCount(userId: string, slug: string): Promise<any> {
    const [total, solve] = await Promise.all([
      Problem.countDocuments({ topicnameslug: { $in: [slug] } }),
      Problem.countDocuments({
        topicnameslug: { $in: [slug] },
        'ischeack.user': { $in: [userId] }
      })
    ]);

    return { total, solve };
  }

  // Clear caches for a user
  private async invalidateUserCache(userId: string): Promise<void> {
    await redisService.del(`user:progress:${userId}`);
    await redisService.del(`user:topics:${userId}`);

    // Find and delete all sheet progress keys for this user
    // Since Upstash Redis may contain many keys, deleting the specific sheet keys is fast
    const sheets = ['neetcode-150', 'striver-a2z', 'love-babbar-dsa'];
    for (const sheet of sheets) {
      await redisService.del(`user:sheetstats:${userId}:${sheet}`);
    }
  }
}

export const problemService = new ProblemService();
