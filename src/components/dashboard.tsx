
"use client";

import {
  Bot,
  MessageSquare,
  LogOut,
  Settings,
  Sun,
  Moon,
  Monitor,
  Trash2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatPanel, Message } from "@/components/chat-panel";
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
import { ScrollArea } from "./ui/scroll-area";
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export type Conversation = {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

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

function LanguageSelector({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
                <SelectItem value="fr-FR">Français</SelectItem>
                <SelectItem value="de-DE">Deutsch</SelectItem>
                <SelectItem value="hi-IN">हिन्दी</SelectItem>
                <SelectItem value="gu-IN">ગુજરાતી</SelectItem>
            </SelectContent>
        </Select>
    );
}

function SettingsDialog({ speechLang, onSpeechLangChange }: { speechLang: string, onSpeechLangChange: (lang: string) => void }) {
    return (
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
                 <div className="space-y-2">
                    <Label>Speech Language</Label>
                    <LanguageSelector value={speechLang} onValueChange={onSpeechLangChange} />
                </div>
            </div>
      </DialogContent>
    )
}

function UserMenu({ onLogout, speechLang, onSpeechLangChange }: { onLogout: () => void, speechLang: string, onSpeechLangChange: (lang: string) => void }) {
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
      <SettingsDialog speechLang={speechLang} onSpeechLangChange={onSpeechLangChange} />
    </Dialog>
  );
}


export default function Dashboard() {
  const router = useRouter();
  const [speechLang, setSpeechLang] = useState("en-US");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Load conversations from localStorage on initial render
  useEffect(() => {
    try {
        const savedConversations = localStorage.getItem("rakshit-ai-conversations");
        if (savedConversations) {
            const parsed = JSON.parse(savedConversations);
            setConversations(parsed);
            if (parsed.length > 0) {
                 // Get the most recent conversation and set it as active
                const sorted = [...parsed].sort((a, b) => b.timestamp - a.timestamp);
                setActiveConversationId(sorted[0].id);
            }
        }
        const savedLang = localStorage.getItem("rakshit-ai-speech-lang");
        if (savedLang) {
            setSpeechLang(savedLang);
        }
    } catch (error) {
        console.error("Failed to load from localStorage", error);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    try {
        if(conversations.length > 0) {
            localStorage.setItem("rakshit-ai-conversations", JSON.stringify(conversations));
        } else {
             localStorage.removeItem("rakshit-ai-conversations");
        }
    } catch(error) {
        console.error("Failed to save conversations to localStorage", error);
    }
  }, [conversations]);

  const handleSpeechLangChange = (lang: string) => {
    setSpeechLang(lang);
    localStorage.setItem("rakshit-ai-speech-lang", lang);
  }
  
  const handleNewChat = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };
  
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
        const newConversations = prev.filter(c => c.id !== id);
        // If the active conversation is deleted, start a new chat
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
        return newConversations;
    });
  };

  const handleNewMessage = (newMessage: Message, isUserMessage: boolean) => {
    setConversations(prev => {
      let activeId = activeConversationId;
      if (activeId) {
        // Add message to an existing conversation
        return prev.map(c => 
          c.id === activeId 
            ? { ...c, messages: [...c.messages, newMessage], timestamp: Date.now() }
            : c
        );
      } else {
        // Start a new conversation
        const conversationTitle = newMessage.content.substring(0, 30);
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: isUserMessage ? `${conversationTitle}...` : "New Chat",
          messages: [newMessage],
          timestamp: Date.now(),
        };
        setActiveConversationId(newConversation.id);
        return [newConversation, ...prev];
      }
    });
  };


  const handleLogout = () => {
    localStorage.removeItem("rakshit-ai-token");
    localStorage.removeItem("rakshit-ai-conversations");
    localStorage.removeItem("rakshit-ai-speech-lang");
    router.push("/login");
  };
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const sortedConversations = [...conversations].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-background min-h-screen">
      <SidebarProvider>
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r-0 md:border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Bot className="size-7 text-primary" />
              <h1 className="text-xl font-bold">Rakshit.AI</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
             <div className="p-2">
                 <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewChat}>
                    <Plus className="w-4 h-4" />
                    <span className="truncate">New Chat</span>
                </Button>
            </div>
            <ScrollArea className="h-full px-2">
                <SidebarMenu>
                    {sortedConversations.map(convo => (
                        <SidebarMenuItem key={convo.id}>
                            <SidebarMenuButton
                                isActive={convo.id === activeConversationId}
                                onClick={() => handleSelectConversation(convo.id)}
                                className="h-auto py-2"
                            >
                                <div className="flex-1 truncate text-left">{convo.title}</div>
                            </SidebarMenuButton>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-50 hover:opacity-100">
                                        <Trash2 className="w-4 h-4"/>
                                     </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this conversation.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteConversation(convo.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="mt-auto p-2 space-y-1">
            <UserMenu onLogout={handleLogout} speechLang={speechLang} onSpeechLangChange={handleSpeechLangChange} />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold truncate flex-1 text-center pr-8">
                  {activeConversation ? activeConversation.title : "Rakshit.AI"}
                </h1>
            </header>
          <main className="h-screen max-h-screen overflow-y-auto">
              <ChatPanel
                key={activeConversationId || "new"}
                messages={activeConversation?.messages || []}
                onNewMessage={handleNewMessage}
                speechLang={speechLang}
              />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
