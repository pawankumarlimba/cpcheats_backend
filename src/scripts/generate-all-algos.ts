import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { Algorithm } from '../models/algorithm.model.js';
import { config } from '../config/env.js';

// __dirname is globally available in this project's compilation settings

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

// 100 DSA Algorithms List
const ALGORITHMS_LIST = [
  // Sorting (1-10)
  { name: "Bubble Sort", slug: "bubble-sort" },
  { name: "Selection Sort", slug: "selection-sort" },
  { name: "Insertion Sort", slug: "insertion-sort" },
  { name: "Merge Sort", slug: "merge-sort" },
  { name: "Quick Sort", slug: "quick-sort" },
  { name: "Heap Sort", slug: "heap-sort" },
  { name: "Counting Sort", slug: "counting-sort" },
  { name: "Radix Sort", slug: "radix-sort" },
  { name: "Bucket Sort", slug: "bucket-sort" },
  { name: "Shell Sort", slug: "shell-sort" },

  // Searching & Selection (11-15)
  { name: "Linear Search", slug: "linear-search" },
  { name: "Binary Search", slug: "binary-search" },
  { name: "Ternary Search", slug: "ternary-search" },
  { name: "Exponential Search", slug: "exponential-search" },
  { name: "Jump Search", slug: "jump-search" },

  // Graph Traversal & MST (16-30)
  { name: "Breadth First Search", slug: "bfs" },
  { name: "Depth First Search", slug: "dfs" },
  { name: "Dijkstra's Algorithm", slug: "dijkstra-algorithm" },
  { name: "Bellman-Ford Algorithm", slug: "bellman-ford-algorithm" },
  { name: "Floyd-Warshall Algorithm", slug: "floyd-warshall-algorithm" },
  { name: "Kruskal's Algorithm", slug: "kruskals-algorithm" },
  { name: "Prim's Algorithm", slug: "prims-algorithm" },
  { name: "Topological Sort", slug: "topological-sort" },
  { name: "Kosaraju's Algorithm", slug: "kosarajus-algorithm" },
  { name: "Tarjan's Algorithm", slug: "tarjans-algorithm" },
  { name: "Kahn's Algorithm", slug: "kahns-algorithm" },
  { name: "Bipartite Graph Check", slug: "bipartite-graph-check" },
  { name: "Bridge Detection", slug: "bridge-detection" },
  { name: "Articulation Points", slug: "articulation-points" },
  { name: "Floyd's Cycle Detection", slug: "floyds-cycle-detection" },

  // Dynamic Programming (31-60)
  { name: "Kadane's Algorithm", slug: "kadanes-algorithm" },
  { name: "Longest Common Subsequence", slug: "lcs" },
  { name: "Longest Increasing Subsequence", slug: "lis" },
  { name: "Edit Distance", slug: "edit-distance" },
  { name: "Matrix Chain Multiplication", slug: "matrix-chain-multiplication" },
  { name: "0/1 Knapsack Problem", slug: "knapsack-0-1" },
  { name: "Fractional Knapsack", slug: "fractional-knapsack" },
  { name: "Coin Change Problem", slug: "coin-change" },
  { name: "Rod Cutting Problem", slug: "rod-cutting" },
  { name: "Subset Sum Problem", slug: "subset-sum" },
  { name: "Longest Palindromic Substring", slug: "longest-palindromic-substring" },
  { name: "Wildcard Matching", slug: "wildcard-matching" },
  { name: "Regular Expression Matching", slug: "regex-matching" },
  { name: "Word Break Problem", slug: "word-break" },
  { name: "Egg Dropping Puzzle", slug: "egg-dropping" },
  { name: "Optimal BST", slug: "optimal-bst" },
  { name: "Unique Paths", slug: "unique-paths" },
  { name: "Decode Ways", slug: "decode-ways" },
  { name: "Min Cost Path", slug: "min-cost-path" },
  { name: "Palindrome Partitioning", slug: "palindrome-partitioning" },
  { name: "Maximal Square", slug: "maximal-square" },
  { name: "Box Stacking", slug: "box-stacking" },
  { name: "House Robber", slug: "house-robber" },
  { name: "Interleaving String", slug: "interleaving-string" },
  { name: "Climbing Stairs", slug: "climbing-stairs" },
  { name: "Jump Game", slug: "jump-game" },
  { name: "Best Time to Buy and Sell Stock", slug: "buy-sell-stock" },
  { name: "Unique Binary Search Trees", slug: "unique-bst" },
  { name: "Max Product Subarray", slug: "max-product-subarray" },
  { name: "Combination Sum", slug: "combination-sum" },

  // String Matching & Parsing (61-75)
  { name: "KMP Algorithm", slug: "kmp-algorithm" },
  { name: "Rabin-Karp Algorithm", slug: "rabin-karp" },
  { name: "Z-Algorithm", slug: "z-algorithm" },
  { name: "Aho-Corasick Algorithm", slug: "aho-corasick" },
  { name: "Boyer-Moore Algorithm", slug: "boyer-moore" },
  { name: "Manacher's Algorithm", slug: "manachers-algorithm" },
  { name: "Suffix Array", slug: "suffix-array" },
  { name: "Huffman Coding", slug: "huffman-coding" },
  { name: "Run Length Encoding", slug: "run-length-encoding" },
  { name: "RLE Compression", slug: "rle-compression" },
  { name: "Trie Tree Insertion", slug: "trie-insertion" },
  { name: "Trie Search", slug: "trie-search" },
  { name: "Levenshtein Distance", slug: "levenshtein-distance" },
  { name: "Anagram Check", slug: "anagram-check" },
  { name: "Valid Parentheses Check", slug: "valid-parentheses" },

  // Mathematical & Number Theory (76-90)
  { name: "Sieve of Eratosthenes", slug: "sieve-of-eratosthenes" },
  { name: "Euclidean GCD Algorithm", slug: "euclidean-gcd" },
  { name: "Extended Euclidean GCD", slug: "extended-gcd" },
  { name: "Modular Exponentiation", slug: "modular-exponentiation" },
  { name: "Chinese Remainder Theorem", slug: "chinese-remainder-theorem" },
  { name: "Fermat's Little Theorem", slug: "fermats-little-theorem" },
  { name: "Miller-Rabin Primality Test", slug: "miller-rabin" },
  { name: "Matrix Exponentiation", slug: "matrix-exponentiation" },
  { name: "Fibonacci Iterative", slug: "fibonacci-iterative" },
  { name: "Prime Factorization", slug: "prime-factorization" },
  { name: "Sieve of Sundaram", slug: "sieve-of-sundaram" },
  { name: "Catalan Numbers", slug: "catalan-numbers" },
  { name: "Binary Exponentiation", slug: "binary-exponentiation" },
  { name: "Next Permutation", slug: "next-permutation" },
  { name: "Pascal's Triangle Generation", slug: "pascals-triangle" },

  // Greedy & Standard DSA (91-100)
  { name: "Activity Selection", slug: "activity-selection" },
  { name: "Job Sequencing with Deadlines", slug: "job-sequencing" },
  { name: "Fractional Knapsack Greedy", slug: "fractional-knapsack-greedy" },
  { name: "Gas Station Circular Tour", slug: "gas-station" },
  { name: "Water Connection Problem", slug: "water-connection" },
  { name: "Huffman Encoding Greedy", slug: "huffman-encoding-greedy" },
  { name: "Egyptian Fraction", slug: "egyptian-fraction" },
  { name: "Police and Thieves", slug: "police-thieves" },
  { name: "Fitting Shelves Problem", slug: "fitting-shelves" },
  { name: "Minimum Coins for Change", slug: "min-coins-change" }
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateAlgorithmData = async (name: string, slug: string): Promise<any> => {
  const prompt = `
Generate a single JSON object for the Data Structures and Algorithms (DSA) algorithm: "${name}".
You must return a syntactically correct JSON object matching this structure exactly. All string values (especially code blocks and execute script) must have their double quotes escaped as \\" and their newlines escaped as \\n to prevent parsing errors:
{
  "name": "${name}",
  "slug": "${slug}",
  "description": "A clear description of how the algorithm works.",
  "timeComplexity": "E.g. O(n log n)",
  "spaceComplexity": "E.g. O(n)",
  "use": "Sample default test inputs for visualization. E.g. '5,1,9,3,7' or '1,2;2,3' depending on the input type.",
  "user": "Instructions telling the user how to format their inputs for the visualizer.",
  "code": {
    "c": "C code implementation snippet",
    "cpp": "C++ code implementation snippet",
    "java": "Java code implementation snippet",
    "python": "Python code implementation snippet",
    "ruby": "Ruby code implementation snippet",
    "javascript": "JavaScript code implementation snippet"
  },
  "execute": "A string containing a JavaScript program that parses the input and visualizes the steps. It must define two functions:\\n1. function parseInput(input) { ... } which parses input string and returns a data structure.\\n2. async function start(input, setOutput) { ... } which loops through the algorithm steps and calls setOutput(\`<div style=\\'padding:10px;\\'>Step details with visual representation...</div>\`) at each step, and uses await new Promise(resolve => setTimeout(resolve, 1000)) to delay."
}
`;

  const tempFilePath = path.join(process.cwd(), `temp_${slug}.json`);
  fs.writeFileSync(tempFilePath, JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  }));

  const url = `${GEMINI_URL}?key=${config.googleApiKey}`;
  const cmd = `curl.exe -s -X POST -H "Content-Type: application/json" -d @${tempFilePath} "${url}"`;

  try {
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 15 * 1024 * 1024 });
    
    // Clean up
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const data: any = JSON.parse(output.trim());
    
    // Check if Gemini API returned an error
    if (data.error) {
      const errStatus = data.error.status || 'UNKNOWN';
      const errMsg = data.error.message || 'No message provided';
      throw new Error(`Google API Error (${errStatus}): ${errMsg}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) {
      throw new Error("Google API returned empty response candidates");
    }

    return JSON.parse(text.trim());
  } catch (err: any) {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw err;
  }
};

const run = async () => {
  try {
    if (!config.googleApiKey) {
      console.error('Error: GOOGLE_API_KEY is not defined in your backend/.env file!');
      process.exit(1);
    }

    console.log('Connecting to database...');
    const mongoConnection = DatabaseConnectionFactory.getConnection('mongo');
    await mongoConnection.connect();

    console.log(`Starting safe generator for ${ALGORITHMS_LIST.length} algorithms...`);

    let generatedCount = 0;

    for (let i = 0; i < ALGORITHMS_LIST.length; i++) {
      const { name, slug } = ALGORITHMS_LIST[i];
      
      // Check if it already exists
      const existing = await Algorithm.findOne({ slug });
      if (existing) {
        console.log(`[${i + 1}/${ALGORITHMS_LIST.length}] Skipping "${name}" (already exists in database)`);
        continue;
      }

      console.log(`[${i + 1}/${ALGORITHMS_LIST.length}] Generating data for "${name}"...`);

      // Up to 3 retries for content generation (ignores rate limits)
      let success = false;
      let attempt = 1;
      while (attempt <= 3) {
        try {
          const algoObj = await generateAlgorithmData(name, slug);
          
          // Upsert to DB
          await Algorithm.updateOne(
            { slug },
            { $set: algoObj },
            { upsert: true }
          );

          console.log(`  -> Successfully saved "${name}" to database!`);
          success = true;
          generatedCount++;
          break;
        } catch (err: any) {
          const isRateLimit = err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'));
          
          if (isRateLimit) {
            console.warn(`  -> Rate limit hit for "${name}". Pausing for 60s...`);
            await sleep(60000);
            // Do not increment attempt counter for rate limit errors so we retry infinitely on quota
            continue;
          } else {
            console.error(`  -> Attempt ${attempt} failed:`, err.message || err);
            attempt++;
            if (attempt <= 3) {
              console.log('  -> Waiting 5 seconds and retrying...');
              await sleep(5000);
            }
          }
        }
      }

      if (!success) {
        console.error(`  -> [Failed] Could not generate "${name}". Skipping.`);
      }

      // Fast pacing delay (1.5 seconds)
      await sleep(1500);
    }

    console.log(`Finished! Generated and saved ${generatedCount} new algorithms in the database (total processed: ${ALGORITHMS_LIST.length}).`);
    process.exit(0);

  } catch (error) {
    console.error('Generation script failed:', error);
    process.exit(1);
  }
};

run();
