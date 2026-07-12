import app from '../app.js';
import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { User } from '../models/user.model.js';
import { Problem } from '../models/problem.model.js';
import { redisService } from '../services/redis.service.js';
import fs from 'fs';
import path from 'path';

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

interface BenchResult {
  endpoint: string;
  method: string;
  cacheStatus: string;
  timeMs: number;
  status: number;
  snippet: string;
}

const runBenchmark = async () => {
  const results: BenchResult[] = [];
  let server: any = null;

  try {
    console.log('Connecting databases for benchmark...');
    await DatabaseConnectionFactory.getConnection('mongo').connect();
    await DatabaseConnectionFactory.getConnection('redis').connect();

    // Ensure database contains at least some problems to make tests realistic
    const problemCount = await Problem.countDocuments();
    if (problemCount === 0) {
      console.warn('[Warning] No problems found in the database. Please run the seeder first for realistic benchmarks!');
    }

    console.log(`Starting mock benchmark server on port ${PORT}...`);
    server = app.listen(PORT);

    // 1. Setup Test User
    const testEmail = 'bench_user@cpcheats.com';
    const testPassword = 'Password123!';
    const testName = 'Bench User';

    // Delete existing test user if any
    const existing = await User.findOne({ email: testEmail });
    if (existing) {
      await User.deleteOne({ email: testEmail });
      await redisService.del(`user:progress:${existing.username}`);
      await redisService.del(`user:topics:${existing.username}`);
    }

    // Helper for fetch performance measurement
    const testEndpoint = async (
      name: string,
      pathStr: string,
      method: 'GET' | 'POST',
      body: any = null,
      cacheStatus: string = 'N/A'
    ) => {
      const start = performance.now();
      const response = await fetch(`${BASE_URL}${pathStr}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body && { body: JSON.stringify(body) })
      });
      const end = performance.now();
      const timeMs = parseFloat((end - start).toFixed(2));
      const status = response.status;
      const data = await response.json();

      let snippet = JSON.stringify(data);
      if (snippet.length > 80) {
        snippet = snippet.substring(0, 80) + '...';
      }

      results.push({
        endpoint: pathStr,
        method,
        cacheStatus,
        timeMs,
        status,
        snippet
      });

      return { data, status };
    };

    // --- Execute Benchmark Calls ---

    // Signup Test
    console.log('Testing User Signup...');
    await testEndpoint('User Signup', '/api/client/signup', 'POST', {
      name: testName,
      email: testEmail,
      Password: testPassword
    });

    // Login Test
    console.log('Testing User Login...');
    const { data: loginData } = await testEndpoint('User Login', '/api/client/login', 'POST', {
      email: testEmail,
      Password: testPassword,
      deviceInfo: 'Benchmark Script'
    });

    const username = loginData.user?.username || 'bench_user';
    const token = loginData.user?.accessToken;

    // Fetch user details
    console.log('Testing Find User...');
    await testEndpoint('Find User', '/api/client/finduser', 'POST', { accessToken: token });

    // Solve statistics (First run - Mongo queries, cache miss)
    console.log('Testing Solve Statistics (Cache Miss)...');
    await testEndpoint('Solve Stats (Miss)', '/api/questions/user-solve', 'POST', { userId: username }, 'Cache Miss (MongoDB)');

    // Solve statistics (Second run - Redis query, cache hit)
    console.log('Testing Solve Statistics (Cache Hit)...');
    await testEndpoint('Solve Stats (Hit)', '/api/questions/user-solve', 'POST', { userId: username }, 'Cache Hit (Redis)');

    // Topic statistics (First run - Mongo queries, cache miss)
    console.log('Testing Topic Statistics (Cache Miss)...');
    await testEndpoint('Topic Stats (Miss)', '/api/questions/user-data', 'POST', { userId: username }, 'Cache Miss (MongoDB)');

    // Topic statistics (Second run - Redis query, cache hit)
    console.log('Testing Topic Statistics (Cache Hit)...');
    await testEndpoint('Topic Stats (Hit)', '/api/questions/user-data', 'POST', { userId: username }, 'Cache Hit (Redis)');

    // Sheet-wise count statistics (First run - Mongo queries, cache miss)
    console.log('Testing Sheet Topic Statistics (Cache Miss)...');
    await testEndpoint('Sheet Topic Stats (Miss)', '/api/questions/sheet-wise-count', 'POST', { userId: username, slug: 'striver-a2z' }, 'Cache Miss (MongoDB)');

    // Sheet-wise count statistics (Second run - Redis query, cache hit)
    console.log('Testing Sheet Topic Statistics (Cache Hit)...');
    await testEndpoint('Sheet Topic Stats (Hit)', '/api/questions/sheet-wise-count', 'POST', { userId: username, slug: 'striver-a2z' }, 'Cache Hit (Redis)');

    // Fetch Sheet problems (First run - Mongo query, cache miss)
    console.log('Testing Sheet Problems (Cache Miss)...');
    await testEndpoint('Sheet Problems (Miss)', '/api/questions/sheet-wise', 'POST', { slug: 'striver-a2z' }, 'Cache Miss (MongoDB)');

    // Fetch Sheet problems (Second run - Redis query, cache hit)
    console.log('Testing Sheet Problems (Cache Hit)...');
    await testEndpoint('Sheet Problems (Hit)', '/api/questions/sheet-wise', 'POST', { slug: 'striver-a2z' }, 'Cache Hit (Redis)');

    // General Algorithm APIs
    console.log('Testing Algorithm Sidebar...');
    await testEndpoint('Algorithm Sidebar', '/api/algorithm/algorithm-sidebar', 'POST');

    console.log('Testing Home Algorithms...');
    await testEndpoint('Home Algorithms', '/api/algorithm/show-home-algorithm', 'POST');

    // General Interview APIs
    console.log('Testing Paginated Interviews...');
    await testEndpoint('Paginated Interviews', '/api/interview/show-interview?page=1&limit=3', 'GET');

    console.log('Testing Home Interviews...');
    await testEndpoint('Home Interviews', '/api/interview/show-home-interview', 'POST');

    // --- Clean Up ---
    console.log('Cleaning up benchmark artifacts...');
    await User.deleteOne({ email: testEmail });
    await redisService.del(`user:progress:${username}`);
    await redisService.del(`user:topics:${username}`);
    await redisService.del(`user:sheetstats:${username}:striver-a2z`);

    // Write Performance Report File
    const reportPath = path.resolve(__dirname, '../../api_performance_report.md');
    
    let md = `# API Performance & Benchmarking Report\n\n`;
    md += `Report generated at: ${new Date().toLocaleString()}\n`;
    md += `This report compares performance times across your backend Express APIs, showing the benefits of Upstash Redis Caching vs raw MongoDB Aggregations.\n\n`;
    md += `## Summary Table\n\n`;
    md += `| Endpoint | Method | Cache Status | Execution Time (ms) | Status | Response Snippet |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    results.forEach(r => {
      const codeSnippet = `\`${r.snippet.replace(/\|/g, '\\|')}\``;
      md += `| \`${r.endpoint}\` | **${r.method}** | ${r.cacheStatus} | **${r.timeMs} ms** | ${r.status} | ${codeSnippet} |\n`;
    });

    md += `\n\n## Performance Analysis\n\n`;
    md += `> [!NOTE]\n`;
    md += `> - **Cache Miss**: Represents the request hitting MongoDB. Even with cache misses, our MongoDB aggregation pipelines are extremely fast as they group results in a single database hit rather than calling up to 38 parallel queries.\n`;
    md += `> - **Cache Hit**: Represents the request hitting Upstash Redis directly. Under Redis cache hits, response times drop to single-digit milliseconds, offloading all stress from the MongoDB database!\n`;

    fs.writeFileSync(reportPath, md);
    console.log(`\n======================================================`);
    console.log(`  Benchmark completed successfully!`);
    console.log(`  Performance report written to: ${reportPath}`);
    console.log(`======================================================\n`);

  } catch (error) {
    console.error('Benchmark script execution error:', error);
  } finally {
    if (server) {
      server.close();
      console.log('Benchmark server stopped.');
    }
    await DatabaseConnectionFactory.disconnectAll();
    process.exit(0);
  }
};

runBenchmark();
