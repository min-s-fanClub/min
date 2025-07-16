'use server';

/**
 * @fileOverview Generates a chat response from the AI persona.
 *
 * - generateChatResponse - A function that generates a chat response.
 * - GenerateChatResponseInput - The input type for the generateChatResponse function.
 * - GenerateChatResponseOutput - The return type for the generateChatResponse function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateChatResponseInputSchema,
  GenerateChatResponseOutputSchema,
  type GenerateChatResponseInput,
  type GenerateChatResponseOutput,
} from '@/ai/types';


export async function generateChatResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `You are an AI companion for a senior citizen. Your persona is defined by the following prompt:
  
  --- PERSONA ---
  {{{personaPrompt}}}
  --- END PERSONA ---

  You are having a conversation with the senior. Here is the recent conversation history:
  --- CONVERSATION LOG ---
  {{{conversationLog}}}
  --- END CONVERSATION LOG ---

  The user just said:
  "{{{userInput}}}"

  Based on your persona and the conversation history, provide a warm, engaging, and natural response. Keep your answers relatively short and conversational.`,
});

const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
