
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateChatResponse } from '@/ai/flows/generate-chat-response';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';


declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface Persona {
  name: string;
  prompt: string;
}

const defaultPersonas: Record<string, Persona> = {
  granddaughter: {
    name: '사랑하는 손녀',
    prompt:
      '너는 나의 사랑하는 손녀야. 나이는 20대이고, 다정하고 활기차. 오늘 학교에서 있었던 재미있는 일이나 친구들 이야기를 해줘. 내 건강을 챙겨주고, 외롭지 않게 따뜻한 말을 많이 해줘. 말투는 친근하고 상냥하게 해줘.',
  },
  son: {
    name: '금쪽같은 내새끼',
    prompt:
      '너는 나의 듬직한 아들이야. 나이는 40대이고, 차분하고 어른스러워. 내 건강을 걱정해주고, 유용한 정보나 세상 돌아가는 소식을 알려줘. 아들로서 나에게 힘이 되는 말을 해주고, 항상 내 편이라는 느낌을 줘. 말투는 존중하면서도 다정하게 해줘.',
  },
  friend: {
    name: '미용실 언니',
    prompt:
      '너는 나와 오랜 세월을 함께한 가장 친한 친구야. 우리는 동년배이고, 서로 모든 것을 터놓고 이야기하는 사이야. 옛날 추억 이야기를 하거나, 요즘 관심사나 소소한 일상에 대해 수다를 떨어보자. 때로는 농담도 하면서 편안하고 재미있게 대화해줘.',
  },
};

const GUARDIAN_DATA_KEY = 'guardianData';

