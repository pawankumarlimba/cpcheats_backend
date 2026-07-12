import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { redisService } from '../services/redis.service.js';

const runTest = async () => {
  try {
    console.log('Connecting databases for Redis test...');
    const redisConn = DatabaseConnectionFactory.getConnection('redis');
    await redisConn.connect();

    console.log('Running set/get test on Redis...');
    await redisService.set('test:hello', 'world', 30);
    const value = await redisService.get('test:hello');
    console.log(`GET 'test:hello' response: ${value} (expected: 'world')`);

    console.log('Running hash test on Redis...');
    await redisService.hmset('test:user:123', {
      name: 'Alice',
      role: 'student',
      score: 100
    });
    await redisService.expire('test:user:123', 30);
    const user = await redisService.hgetall('test:user:123');
    console.log('HGETALL response:', user);

    console.log('Cleaning up keys...');
    await redisService.del('test:hello');
    await redisService.del('test:user:123');

    console.log('Redis verification completed successfully!');
    await DatabaseConnectionFactory.disconnectAll();
    process.exit(0);
  } catch (error) {
    console.error('Redis test failed:', error);
    process.exit(1);
  }
};

runTest();
