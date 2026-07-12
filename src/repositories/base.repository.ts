import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: any): Promise<T> {
    return this.model.create(item);
  }

  async find(filter: FilterQuery<T> = {}, projection?: any, options?: QueryOptions): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  async findOne(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  async findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  async update(id: string, item: UpdateQuery<T>, options: QueryOptions = { new: true }): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, item, options).exec();
  }

  async updateOne(filter: FilterQuery<T>, item: UpdateQuery<T>, options?: QueryOptions): Promise<any> {
    return this.model.updateOne(filter, item, options as any).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return this.model.deleteMany(filter).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
