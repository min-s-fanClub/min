
'use server';

/**
 * @fileOverview Summarizes conversation logs to provide caregivers with a quick understanding of key topics and emotional state.
 *
 * - summarizeConversation - A function that summarizes conversation logs.
 * - SummarizeConversationInput - The input type for the summarizeConversation function.
 * - SummarizeConversationOutput - The return type for the summarizeConversation function.
 */

import {ai} from '@/ai/genkit';
import {
  SummarizeConversationInputSchema,
  SummarizeConversationOutputSchema,
  type SummarizeConversationInput,
  type SummarizeConversationOutput
} from '@/ai/types';


export async function summarizeConversation(
  input: SummarizeConversationInput
): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {schema: SummarizeConversationInputSchema},
  output: {schema: SummarizeConversationOutputSchema},
  prompt: `당신은 대화 요약 전문가입니다. 주어진 대화 로그의 핵심 내용과 감정 상태를 반드시 한국어로만, 그리고 존댓말로 요약해주세요. 다른 언어는 절대 사용하지 마세요.

대화 로그:
{{{conversationLog}}}`,
});

const summarizeConversationFlow = ai.defineFlow(
  {
    name: 'summarizeConversationFlow',
    inputSchema: SummarizeConversationInputSchema,
    outputSchema: SummarizeConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
