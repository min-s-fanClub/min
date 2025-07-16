
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  BarChart2,
  Copy,
  MessageSquare,
  Settings,
  Bell,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { SummarizeConversationInput, SummarizeConversationOutput, DetectRiskInput, DetectRiskOutput, GeneratePersonaPromptInput, GeneratePersonaPromptOutput } from '@/ai/types';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { Textarea } from './ui/textarea';

const chartConfig = {
  joy: { label: '기쁨', color: 'hsl(var(--chart-2))' },
  sadness: { label: '슬픔', color: 'hsl(var(--chart-1))' },
  neutral: { label: '중립', color: 'hsl(var(--muted))' },
};

interface StoredConversation {
  date: string;
  log: string;
}

interface ProcessedConversation {
  id: string; // ISO date string, used as a unique key
  date: string; // Formatted date string for display
  summary: string;
  risk: '낮음' | '높음';
  alertMessage?: string;
  emotions: { joy: number, sadness: number, neutral: number };
}

interface EmotionChartEntry {
  date: string;
  joy: number;
  sadness: number;
  neutral: number;
}

const emotionKeywords = {
  joy: ['행복', '즐거움', '기쁨', '신남', '좋아'],
  sadness: ['슬픔', '외로움', '우울', '힘듦', '아픔'],
};

