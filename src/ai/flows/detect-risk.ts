
// src/ai/flows/detect-risk.ts
'use server';
/**
 * @fileOverview Detects critical situations or unusual behavior from the senior's conversation with the AI chatbot.
 *
 * - detectRisk - A function that initiates the risk detection process.
 * - DetectRiskInput - The input type for the detectRisk function.
 * - DetectRiskOutput - The return type for the detectRisk function.
 */

import {ai} from '@/ai/genkit';
import {
  DetectRiskInputSchema,
  DetectRiskOutputSchema,
  type DetectRiskInput,
  type DetectRiskOutput,
} from '@/ai/types';


export async function detectRisk(input: DetectRiskInput): Promise<DetectRiskOutput> {
  return detectRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectRiskPrompt',
  input: {schema: DetectRiskInputSchema},
  output: {schema: DetectRiskOutputSchema},
  prompt: `당신은 대화에서 위험을 감지하는 AI입니다. 주어진 대화에서 자해, 건강 문제, 사기 등 비정상적인 징후를 찾아내세요.
isCriticalSituation 필드는 위험 감지 시 true로 설정하고, 위험이 없으면 false로 설정하세요.
alertMessage 필드는 반드시 한국어로, 그리고 존댓말로 작성해야 합니다. 위험이 없다면 alertMessage는 '위험이 감지되지 않았습니다.'로 설정하세요.

대화 로그: {{{conversationLog}}}
`,
});

const detectRiskFlow = ai.defineFlow(
  {
    name: 'detectRiskFlow',
    inputSchema: DetectRiskInputSchema,
    outputSchema: DetectRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
