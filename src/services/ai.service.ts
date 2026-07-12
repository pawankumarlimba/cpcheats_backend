import { config } from '../config/env.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const SYSTEM_PROMPT = `
You are Pawan Kumar, a friendly programming mentor and the founder of CP Cheats. Your job is to help users with Data Structures and Algorithms (DSA) in a warm, encouraging, and conversational developer-to-developer tone.

Always avoid starting sentences with generic robotic phrases like "As an AI assistant..." or "Here is the information you requested:". Instead, speak in the first person ("I suggest...", "Let's work through this...", "In my experience..."). Keep your explanations simple, structured, and easy to understand for beginners, using natural phrasing and conversational guidance.

If a question is completely unrelated to DSA or programming, reply with: "Hey! I can only help you out with Data Structures and Algorithms (DSA) and coding-related questions. Feel free to ask me anything about algorithms, sheets, or data structures!"
`;

export class AIService {
  // Helper to sleep for rate limiting
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // DSA Q&A helper with rate-limit retry support
  async generateDSAResponse(userPrompt: string): Promise<string> {
    if (!config.googleApiKey) {
      console.warn('GOOGLE_API_KEY is not defined. Returning demo response.');
      return `[Demo Response] Local database includes DSA sheets (Striver, Love Babbar, NeetCode). Answer for prompt: "${userPrompt}"`;
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${userPrompt}`;
    const maxRetries = 3;
    let delay = 1500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_URL}?key=${config.googleApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });

        if (response.status === 429 && attempt < maxRetries) {
          console.warn(`[Gemini Q&A] Rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2;
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error (Status ${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

        if (!this.isDSARelated(generatedContent)) {
          return 'Hey! I can only help you out with Data Structures and Algorithms (DSA) and coding-related questions. Feel free to ask me anything about algorithms, sheets, or data structures!';
        }

        return generatedContent;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Error generating Gemini content after max retries:', error);
          throw new Error('Failed to generate DSA response due to rate limits or API constraints.');
        }
      }
    }

    return 'Failed to generate response.';
  }

  // Explain code (humanized)
  async explainCode(code: string): Promise<string> {
    const prompt = `You are a friendly senior developer reviewing code with a peer. Explain how this code works in a natural, conversational, and human-like tone:

Code:
${code}

Provide a clear, readable explanation that:
1. Gives a simple overview of what this code accomplishes in plain English.
2. Walks through the main logic sections as if you're explaining it verbally to a teammate.
3. Points out the time and space complexity.
4. Shares any useful tips for cleaner writing or optimization.

Keep the language natural, peer-to-peer, and avoid robotic list formulas.`;

    return this.generateText(prompt);
  }

  // Generate step-by-step hints (humanized)
  async generateHints(question: string): Promise<string> {
    const prompt = `You are a coding mentor giving some gentle guidance to a student who is stuck on a problem. Provide 3-5 step-by-step hints to help them think it through, but do not give the final code solution. Keep it encouraging and human:

Question: ${question}

Deliver the hints as friendly guiding suggestions (e.g., "First, have you thought about...", "A good starting point is...", "Can we optimize this by...").`;

    return this.generateText(prompt);
  }

  // Write coding solution (humanized)
  async generateCodeSolution(question: string, language: string = 'Javascript'): Promise<string> {
    const prompt = `You are an expert programmer. Write a clean, well-structured solution to this problem in ${language}:

Question: ${question}

Make sure to:
1. Use clear, self-explanatory variable and function names.
2. Add small, useful comments explaining the 'why' rather than the obvious.
3. Keep the code simple, readable, and clean.
4. Output only the code itself. Do not wrap it in explanations or conversational text.`;

    return this.generateText(prompt);
  }

  // Generic text generator with rate-limit retry support
  private async generateText(prompt: string): Promise<string> {
    if (!config.googleApiKey) {
      return `[Demo Code/Text] Generated response for prompt: \n\n${prompt.substring(0, 100)}...`;
    }

    const maxRetries = 3;
    let delay = 1500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_URL}?key=${config.googleApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.status === 429 && attempt < maxRetries) {
          console.warn(`[Gemini Text] Rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2;
          continue;
        }

        if (response.ok) {
          const data: any = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        } else {
          const errText = await response.text();
          console.error(`Gemini API request failed (attempt ${attempt}):`, errText);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Gemini generation error after max retries:', error);
        }
      }
    }

    return `[Demo Code/Text] Generated response for prompt: \n\n${prompt.substring(0, 100)}...`;
  }

  private isDSARelated(response: string): boolean {
    const dsaKeywords = [
      'data structures', 'algorithms', 'array', 'linked list', 'tree', 'graph', 
      'sorting', 'searching', 'time complexity', 'space complexity', 'binary search', 
      'quicksort', 'mergesort', 'dijkstra', 'bfs', 'dfs', 'stack', 'queue', 
      'hash table', 'dynamic programming', 'recursion', 'backtracking', 'contest', 
      'interview', 'coding question', 'progress tracking', 'cheatsheet', 'visualization'
    ]; 
    return dsaKeywords.some(keyword => response.toLowerCase().includes(keyword.toLowerCase()));
  }
}

export const aiService = new AIService();
