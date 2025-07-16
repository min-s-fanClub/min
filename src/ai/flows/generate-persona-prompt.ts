
'use server';

/**
 * @fileOverview A flow to generate an AI persona prompt based on caregiver input.
 *
 * - generatePersonaPrompt - A function that generates the AI persona prompt.
 * - GeneratePersonaPromptInput - The input type for the generatePersonaPrompt function.
 * - GeneratePersonaPromptOutput - The return type for the generatePersonaPrompt function.
 */

import {ai} from '@/ai/genkit';
import {
  GeneratePersonaPromptInputSchema,
  GeneratePersonaPromptOutputSchema,
  type GeneratePersonaPromptInput,
  type GeneratePersonaPromptOutput
} from '@/ai/types';


export async function generatePersonaPrompt(input: GeneratePersonaPromptInput): Promise<GeneratePersonaPromptOutput> {
  return generatePersonaPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonaPromptPrompt',
  input: {schema: GeneratePersonaPromptInputSchema},
  output: {schema: GeneratePersonaPromptOutputSchema},
  prompt: `You are an AI persona generator. Based on the caregiver's input, generate an AI persona prompt that can be used to configure a personalized AI companion for a senior citizen.

  Name: {{{name}}}
  Age: {{{age}}}
  Relationship: {{{relationship}}}
  Interests: {{{interests}}}
  Personality: {{{personality}}}
  Communication Style: {{{communicationStyle}}}

  The AI persona prompt should be detailed and specific, capturing the essence of the desired persona. The generated prompt should be suitable for use in a large language model to create a realistic and engaging AI companion for the senior citizen.

  AI Persona Prompt:`,
});

const generatePersonaPromptFlow = ai.defineFlow(
  {
    name: 'generatePersonaPromptFlow',
    inputSchema: GeneratePersonaPromptInputSchema,
    outputSchema: GeneratePersonaPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
