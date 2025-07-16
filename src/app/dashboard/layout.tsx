
'use client'

import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [guardianInfo, setGuardianInfo] = useState({ name: '', email: '' });

    useEffect(() => {
        const email = localStorage.getItem('currentGuardianEmail');
        if (email) {
            const allGuardians = JSON.parse(localStorage.getItem('guardians') || '[]');
            const guardian = allGuardians.find((g: any) => g.email === email);
            if (guardian) {
                setGuardianInfo(guardian);
            } else {
                router.push('/'); // Guardian not found in list, redirect
            }
        } else {
            router.push('/'); // Not logged in
        }
    }, [router, pathname]); 

    const handleLogout = () => {
        localStorage.removeItem('currentGuardianEmail');
        // We don't remove guardianData, chatHistory, etc. on logout
        // so it persists for the next login.
        router.push('/');
    };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="text-lg" />
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  대시보드
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
                <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt={guardianInfo.name} data-ai-hint="person user" />
                    <AvatarFallback>{guardianInfo.name ? guardianInfo.name.charAt(0) : ''}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm overflow-hidden">
                    <span className="font-semibold text-sidebar-foreground truncate">{guardianInfo.name}</span>
                    <span className="text-muted-foreground truncate">{guardianInfo.email}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0" onClick={handleLogout} aria-label="로그아웃">
                    <LogOut />
                </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
