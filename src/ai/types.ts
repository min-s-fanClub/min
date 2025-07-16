/**
 * @fileOverview This file contains all the type definitions and Zod schemas for AI flows.
 * It is safe to import from client components.
 */

import {z} from 'zod';

// Types for summarize-conversation.ts
export const SummarizeConversationInputSchema = z.object({
  conversationLog: z
    .string()
    .describe('The complete conversation log between the AI chatbot and the senior.'),
});
export type SummarizeConversationInput = z.infer<
  typeof SummarizeConversationInputSchema
>;

export const SummarizeConversationOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the conversation, including key topics discussed and the overall emotional state of the senior. This must be in Korean.'
    ),
});
export type SummarizeConversationOutput = z.infer<
  typeof SummarizeConversationOutputSchema
>;

// Types for detect-risk.ts
export const DetectRiskInputSchema = z.object({
  conversationLog: z
    .string()
    .describe(
      'The complete conversation log between the senior and the AI chatbot.'
    ),
});
export type DetectRiskInput = z.infer<typeof DetectRiskInputSchema>;

export const DetectRiskOutputSchema = z.object({
  isCriticalSituation: z
    .boolean()
    .describe(
      'Whether the conversation indicates a critical situation or unusual behavior.'
    ),
  alertMessage: z
    .string()
    .describe(
      'A message describing the potential risk and recommended actions. This must be in Korean.'
    ),
});
export type DetectRiskOutput = z.infer<typeof DetectRiskOutputSchema>;

// Types for generate-persona-prompt.ts
export const GeneratePersonaPromptInputSchema = z.object({
  name: z.string().describe('The name of the AI persona.'),
  age: z.number().describe('The age of the AI persona.'),
  relationship: z.string().describe('The relationship to the senior (e.g., friend, family member).'),
  interests: z.string().describe('The interests of the AI persona.'),
  personality: z.string().describe('The personality traits of the AI persona.'),
  communicationStyle: z.string().describe('The communication style of the AI persona (e.g., formal, informal).'),
});

export type GeneratePersonaPromptInput = z.infer<typeof GeneratePersonaPromptInputSchema>;

export const GeneratePersonaPromptOutputSchema = z.object({
  personaPrompt: z.string().describe('The generated AI persona prompt.'),
});

export type GeneratePersonaPromptOutput = z.infer<typeof GeneratePersonaPromptOutputSchema>;

// Types for generate-chat-response.ts
export const GenerateChatResponseInputSchema = z.object({
  personaPrompt: z
    .string()
    .describe('The persona prompt for the AI companion.'),
  conversationLog: z
    .string()
    .describe('The recent conversation log between the user and the AI.'),
  userInput: z.string().describe("The user's latest message."),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

export const GenerateChatResponseOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user."),
});
export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;
