import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { Problem } from '../models/problem.model.js';
import { Algorithm } from '../models/algorithm.model.js';
import { Comment } from '../models/comment.model.js';
import { aiService } from '../services/ai.service.js';
import { DatabaseConnectionFactory } from '../database/connection.factory.js';

// Create MCP Server
export const server = new Server(
  {
    name: 'code-editor-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define Resources List
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'problems://all-sheets',
        name: 'All Coding Sheets',
        mimeType: 'application/json',
        description: 'A list of distinct coding sheets available (e.g., striver-a2z, neetcode-150, love-babbar-dsa)'
      },
      {
        uri: 'algorithms://list',
        name: 'Algorithms list',
        mimeType: 'application/json',
        description: 'List of all system algorithms and complexity details'
      }
    ]
  };
});

// Handle Resource Reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  try {
    if (uri === 'problems://all-sheets') {
      const problems = await Problem.find({}, { sheets: 1 }).lean().exec();
      const sheetNames = new Set<string>();
      problems.forEach((p: any) => {
        if (p.sheets) {
          p.sheets.forEach((s: any) => sheetNames.add(s.name));
        }
      });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(Array.from(sheetNames), null, 2)
          }
        ]
      };
    }

    if (uri === 'algorithms://list') {
      const list = await Algorithm.find({}, { name: 1, slug: 1, timeComplexity: 1, spaceComplexity: 1 }).lean().exec();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(list, null, 2)
          }
        ]
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error reading resource: ${error.message}`
        }
      ]
    };
  }
});

// Define Tools List
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_problems',
        description: 'Search for coding problems in the database by keyword, difficulty, or topic slug',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keywords (e.g., Two Sum, Binary Tree)' },
            topic: { type: 'string', description: 'Optional topic slug (e.g., array, linkedlist, sorting)' },
            difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'], description: 'Optional difficulty filter' }
          }
        }
      },
      {
        name: 'get_problem_details',
        description: 'Fetch details of a single coding problem by its exact title',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Exact problem title' }
          },
          required: ['title']
        }
      },
      {
        name: 'ask_data_qa',
        description: 'Ask a Q&A question about coding sheets, problems, explanations, or algorithms. Uses local database context for accurate answers.',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Your question about DSA sheets, a problem, or comments' },
            problemTitle: { type: 'string', description: 'Optional problem title to inject specific problem details' }
          },
          required: ['question']
        }
      }
    ]
  };
});

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_problems') {
      const query = (args?.query as string) || '';
      const topic = (args?.topic as string) || '';
      const difficulty = (args?.difficulty as string) || '';

      const filter: any = {};
      if (query) {
        filter.problemtitle = { $regex: query, $options: 'i' };
      }
      if (topic) {
        filter.topicnameslug = { $in: [topic] };
      }
      if (difficulty) {
        filter.difficulty = difficulty;
      }

      const results = await Problem.find(filter).limit(15).lean().exec();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results.map((r: any) => ({
              id: r._id,
              title: r.problemtitle,
              difficulty: r.difficulty,
              leetcodeLink: r.leetcodeLink,
              topics: r.topicnameslug,
              sheets: r.sheets?.map((s: any) => s.name)
            })), null, 2)
          }
        ]
      };
    }

    if (name === 'get_problem_details') {
      const title = args?.title as string;
      const problem = (await Problem.findOne({ problemtitle: title }).lean().exec()) as any;
      if (!problem) {
        return {
          content: [{ type: 'text', text: `Problem "${title}" not found.` }]
        };
      }

      // Fetch comments for this problem if any
      const comments = await Comment.find({ initialPostId: problem._id }).lean().exec();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              problem: {
                title: problem.problemtitle,
                difficulty: problem.difficulty,
                leetcodeLink: problem.leetcodeLink,
                topics: problem.topicnameslug,
                sheets: problem.sheets?.map((s: any) => s.name)
              },
              comments: comments.map((c: any) => ({
                user: c.user,
                comment: c.data,
                upvotes: c.upvotes?.length || 0,
                replies: c.replies?.map((r: any) => ({ username: r.username, content: r.content }))
              }))
            }, null, 2)
          }
        ]
      };
    }

    if (name === 'ask_data_qa') {
      const question = args?.question as string;
      const problemTitle = args?.problemTitle as string;

      let problemContext = '';
      if (problemTitle) {
        const problem = (await Problem.findOne({ problemtitle: problemTitle }).lean().exec()) as any;
        if (problem) {
          const comments = await Comment.find({ initialPostId: problem._id }).lean().exec();
          problemContext = `\nContext on target problem:\n- Title: ${problem.problemtitle}\n- Difficulty: ${problem.difficulty}\n- Topics: ${problem.topicnameslug.join(', ')}\n- Leetcode: ${problem.leetcodeLink || 'N/A'}`;
          if (comments.length > 0) {
            problemContext += `\n- Student Discussions/Comments:\n${comments.map((c: any) => `  * ${c.user}: ${c.data}`).join('\n')}`;
          }
        }
      }

      const prompt = `You are a coding mentor answering a student's question based on the coding sheet data.
Here is the question: "${question}"
${problemContext}

Answer the student's question based on the context provided, giving clear code samples and step-by-step algorithms if appropriate.`;

      const result = await aiService.generateDSAResponse(prompt);
      return {
        content: [{ type: 'text', text: result }]
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error executing tool: ${error.message}` }],
      isError: true
    };
  }
});

// Setup Stdio launcher for standalone CLI execution
if (process.argv.includes('--stdio')) {
  console.error('Launching MCP Server in stdio transport mode...');
  // Ensure DB connects first
  DatabaseConnectionFactory.getConnection('mongo').connect()
    .then(() => {
      const transport = new StdioServerTransport();
      server.connect(transport).catch(console.error);
    })
    .catch(err => {
      console.error('Failed to connect MongoDB before launching stdio:', err);
      process.exit(1);
    });
}

// Function to attach SSE listener in Express app
export const attachMCPSSE = (app: any) => {
  let sseTransport: SSEServerTransport | null = null;

  app.get('/mcp', async (req: any, res: any) => {
    console.log('New SSE connection requested at /mcp');
    sseTransport = new SSEServerTransport('/mcp/messages', res);
    await server.connect(sseTransport);
  });

  app.post('/mcp/messages', async (req: any, res: any) => {
    if (sseTransport) {
      await (sseTransport as any).handleMessage(req, res);
    } else {
      res.status(400).send('No active SSE connection');
    }
  });
};
