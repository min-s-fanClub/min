
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

export default function GuardianSignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const guardians = JSON.parse(localStorage.getItem('guardians') || '[]');
    const existingUser = guardians.find((user: any) => user.email === email);

    if (existingUser) {
      toast({
        variant: 'destructive',
        title: '가입 실패',
        description: '이미 사용 중인 이메일입니다.',
      });
      return;
    }

    const newGuardian = { name, email, password };
    guardians.push(newGuardian);
    
    localStorage.setItem('guardians', JSON.stringify(guardians));
    localStorage.setItem('currentGuardianEmail', email); // Set current user on signup
    
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4" />
          <CardTitle className="text-2xl font-bold font-headline">보호자 계정 생성</CardTitle>
          <CardDescription>시작하려면 아래에 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">성함</Label>
              <Input id="name" name="name" type="text" placeholder="홍길동" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full">계정 생성</Button>
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
