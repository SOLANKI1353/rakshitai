
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
  Settings2,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ChatPanel, Message } from "@/components/chat-panel";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";


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


function SettingsMenu({ onLogout, speechLang, onSpeechLangChange }: { onLogout: () => void, speechLang: string, onSpeechLangChange: (lang: string) => void }) {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
                <Settings2 className="h-5 w-5" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-4">
                 <div className="space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">Theme</Label>
                    <ThemeToggleButtons />
                </div>
                 <div className="space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">Speech Language</Label>
                    <LanguageSelector value={speechLang} onValueChange={onSpeechLangChange} />
                </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function Dashboard() {
  const router = useRouter();
  const [speechLang, setSpeechLang] = useState("en-US");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  // Load conversations from localStorage on initial render
  useEffect(() => {
    try {
        const savedConversations = localStorage.getItem("rakshit-ai-conversations");
        if (savedConversations) {
            const parsed = JSON.parse(savedConversations);
            setConversations(parsed);
            if (parsed.length > 0) {
                 const sorted = [...parsed].sort((a, b) => b.timestamp - a.timestamp);
                 if(!activeConversationId) {
                    setActiveConversationId(sorted[0].id);
                 }
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
    setIsHistoryPanelOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsHistoryPanelOpen(false);
  };
  
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
        const newConversations = prev.filter(c => c.id !== id);
        if (activeConversationId === id) {
            const sorted = [...newConversations].sort((a, b) => b.timestamp - a.timestamp);
            setActiveConversationId(sorted.length > 0 ? sorted[0].id : null);
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
  
  const sortedConversations = [...conversations].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-background min-h-screen flex flex-col relative">
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" onClick={() => setIsHistoryPanelOpen(true)}>
                <MessageSquare className="h-5 w-5" />
            </Button>
             <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text animate-pulse">
                Rakshit AI
            </h1>
            <SettingsMenu onLogout={handleLogout} speechLang={speechLang} onSpeechLangChange={handleSpeechLangChange} />
        </header>

         {isHistoryPanelOpen && (
            <div className="absolute top-0 left-0 bottom-0 w-80 bg-card/80 backdrop-blur-sm border-r z-20 flex flex-col animate-in slide-in-from-left-full duration-300">
                <div className="p-4 flex items-center justify-between border-b">
                     <h2 className="text-lg font-semibold">History</h2>
                     <Button variant="ghost" size="icon" onClick={() => setIsHistoryPanelOpen(false)}>
                         <ChevronLeft className="h-5 w-5"/>
                     </Button>
                </div>
                <div className="p-2">
                    <Button variant="outline" className="w-full" onClick={handleNewChat}>
                        <Plus className="mr-2 h-4 w-4" /> New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {sortedConversations.map(convo => (
                             <div key={convo.id} className="relative group">
                                <Button
                                    variant={convo.id === activeConversationId ? 'secondary' : 'ghost'}
                                    className="w-full justify-start truncate"
                                    onClick={() => handleSelectConversation(convo.id)}
                                >
                                    {convo.title}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteConversation(convo.id);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        )}
        
      <main className="flex-1 flex flex-col justify-center items-center">
          <ChatPanel
            key={activeConversationId || "new"}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNewMessage={handleNewMessage}
            onSelectConversation={handleSelectConversation}
            speechLang={speechLang}
          />
      </main>
    </div>
  );
}
