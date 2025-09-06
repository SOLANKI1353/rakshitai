"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Bot,
  CornerDownLeft,
  Loader2,
  Mic,
  Paperclip,
  Send,
  User,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { respondInPreferredLanguage } from "@/ai/flows/respond-in-preferred-language";
import { analyzeUploadedFile } from "@/ai/flows/analyze-uploaded-file";
import { apkBuilderAgent } from "@/ai/flows/apk-builder-agent";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

// Extend Window interface for SpeechRecognition
interface CustomWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare let window: CustomWindow;

type ChatPanelProps = {
    speechLang: string;
}

export function ChatPanel({ speechLang }: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I am RakshitAI. I can answer your questions, write code, analyze files, and even guide you on creating an APK from your web project. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileInstructions, setFileInstructions] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast({
          variant: "destructive",
          title: "Speech Recognition Error",
          description: `An error occurred: ${event.error}`,
        });
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, [toast, speechLang]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Limit file size to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
        });
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSendMessage = async (messageText: string = input) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading) return;
    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    try {
      const result = await respondInPreferredLanguage({ query: trimmedInput });
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Handle actions returned by the AI
      if (result.action) {
        if (result.action.type === "open_url" && result.action.url) {
          window.open(result.action.url, "_blank");
        }
      }

      if (isTtsEnabled) {
        try {
          const audioResult = await textToSpeech(result.response);
          if (audioRef.current) {
            audioRef.current.src = audioResult.media;
            audioRef.current.play();
          }
        } catch (ttsError: any) {
          console.error("TTS Error:", ttsError);
          const description = ttsError.message.includes("429")
            ? "You've exceeded the daily limit for audio responses."
            : "Could not generate audio response.";
          toast({
            variant: "destructive",
            title: "Text-to-Speech Failed",
            description: description,
          });
        }
      }
    } catch (error) {
      console.error("Error with AI response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file || !fileDataUri || !fileInstructions.trim() || isLoading) return;
    setIsLoading(true);

    const userMessageContent = `File: ${file.name}.\nInstructions: ${fileInstructions}`;
    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Reset file state
    const currentFile = file;
    const currentFileDataUri = fileDataUri;
    const currentFileInstructions = fileInstructions;
    setFile(null);
    setFileDataUri(null);
    setFileInstructions("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      let result;
      // Check if the user is asking to build an APK
      if (currentFileInstructions.toLowerCase().includes("apk")) {
        result = await apkBuilderAgent({
          projectZipDataUri: currentFileDataUri,
          instructions: currentFileInstructions,
        });
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: result.isPossible
            ? result.guidance
            : `Sorry, I can't convert this project. ${result.guidance}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Use the general file analyzer
        result = await analyzeUploadedFile({
          fileDataUri: currentFileDataUri,
          fileType: currentFile.type,
          instructions: currentFileInstructions,
        });
         const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: result.analysisResult,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      const responseText = (result as any).guidance || (result as any).analysisResult;

      if (isTtsEnabled && responseText) {
        try {
          const audioResult = await textToSpeech(responseText);
          if (audioRef.current) {
            audioRef.current.src = audioResult.media;
            audioRef.current.play();
          }
        } catch (ttsError: any) {
          console.error("TTS Error:", ttsError);
          const description = ttsError.message.includes("429")
            ? "You've exceeded the daily limit for audio responses."
            : "Could not generate audio response.";
          toast({
            variant: "destructive",
            title: "Text-to-Speech Failed",
            description: description,
          });
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Sorry, I couldn't process the file. Please check the file and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in your browser.",
      });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Update language before starting
      recognitionRef.current.lang = speechLang;
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Chat</h2>
        <div className="flex items-center gap-2">
            <Label htmlFor="tts-switch" className="text-sm text-muted-foreground">
                {isTtsEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
            </Label>
            <Switch
                id="tts-switch"
                checked={isTtsEnabled}
                onCheckedChange={setIsTtsEnabled}
                aria-label="Toggle text-to-speech"
            />
        </div>
      </div>
      <ScrollArea className="flex-1 mb-4" ref={scrollAreaRef}>
        <div className="space-y-6 pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" && "justify-end"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="w-5 h-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xl rounded-lg px-4 py-3 shadow-md",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-5 h-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-xl rounded-lg px-4 py-3 bg-card shadow-md flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <audio ref={audioRef} className="hidden" />
      <div className="relative">
        {file && (
          <Card className="absolute bottom-full mb-2 w-full shadow-lg animate-in fade-in-0 zoom-in-95 bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  File: {file.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setFile(null);
                    setFileDataUri(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="instructions" className="text-xs">
                    Instructions
                  </Label>
                  <Input
                    id="instructions"
                    placeholder="e.g., 'Summarize this file' or 'Convert this project to APK'"
                    value={fileInstructions}
                    onChange={(e) => setFileInstructions(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleFileSubmit}
                  disabled={isLoading || !fileInstructions.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CornerDownLeft className="mr-2 h-4 w-4" />
                  )}
                  Submit File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Textarea
            placeholder="Ask me anything or attach a file..."
            className="min-h-[140px] rounded-2xl resize-none p-4 pr-32 border-border bg-card"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || !!file || isRecording}
          />
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "ghost"}
              onClick={toggleRecording}
              disabled={isLoading || !!file}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              className="h-8 w-8"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!file}
              aria-label="Attach file"
              className="h-8 w-8"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