function getEmotionCounts(summary: string) {
    const joyCount = emotionKeywords.joy.filter(kw => summary.includes(kw)).length;
    const sadnessCount = emotionKeywords.sadness.filter(kw => summary.includes(kw)).length;
    const neutralCount = (joyCount === 0 && sadnessCount === 0) ? 1 : 0;
    return { joy: joyCount, sadness: sadnessCount, neutral: neutralCount };
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification");
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function showNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// Stores data like { "email@example.com": { connectionCode: "123-456", personaPrompt: "..." } }
const GUARDIAN_DATA_KEY = 'guardianData';

interface GuardianDashboardProps {
    summarizeConversationAction: (input: SummarizeConversationInput) => Promise<SummarizeConversationOutput>;
    detectRiskAction: (input: DetectRiskInput) => Promise<DetectRiskOutput>;
    generatePersonaPromptAction: (input: GeneratePersonaPromptInput) => Promise<GeneratePersonaPromptOutput>;
}

export function GuardianDashboard({ 
    summarizeConversationAction, 
    detectRiskAction, 
    generatePersonaPromptAction 
}: GuardianDashboardProps) {
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [emotionChartData, setEmotionChartData] = useState<EmotionChartEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionCode, setConnectionCode] = useState('');
  const [personaName, setPersonaName] = useState('');
  const [isSeniorConnected, setIsSeniorConnected] = useState(false);
  const [guardianEmail, setGuardianEmail] = useState<string | null>(null);
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [isPersonaGenerating, setIsPersonaGenerating] = useState(false);
  const [inactivityAlert, setInactivityAlert] = useState(false);
  const { toast } = useToast();

  const getGuardianData = useCallback((email: string) => {
    const dataStr = localStorage.getItem(GUARDIAN_DATA_KEY);
    const allData = dataStr ? JSON.parse(dataStr) : {};
    return allData[email] || {};
  }, []);

  const updateGuardianData = useCallback((email: string, dataToUpdate: object) => {
    const dataStr = localStorage.getItem(GUARDIAN_DATA_KEY);
    let allData = dataStr ? JSON.parse(dataStr) : {};
    allData[email] = { ...allData[email], ...dataToUpdate };
    localStorage.setItem(GUARDIAN_DATA_KEY, JSON.stringify(allData));
    return allData[email];
  }, []);

  const processConversations = useCallback(async () => {
    setIsLoading(true);
    setInactivityAlert(false);

    try {
        const rawChatHistory: StoredConversation[] = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        if (rawChatHistory.length > 0) {
          const lastConversation = rawChatHistory.reduce((latest, current) => {
            return new Date(latest.date) > new Date(current.date) ? latest : current;
          });
          const lastDate = new Date(lastConversation.date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 3) {
            setInactivityAlert(true);
          }
        }

        if (rawChatHistory.length === 0) {
          setIsLoading(false);
          return;
        }
      
        const results: ProcessedConversation[] = [];
        for (const convo of rawChatHistory) {
            try {
                const [summaryResult, riskResult] = await Promise.all([
                    summarizeConversationAction({ conversationLog: convo.log }),
                    detectRiskAction({ conversationLog: convo.log }),
                ]);

                const riskLevel = riskResult.isCriticalSituation ? '높음' : '낮음';
                const emotions = getEmotionCounts(summaryResult.summary);

                if (riskResult.isCriticalSituation) {
                    showNotification('긴급 위험 알림', riskResult.alertMessage);
                }

                results.push({
                    id: convo.date,
                    date: new Date(convo.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
                    summary: summaryResult.summary,
                    risk: riskLevel,
                    alertMessage: riskResult.isCriticalSituation ? riskResult.alertMessage : undefined,
                    emotions: emotions
                });

                // Add a delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500)); 

            } catch (error) {
                console.error(`Failed to process conversation from ${convo.date}:`, error);
                // Continue to next conversation even if one fails
            }
        }
      
        results.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        
        const dailyEmotions: Record<string, { joy: number, sadness: number, neutral: number }> = {};
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (const convo of results) {
            if (new Date(convo.id) < sevenDaysAgo) continue;
            
            const dateKey = new Date(convo.id).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
            if (!dailyEmotions[dateKey]) {
                dailyEmotions[dateKey] = { joy: 0, sadness: 0, neutral: 0 };
            }
            dailyEmotions[dateKey].joy += convo.emotions.joy;
            dailyEmotions[dateKey].sadness += convo.emotions.sadness;
            dailyEmotions[dateKey].neutral += convo.emotions.neutral;
        }
        
        const chartData: EmotionChartEntry[] = Object.entries(dailyEmotions)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => {
                const dateA = new Date(a.date.includes('년') ? a.date : `${new Date().getFullYear()}년 ${a.date.replace('월', '월 ')}`).getTime();
                const dateB = new Date(b.date.includes('년') ? b.date : `${new Date().getFullYear()}년 ${b.date.replace('월', '월 ')}`).getTime();
                return dateA - dateB;
            });

        setEmotionChartData(chartData);
        setConversations(results);

    } catch (error) {
      console.error("Error processing conversations:", error);
      toast({
        variant: 'destructive',
        title: '분석 오류',
        description: '대화 내용 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, summarizeConversationAction, detectRiskAction]);


  useEffect(() => {
    requestNotificationPermission();
    const currentGuardianEmail = localStorage.getItem('currentGuardianEmail');
    setGuardianEmail(currentGuardianEmail);

    if (currentGuardianEmail) {
      let guardianData = getGuardianData(currentGuardianEmail);

      if (!guardianData.connectionCode) {
        guardianData = updateGuardianData(currentGuardianEmail, {
          connectionCode: `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`
        });
      }
      setConnectionCode(guardianData.connectionCode);
      setPersonaName(guardianData.personaName || '');

      const linkedGuardianEmail = localStorage.getItem('linkedGuardianEmail');
      const connected = linkedGuardianEmail === currentGuardianEmail;
      setIsSeniorConnected(connected);
      
      processConversations();
    } else {
        setIsLoading(false);
    }
  }, [getGuardianData, updateGuardianData, processConversations]);


  const handleCopyCode = () => {
    navigator.clipboard.writeText(connectionCode);
    toast({
      title: "연결 코드 복사됨",
      description: "코드가 클립보드에 복사되었습니다.",
    });
  };

  const handlePersonaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!guardianEmail) return;

    setIsPersonaGenerating(true);
    const formData = new FormData(e.currentTarget);
    const inputData = {
        name: formData.get('name') as string,
        age: parseInt(formData.get('age') as string, 10),
        relationship: formData.get('relationship') as string,
        interests: formData.get('interests') as string,
        personality: formData.get('personality') as string,
        communicationStyle: formData.get('communicationStyle') as string,
    };
    
    try {
        const result = await generatePersonaPromptAction(inputData);
        updateGuardianData(guardianEmail, { 
            personaPrompt: result.personaPrompt, 
            personaName: inputData.name 
        });
        setPersonaName(inputData.name);
        toast({
            title: '페르소나 생성 완료',
            description: `${inputData.name} 페르소나가 생성되어 어르신 기기에 적용됩니다.`,
        });
        setIsPersonaDialogOpen(false);
    } catch (error) {
        console.error("Error generating persona:", error);
        toast({
            variant: 'destructive',
            title: '페르소나 생성 실패',
            description: 'AI 페르소나 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        });
    } finally {
        setIsPersonaGenerating(false);
    }
  };

  const highRiskAlerts = conversations.filter(c => c.risk === '높음');

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">대시보드</h1>
          <p className="text-muted-foreground">안녕하세요! 부모님의 최근 소식입니다.</p>
        </div>
        <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    AI 페르소나 설정
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>AI 페르소나 설정</DialogTitle>
                    <DialogDescription>
                        어르신과 대화할 AI의 성격과 역할을 설정합니다. 현재 설정된 이름: {personaName || '기본값'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePersonaSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input id="name" name="name" required placeholder="예: 사랑하는 손녀, 김철수" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">나이</Label>
                        <Input id="age" name="age" type="number" required placeholder="예: 25" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="relationship">관계</Label>
                        <Input id="relationship" name="relationship" required placeholder="예: 손녀, 아들, 친구" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="interests">관심사</Label>
                        <Textarea id="interests" name="interests" required placeholder="예: 뜨개질, 여행, 옛날 노래 듣기" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="personality">성격</Label>
                        <Textarea id="personality" name="personality" required placeholder="예: 활기차고 긍정적, 차분하고 다정함" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="communicationStyle">소통 스타일</Label>
                        <Input id="communicationStyle" name="communicationStyle" required placeholder="예: 존댓말을 사용하지만 친근하게, 반말로 편안하게" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPersonaGenerating}>
                            {isPersonaGenerating ? '생성 중...' : '페르소나 생성'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>어르신과 연결하기</CardTitle>
          <CardDescription>
            어르신 기기에서 아래 코드를 입력하여 계정을 연결하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
                <Label htmlFor="connection-code" className="sr-only">
                    연결 코드
                </Label>
                <Input
                    id="connection-code"
                    value={connectionCode}
                    readOnly
                    className="text-lg font-mono tracking-widest"
                />
            </div>
            <Button onClick={handleCopyCode} variant="outline" size="icon" aria-label="코드 복사">
                <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isSeniorConnected && (
         <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>연결 대기 중</AlertTitle>
            <AlertDescription>
                어르신 기기가 연결되기를 기다리고 있습니다. 어르신 기기에 연결 코드를 입력하면 대화 내용 분석이 시작됩니다.
            </AlertDescription>
        </Alert>
      )}

      {inactivityAlert && (
        <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertTitle>장기 미사용 알림</AlertTitle>
            <AlertDescription>
                어르신이 3일 이상 앱을 사용하지 않았습니다. 안부 연락을 해보시는 건 어떨까요?
            </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">
            <BarChart2 className="mr-2 h-4 w-4" /> 개요
        </TabsTrigger>
        <TabsTrigger value="conversations">
            <MessageSquare className="mr-2 h-4 w-4" /> 대화 기록
        </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>위험 알림</CardTitle>
            <CardDescription>
                잠재적 위험이나 특이 행동에 대한 즉각적인 알림입니다.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <Skeleton className="h-20 w-full" />
            ) : highRiskAlerts.length > 0 ? (
                highRiskAlerts.map(alert => (
                <Alert variant="destructive" key={alert.id} className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>높은 위험 감지됨 ({alert.date})</AlertTitle>
                    <AlertDescription>
                    {alert.alertMessage}
                    </AlertDescription>
                </Alert>
                ))
            ) : (
                <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>안전</AlertTitle>
                <AlertDescription>
                    최근 대화에서 감지된 위험이 없습니다.
                </AlertDescription>
                </Alert>
            )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>주간 감정 요약</CardTitle>
            <CardDescription>
                대화를 기반으로 한 감정 상태 개요입니다.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? <Skeleton className="min-h-[200px] md:min-h-[250px] w-full" /> : 
                emotionChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] md:min-h-[250px] w-full">
                    <BarChart accessibilityLayer data={emotionChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        stroke="#888888"
                        fontSize={12}
                    />
                    <YAxis allowDecimals={false} stroke="#888888" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="joy" stackId="a" fill="var(--color-joy)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sadness" stackId="a" fill="var(--color-sadness)" />
                    <Bar dataKey="neutral" stackId="a" fill="var(--color-neutral)" />
                    </BarChart>
                </ChartContainer>
                ) : (
                <p className="text-muted-foreground text-center py-8">감정 데이터를 표시할 대화 기록이 충분하지 않습니다.</p>
                )
            }
            </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="conversations" className="mt-4 md:mt-6">
        <Card>
            <CardHeader>
            <CardTitle>대화 기록</CardTitle>
            <CardDescription>
                최근 대화 요약을 검토합니다.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : conversations.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="hidden md:table-cell">날짜</TableHead>
                    <TableHead>요약</TableHead>
                    <TableHead className="text-right">위험</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {conversations.map((convo) => (
                    <TableRow key={convo.id}>
                        <TableCell className="hidden md:table-cell">{convo.date}</TableCell>
                        <TableCell>
                        <div className="md:hidden text-xs text-muted-foreground">{convo.date}</div>
                        {convo.summary}
                        </TableCell>
                        <TableCell className="text-right">
                        <Badge
                            variant={
                            convo.risk === '높음'
                                ? 'destructive'
                                : 'secondary'
                            }
                        >
                            {convo.risk}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <p className="text-muted-foreground text-center py-8">표시할 대화 기록이 없습니다.</p>
            )}
            </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
