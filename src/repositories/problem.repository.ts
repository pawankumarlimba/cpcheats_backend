import { BaseRepository } from './base.repository.js';
import { Problem, IProblem } from '../models/problem.model.js';

export class ProblemRepository extends BaseRepository<IProblem> {
  constructor() {
    super(Problem);
  }

  async findByTitle(title: string): Promise<IProblem | null> {
    return this.findOne({ problemtitle: title });
  }

  async getProblemsBySheet(sheetName: string): Promise<IProblem[]> {
    return this.find({ 'sheets.name': { $in: [sheetName] } });
  }

  async addCheck(problemId: string, userId: string): Promise<IProblem | null> {
    return this.model.findByIdAndUpdate(
      problemId,
      {
        $addToSet: { ischeack: { user: userId } }
      },
      { new: true }
    ).exec();
  }

  async removeCheck(problemId: string, userId: string): Promise<IProblem | null> {
    return this.model.findByIdAndUpdate(
      problemId,
      {
        $pull: { ischeack: { user: userId } }
      },
      { new: true }
    ).exec();
  }
}
