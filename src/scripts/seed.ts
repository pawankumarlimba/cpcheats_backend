import fs from 'fs';
import path from 'path';
import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { Problem } from '../models/problem.model.js';
import { Algorithm } from '../models/algorithm.model.js';
import { Algodetails } from '../models/algodetails.model.js';
import { InterviewAnalist } from '../models/interview-analist.model.js';
import { Admin } from '../models/admin.model.js';

const rootDir = path.resolve(__dirname, '../../../');

const loadJSON = (fileName: string) => {
  const filePath = path.join(rootDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Warning] Seed file not found: ${filePath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const seed = async () => {
  try {
    console.log('Connecting to database for seeding...');
    const mongoConnection = DatabaseConnectionFactory.getConnection('mongo');
    await mongoConnection.connect();

    console.log('Clearing existing collections...');
    await Promise.all([
      Problem.deleteMany({}),
      Algorithm.deleteMany({}),
      Algodetails.deleteMany({}),
      InterviewAnalist.deleteMany({}),
      Admin.deleteMany({})
    ]);

    // 1. Seed Problems
    console.log('Seeding Problems...');
    const sheetsList = ['sheet.json', 'newsheet.json', 'newsheet2.json'];
    const problemsMap = new Map<string, any>();

    sheetsList.forEach(file => {
      const data = loadJSON(file);
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (!item.problemtitle) return;
          const key = item.problemtitle.trim();
          
          if (!problemsMap.has(key)) {
            problemsMap.set(key, {
              topicnameslug: item.topicnameslug || [],
              sheets: item.sheets || [],
              problemtitle: item.problemtitle,
              ischeack: item.ischeack || [],
              difficulty: item.difficulty || 'Easy',
              leetcodeLink: item.leetcodeLink || ''
            });
          } else {
            // Merge sheet names & topic names if problem exists in multiple files
            const existing = problemsMap.get(key);
            const sheetsSet = new Set(existing.sheets.map((s: any) => s.name));
            if (item.sheets) {
              item.sheets.forEach((s: any) => sheetsSet.add(s.name));
            }
            existing.sheets = Array.from(sheetsSet).map(name => ({ name }));

            const topicSet = new Set(existing.topicnameslug);
            if (item.topicnameslug) {
              item.topicnameslug.forEach((t: any) => topicSet.add(t));
            }
            existing.topicnameslug = Array.from(topicSet);
          }
        });
      }
    });

    const problemsToInsert = Array.from(problemsMap.values());
    if (problemsToInsert.length > 0) {
      await Problem.insertMany(problemsToInsert);
      console.log(`Successfully seeded ${problemsToInsert.length} problems!`);
    }

    // 2. Seed Algorithms
    console.log('Seeding Algorithms...');
    const algorithmsData = loadJSON('data.json');
    if (Array.isArray(algorithmsData) && algorithmsData.length > 0) {
      await Algorithm.insertMany(algorithmsData);
      console.log(`Successfully seeded ${algorithmsData.length} algorithms!`);
    }

    // 3. Seed Algorithm Details
    console.log('Seeding Algorithm Details...');
    const algodetailsData = loadJSON('algodetails.json');
    if (Array.isArray(algodetailsData) && algodetailsData.length > 0) {
      await Algodetails.insertMany(algodetailsData);
      console.log(`Successfully seeded ${algodetailsData.length} algorithm details!`);
    }

    // 4. Seed Interview Analist
    console.log('Seeding Interview Analist...');
    const interviewAnalistData = loadJSON('admindata.json');
    if (Array.isArray(interviewAnalistData) && interviewAnalistData.length > 0) {
      await InterviewAnalist.insertMany(interviewAnalistData);
      console.log(`Successfully seeded ${interviewAnalistData.length} interview analist companies!`);
    }

    // 5. Seed Default Admin User
    console.log('Seeding Default Admin...');
    await Admin.create({
      email: 'admin@cpcheats.com',
      password: 'password123',
      accessToken: ''
    });
    console.log('Seeding default admin completed.');

    console.log('Database seeding successfully finished!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding encountered an error:', error);
    process.exit(1);
  }
};

seed();
