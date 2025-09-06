"use client";

import {
  Bot,
  MessageSquare,
  LogOut,
  Settings,
  Languages,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
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
import { ChatPanel } from "@/components/chat-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [speechLang, setSpeechLang] = React.useState("en-US");

  const handleLogout = () => {
    localStorage.removeItem("rakshit-ai-token");
    router.push("/login");
  };

  return (
    <div className="bg-background min-h-screen">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Bot className="size-7 text-primary" />
              <h1 className="text-xl font-bold">RakshitAI</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <MessageSquare />
                  <span>Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href="/hr-dashboard">
                  <SidebarMenuButton>
                    <LayoutDashboard />
                    <span>HR Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto" />
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10 h-[60px]">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden"/>
                <h1 className="text-lg font-bold md:hidden">RakshitAI</h1>
              </div>
              <div className="flex items-center gap-4">
                <Select value={speechLang} onValueChange={setSpeechLang}>
                    <SelectTrigger className="w-[130px] h-9 text-xs bg-card border-border">
                        <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Language" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="hi-IN">Hindi</SelectItem>
                        <SelectItem value="gu-IN">Gujarati</SelectItem>
                    </SelectContent>
                </Select>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/50">
                          <AvatarFallback className="bg-primary/10">R</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Rakshit</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          rakshit@example.com
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </header>
          <main className="h-[calc(100vh-60px)] overflow-y-auto p-4 md:p-6 lg:p-8">
              <ChatPanel speechLang={speechLang} />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

    