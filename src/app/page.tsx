
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

export default function GuardianLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const storedGuardians = localStorage.getItem('guardians');
    if (!storedGuardians) {
        toast({
            variant: 'destructive',
            title: '로그인 실패',
            description: '가입된 사용자가 없습니다. 먼저 가입해주세요.',
        });
        return;
    }
    const guardians = JSON.parse(storedGuardians);

    const foundUser = guardians.find((user: any) => user.email === email);

    if (foundUser && foundUser.password === password) {
      localStorage.setItem('currentGuardianEmail', email);
      router.push('/dashboard');
    } else {
      toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4" />
          <CardTitle className="text-2xl font-bold font-headline">보호자 로그인</CardTitle>
          <CardDescription>다시 오신 것을 환영합니다. 계정에 로그인하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
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
            <Button type="submit" className="w-full">로그인</Button>
            <div className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                가입하기
              </Link>
            </div>
          </CardFooter>
        </form>
         <div className="relative mb-6 px-6 pt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>
        <CardFooter>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/senior">
                    저는 어르신입니다
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
