import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: '', //API 직접 삽입!
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
