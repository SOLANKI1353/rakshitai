
"use client";

import {
  Bot,
  MessageSquare,
  LogOut,
  Settings,
  Languages,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTheme } from "next-themes";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "./ui/label";

function ThemeToggleButtons() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="grid grid-cols-3 gap-2">
            <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex flex-col h-auto p-4 gap-1"
            >
                <Sun className="w-6 h-6" />
                Light
            </Button>
            <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex flex-col h-auto p-4 gap-1"

            >
                <Moon className="w-6 h-6" />
                Dark
            </Button>
            <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex flex-col h-auto p-4 gap-1"
            >
                <Monitor className="w-6 h-6" />
                System
            </Button>
        </div>
    )
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-sm h-10">
            <Avatar className="h-8 w-8 border-2 border-primary/50">
              <AvatarFallback className="bg-primary/10">R</AvatarFallback>
            </Avatar>
            <span className="truncate">Rakshit</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Rakshit</p>
              <p className="text-xs leading-none text-muted-foreground">
                rakshit@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
                Customize the application's appearance and other settings.
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Theme</Label>
                <ThemeToggleButtons />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


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
        <Sidebar collapsible="none" side="left" variant="sidebar" className="border-r-0 md:border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Bot className="size-7 text-primary" />
              <h1 className="text-xl font-bold">Rakshit.AI</h1>
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
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto p-2 space-y-1">
             <Select value={speechLang} onValueChange={setSpeechLang}>
                    <SelectTrigger className="w-full h-10 text-sm bg-card border-border">
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
            <UserMenu onLogout={handleLogout} />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <main className="h-screen max-h-screen overflow-y-auto">
              <ChatPanel speechLang={speechLang} />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
