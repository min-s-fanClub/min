import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/detect-risk.ts';
import '@/ai/flows/generate-persona-prompt.ts';
import '@/ai/flows/generate-chat-response.ts';
