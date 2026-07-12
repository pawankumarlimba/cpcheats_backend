import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { Problem } from '../models/problem.model.js';
import { Algorithm } from '../models/algorithm.model.js';

const runTest = async () => {
  try {
    console.log('Connecting database for MCP tool logic verification...');
    const mongoConn = DatabaseConnectionFactory.getConnection('mongo');
    await mongoConn.connect();

    console.log('Testing search_problems tool logic...');
    const problems = await Problem.find({ problemtitle: { $regex: 'Sort', $options: 'i' } }).limit(5);
    console.log('Problems found:', problems.map(p => p.problemtitle));

    console.log('Testing get_problem_details tool logic...');
    const detail = await Problem.findOne({ problemtitle: 'Selection Sort' });
    console.log('Selection Sort Details found:', detail ? 'Yes' : 'No');

    console.log('Testing list_algorithms resource logic...');
    const algs = await Algorithm.find({}, { name: 1, slug: 1 }).limit(3);
    console.log('Algorithms found:', algs);

    console.log('MCP tool logic verification completed successfully!');
    await DatabaseConnectionFactory.disconnectAll();
    process.exit(0);
  } catch (error) {
    console.error('MCP tool logic test failed:', error);
    process.exit(1);
  }
};

runTest();
