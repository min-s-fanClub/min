
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

export default function SeniorLinkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = React.useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const allGuardianDataStr = localStorage.getItem('guardianData');
    if (allGuardianDataStr) {
        const allGuardianData = JSON.parse(allGuardianDataStr);
        // Find the email (key) of the guardian whose connectionCode matches the input code
        const foundGuardianEmail = Object.keys(allGuardianData).find(
            (email) => allGuardianData[email].connectionCode === code
        );

        if (foundGuardianEmail) {
            localStorage.setItem('isSeniorConnected', 'true');
            localStorage.setItem('linkedGuardianEmail', foundGuardianEmail); // This was the missing critical part
            router.push('/senior/chat');
        } else {
            toast({
                variant: 'destructive',
                title: '연결 실패',
                description: '보호자 코드가 올바르지 않습니다. 다시 확인해주세요.',
            });
        }
    } else {
       toast({
        variant: 'destructive',
        title: '연결 실패',
        description: '연결할 보호자 정보가 없습니다. 보호자가 먼저 로그인해야 합니다.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-accent p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader className="p-4 md:p-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HeartHandshake className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline">보호자와 연결하기</CardTitle>
          <CardDescription className="text-md md:text-lg">보호자 앱의 코드를 입력하여 시작하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleConnect}>
          <CardContent className="space-y-6 px-4 md:px-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="code" className="text-base">보호자 코드</Label>
              <Input
                id="code"
                type="text"
                placeholder="예: 123-456"
                className="h-14 text-center text-2xl tracking-widest"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 w-full text-xl">
              연결하기
            </Button>
          </CardContent>
        </form>
        <CardContent className="p-4 md:p-6">
            <div className="text-center text-sm text-muted-foreground mt-4">
              보호자이신가요?{' '}
              <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                여기서 로그인하세요
              </Link>
            </div>
        </CardContent>
      </Card>
      <footer className="mt-8">
        <Logo />
      </footer>
    </div>
  );
}