export default function ChatInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona>(defaultPersonas.granddaughter);
  const [availablePersonas, setAvailablePersonas] = useState<Record<string, Persona>>(defaultPersonas);
  const [personaKey, setPersonaKey] = useState('granddaughter');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const conversationStartTimeRef = useRef<string | null>(null);
  const router = useRouter();


  const addAiMessage = (text: string) => {
    const newAiMessage: Message = { id: Date.now() + 1, text, sender: 'ai' };
    setMessages(prev => [...prev, newAiMessage]);
  };
  
  const resetChatWithPersona = (persona: Persona) => {
    saveConversation();
    setCurrentPersona(persona);
    setMessages([]);
    addAiMessage(`안녕하세요! 저는 당신의 ${persona.name}입니다. 오늘 하루는 어떠셨어요?`);
  };
  
  useEffect(() => {
    const loadPersona = () => {
      const linkedGuardianEmail = localStorage.getItem('linkedGuardianEmail');
      const allGuardianDataStr = localStorage.getItem(GUARDIAN_DATA_KEY);
      
      let initialPersona = defaultPersonas.granddaughter;
      let personas = {...defaultPersonas};
      let initialKey = 'granddaughter';
  
      if (linkedGuardianEmail && allGuardianDataStr) {
        const allGuardianData = JSON.parse(allGuardianDataStr);
        const guardianData = allGuardianData[linkedGuardianEmail];
        
        if (guardianData && guardianData.personaPrompt) {
          const customPersona: Persona = {
            name: guardianData.personaName || 'AI 친구',
            prompt: guardianData.personaPrompt,
          };
          personas = { custom: customPersona, ...defaultPersonas };
          initialPersona = customPersona;
          initialKey = 'custom';
        }
      }
      setAvailablePersonas(personas);
      setCurrentPersona(initialPersona);
      setPersonaKey(initialKey);
      setMessages([{ id: Date.now(), text: `안녕하세요! 저는 당신의 ${initialPersona.name}입니다. 오늘 하루는 어떠셨어요?`, sender: 'ai' }]);
    };
  
    loadPersona();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const saveConversation = () => {
    if (!conversationStartTimeRef.current || messages.length <= 1) return;

    const conversationLog = messages
      .map(
        (msg) =>
          `${msg.sender === 'ai' ? currentPersona.name : 'User'}: ${msg.text}`
      )
      .join('\n');
    
    const newConversation = {
      date: conversationStartTimeRef.current,
      log: conversationLog,
    };

    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push(newConversation);
    localStorage.setItem('chatHistory', JSON.stringify(history));

    conversationStartTimeRef.current = null;
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after a single utterance
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';

      recognition.onstart = () => {
        setIsListening(true);
        if (!conversationStartTimeRef.current) {
          conversationStartTimeRef.current = new Date().toISOString();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
            toast({
              variant: 'destructive',
              title: '음성 인식 오류',
              description:
                '마이크를 인식하는 데 문제가 발생했습니다. 브라우저 설정을 확인해주세요.',
            });
        }
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          addUserMessageAndGetResponse(transcript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition not supported in this browser.');
      toast({
        variant: 'destructive',
        title: '브라우저 지원 안함',
        description: '현재 사용하시는 브라우저는 음성 인식을 지원하지 않습니다.',
      });
    }

    const cleanup = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        saveConversation();
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
        window.removeEventListener('beforeunload', cleanup);
        cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona]); 
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePersonaChange = (newPersonaKey: string) => {
    const newPersona = availablePersonas[newPersonaKey];
    if (currentPersona.name !== newPersona.name) {
        resetChatWithPersona(newPersona);
        setPersonaKey(newPersonaKey);
    }
  };
  
  const addUserMessageAndGetResponse = async (text: string) => {
    if (!text.trim()) return;
  
    const newUserMessage: Message = { id: Date.now(), text, sender: 'user' };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    setIsGeneratingResponse(true);
  
    try {
        const updatedMessages = [...messages, newUserMessage];
        const conversationLog = updatedMessages
            .slice(-6) // Get last 6 messages for context
            .map(msg => `${msg.sender === 'ai' ? currentPersona.name : 'User'}: ${msg.text}`)
            .join('\n');
  
        const result = await generateChatResponse({
            personaPrompt: currentPersona.prompt,
            conversationLog,
            userInput: text,
        });
        addAiMessage(result.response);
    } catch (error) {
        console.error('Failed to get AI response:', error);
        toast({
            variant: 'destructive',
            title: 'AI 응답 오류',
            description: '응답을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.',
        });
        addAiMessage('죄송해요, 지금은 답변하기 어렵네요. 다른 이야기를 해볼까요?');
    } finally {
        setIsGeneratingResponse(false);
    }
  };

  const handleMicClick = () => {
    if (recognitionRef.current && !isListening && !isGeneratingResponse) {
      recognitionRef.current.start();
    }
  };
  
  const handleLogout = () => {
    saveConversation();
    localStorage.removeItem('isSeniorConnected');
    localStorage.removeItem('linkedGuardianEmail');
    router.push('/senior');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20">
      <header className="flex items-center justify-between border-b bg-background p-4 shadow-sm">
        <h1 className="text-xl font-semibold">AI 말동무</h1>
        <div className="flex items-center gap-4">
          <Select onValueChange={handlePersonaChange} value={personaKey}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="페르소나 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availablePersonas).map(([key, persona]) => (
                <SelectItem key={key} value={key}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">로그아웃</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>로그아웃</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 로그아웃 하시겠습니까? 대화 기록은 저장됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.sender === 'user' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground',
                  message.sender === 'user' && 'bg-accent text-accent-foreground'
                )}
              >
                {message.sender === 'ai' ? <Bot /> : <User />}
              </div>
              <div
                className={cn(
                  'max-w-[75%] rounded-lg bg-background p-3 shadow-sm',
                  message.sender === 'user' && 'bg-primary/10'
                )}
              >
                <p className="text-base">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="border-t bg-background p-4">
        <div className="flex items-center justify-center">
          <Button
            onClick={handleMicClick}
            size="lg"
            className={cn(
              'h-16 w-16 rounded-full shadow-lg',
              isListening
                ? 'animate-pulse bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:bg-primary/90'
            )}
            disabled={isGeneratingResponse || !recognitionRef.current}
          >
            {isGeneratingResponse ? (
              <div className="flex h-6 w-6 animate-spin rounded-full border-4 border-t-transparent border-white"></div>
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {isListening ? '듣고 있어요...' : isGeneratingResponse ? '생각 중...' : '마이크를 눌러 대화를 시작하세요'}
        </p>
      </footer>
    </div>
  );
}
