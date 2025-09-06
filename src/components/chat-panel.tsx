
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
  Copy,
  Check,
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
import { generateTextWithChatGPT } from "@/ai/flows/generate-text-with-chat-gpt";
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

const CodeBlock = ({ children }: { children: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  // Simple regex to find language, e.g., ```javascript
  const langMatch = children.match(/^```(\w+)\n/);
  const language = langMatch ? langMatch[1] : 'code';
  const code = children.replace(/^```\w+\n/, '').replace(/```$/, '');

  const handleCopy = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-lg border bg-secondary/50 dark:bg-black/20">
      <div className="flex items-center justify-between rounded-t-lg bg-secondary/80 dark:bg-black/30 px-4 py-2">
        <span className="text-xs font-semibold text-muted-foreground">{language}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleCopy}
        >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="p-4 text-sm whitespace-pre-wrap">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};


export function ChatPanel({ speechLang }: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
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
  
  // Dynamically load prism.js for syntax highlighting
  useEffect(() => {
    const loadPrism = async () => {
      // @ts-ignore
      if (typeof window.Prism === 'undefined') {
        try {
          await import('prismjs/themes/prism-tomorrow.css');
          // @ts-ignore
          await import('prismjs');
          // @ts-ignore
          await import('prismjs/components/prism-javascript');
          // @ts-ignore
          await import('prismjs/components/prism-typescript');
          // @ts-ignore
          await import('prismjs/components/prism-jsx');
           // @ts-ignore
          await import('prismjs/components/prism-tsx');
          // @ts-ignore
          await import('prismjs/components/prism-css');
           // @ts-ignore
          await import('prismjs/components/prism-python');
           // @ts-ignore
          await import('prismjs/components/prism-java');
           // @ts-ignore
          await import('prismjs/components/prism-csharp');
           // @ts-ignore
          await import('prismjs/components/prism-go');
           // @ts-ignore
          await import('prismjs/components/prism-json');
           // @ts-ignore
          await import('prismjs/components/prism-bash');
        } catch (e) {
            console.error("Failed to load prismjs", e);
        }
      }
    };
    loadPrism();
  }, []);


  useEffect(() => {
    // @ts-ignore
    if (typeof window.Prism !== 'undefined') {
        // @ts-ignore
        window.Prism.highlightAll();
    }
  }, [messages, isLoading]);


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

    const isCodingRequest = (text: string) => {
        const lowerCaseText = text.toLowerCase();
        // More specific keywords to avoid false positives
        const codingKeywords = [
            'code', 'function', 'javascript', 'python', 'react',
            'html', 'css', 'algorithm', 'component', 'script',
            'next.js', 'build', 'how to', 'show me',
            'fix', 'debug', 'create', 'write', 'implement', 'generate'
        ];
        // Check if it's a question about coding concepts
        const questionKeywords = ['what is', 'how does', 'explain', 'compare'];
        const isQuestion = questionKeywords.some(kw => lowerCaseText.startsWith(kw));

        const hasCodingKeyword = codingKeywords.some(keyword => lowerCaseText.includes(keyword));

        if (isQuestion && hasCodingKeyword) {
            return true;
        }
        
        // Direct command to code, but not a general question
        if (!isQuestion && hasCodingKeyword) {
            return true;
        }

        return false;
    };


  const handleSendMessage = async (messageText: string = input) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading) return;

    if (file && fileDataUri) {
        // If there's a file, it must be handled by file submission logic
        await handleFileSubmit();
        return;
    }


    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    try {
      let responseText = "";
      
      // Determine which flow to use
      if (isCodingRequest(trimmedInput)) {
        const gptResult = await generateTextWithChatGPT({ prompt: trimmedInput });
        responseText = gptResult.generatedText;
      } else {
        const result = await respondInPreferredLanguage({ query: trimmedInput });
        responseText = result.response;
        if ((result as any).action && (result as any).action.type === "open_url" && (result as any).action.url) {
            window.open((result as any).action.url, "_blank");
        }
      }
      
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: responseText,
      };
      setMessages((prev) => [...prev, assistantMessage]);


      if (isTtsEnabled) {
        // We only want to TTS the non-code part of the response
        const textToSpeak = responseText.split('```')[0].trim();
        if (textToSpeak) {
            try {
              const audioResult = await textToSpeech(textToSpeak);
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

  const handleFileSubmit = async (instructions?: string) => {
    const finalInstructions = instructions || fileInstructions;
    if (!file || !fileDataUri || !finalInstructions.trim() || isLoading) {
         if(!finalInstructions.trim()){
            toast({
                variant: "destructive",
                title: "Instructions Required",
                description: "Please provide instructions for the uploaded file.",
            });
         }
        return;
    }
    setIsLoading(true);

    const userMessageContent = `File: ${file.name}.\nInstructions: ${finalInstructions}`;
    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Reset file state
    const currentFile = file;
    const currentFileDataUri = fileDataUri;
    setFile(null);
    setFileDataUri(null);
    setFileInstructions("");
    setInput(""); // Also clear the main input
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      let responseText = "";
      
      // Determine which file-processing flow to use
      if (finalInstructions.toLowerCase().includes("apk")) {
        const result = await apkBuilderAgent({
          projectZipDataUri: currentFileDataUri,
          instructions: finalInstructions,
        });
        responseText = result.isPossible
            ? result.guidance
            : `Sorry, I can't convert this project. ${result.guidance}`;

      } else {
        const result = await analyzeUploadedFile({
          fileDataUri: currentFileDataUri,
          fileType: currentFile.type,
          instructions: finalInstructions,
        });
        responseText = result.analysisResult;
      }
       const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: responseText,
      };
      setMessages((prev) => [...prev, assistantMessage]);


      if (isTtsEnabled && responseText) {
         // We only want to TTS the non-code part of the response
        const textToSpeak = responseText.split('```')[0].trim();
        if(textToSpeak){
            try {
              const audioResult = await textToSpeech(textToSpeak);
              if (audioRef.current) {
                audioRef.current.src = audioResult.media;
                audioRef.current.play();
              }
            } catch (ttsError: any)          {
                console.error('TTS Error:', ttsError);
                const description =
                  (ttsError as Error).message.includes('429') ?
                  "You've exceeded the daily limit for audio responses." :
                  'Could not generate audio response.';
                toast({
                  variant: 'destructive',
                  title: 'Text-to-Speech Failed',
                  description: description,
                });
            }
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
  
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        return <CodeBlock key={index}>{part}</CodeBlock>;
      }
      return <p key={index} className="text-sm whitespace-pre-wrap">{part}</p>;
    });
  };

  const isFileSubmitDisabled = isLoading || !file || !fileInstructions.trim();
  
  const showWelcomeMessage = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full max-h-full p-4 md:p-6 lg:p-8">
      <div className="flex-1 w-full max-w-4xl mx-auto">
        {showWelcomeMessage ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-center">How can I help you today?</h1>
          </div>
        ) : (
          <ScrollArea className="h-full mb-4" ref={scrollAreaRef}>
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
                      "max-w-3xl rounded-lg px-4 py-3 shadow-md",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    )}
                  >
                    {message.role === 'assistant' ? renderMessageContent(message.content) : <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
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
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
      <div className="relative w-full max-w-4xl mx-auto">
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
                  onClick={() => handleFileSubmit()}
                  disabled={isFileSubmitDisabled}
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
            placeholder={file ? "Provide instructions for the attached file..." : "Ask me anything or attach a file..."}
            className="min-h-[60px] rounded-2xl resize-none p-4 pr-36 border-border bg-card shadow-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || isRecording}
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1">
             <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Label htmlFor="tts-switch" className="sr-only">
                    Toggle TTS
                </Label>
                <Switch
                    id="tts-switch"
                    checked={isTtsEnabled}
                    onCheckedChange={setIsTtsEnabled}
                    aria-label="Toggle text-to-speech"
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                />
                 <Label htmlFor="tts-switch" className="text-muted-foreground cursor-pointer">
                    {isTtsEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
                </Label>
            </div>
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
              disabled={isLoading}
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
              disabled={isLoading || !input.trim() && !file}
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
