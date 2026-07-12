import { config } from '../config/env.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const run = async () => {
  console.log('Testing request using native curl.exe child process...');
  console.log('API Key present:', !!config.googleApiKey);

  const payload = {
    contents: [{ parts: [{ text: 'Say hello in 3 words.' }] }]
  };

  const tempFilePath = path.join(process.cwd(), 'temp_test_req.json');
  fs.writeFileSync(tempFilePath, JSON.stringify(payload));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${config.googleApiKey}`;
  const cmd = `curl.exe -s -X POST -H "Content-Type: application/json" -d @${tempFilePath} "${url}"`;

  try {
    console.log('Executing curl command...');
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log('Command executed successfully!');
    
    // Clean up
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const data = JSON.parse(output);
    console.log('Response status matches. Output parsed successfully!');
    console.log('Parsed text response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err: any) {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.error('Execution failed:', err.message || err);
  }
};

run();
