import { GuardianDashboard } from "@/components/GuardianDashboard";
import { summarizeConversation } from '@/ai/flows/summarize-conversation';
import { detectRisk } from '@/ai/flows/detect-risk';
import { generatePersonaPrompt } from '@/ai/flows/generate-persona-prompt';

export default function DashboardPage() {
  return (
    <GuardianDashboard
      summarizeConversationAction={summarizeConversation}
      detectRiskAction={detectRisk}
      generatePersonaPromptAction={generatePersonaPrompt}
    />
  );
}
