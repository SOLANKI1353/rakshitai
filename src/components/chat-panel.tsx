
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
  Eye,
  File,
  Search,
  PenSquare,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { respondInPreferredLanguage } from "@/ai/flows/respond-in-preferred-language";
import { analyzeUploadedFile } from "@/ai/flows/analyze-uploaded-file";
import { apkBuilderAgent } from "@/ai/flows/apk-builder-agent";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { generateTextWithChatGPT } from "@/ai/flows/generate-text-with-chat-gpt";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type Message = {
  id: string;
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
  messages: Message[];
  onNewMessage: (newMessage: Message, isUserMessage: boolean) => void;
  speechLang: string;
}

const CodeBlock = ({ children }: { children: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const langMatch = children.match(/^```(\w+)?\n/);
  const language = langMatch && langMatch[1] ? langMatch[1] : 'code';
  const code = children.replace(/^```\w*\n/, '').replace(/```$/, '');

  const handleCopy = () => {
    if (codeRef.current) {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const canPreview = ['html', 'javascript', 'js', 'css'].includes(language.toLowerCase());

  const getPreviewContent = () => {
    if (language.toLowerCase() === 'html') {
      return code;
    }
    if (language.toLowerCase() === 'css') {
      return `<style>${code}</style>`;
    }
    if (['javascript', 'js'].includes(language.toLowerCase())) {
        return `<script>${code}<\/script>`;
    }
    return '';
  }

  return (
    <Dialog>
      <div className="my-4 rounded-lg border bg-secondary/50 dark:bg-black/20">
        <div className="flex items-center justify-between rounded-t-lg bg-secondary/80 dark:bg-black/30 px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground">{language}</span>
          <div className="flex items-center gap-1">
             {canPreview && (
                 <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview</span>
                    </Button>
                 </DialogTrigger>
             )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
               <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </div>
        <pre className="p-4 text-sm whitespace-pre-wrap overflow-x-auto" ref={codeRef}>
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
            <DialogTitle>Code Preview</DialogTitle>
        </DialogHeader>
        <iframe
            srcDoc={getPreviewContent()}
            title="Code Preview"
            sandbox="allow-scripts"
            className="w-full h-full border rounded-md"
         />
      </DialogContent>
    </Dialog>
  );
};

const renderMessageContent = (content: string) => {
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const inlineCodeRegex = /(`[^`]+`)/g;

  const parts = content.split(codeBlockRegex).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      return <CodeBlock key={index}>{part}</CodeBlock>;
    }
    
    const inlineParts = part.split(inlineCodeRegex).filter(Boolean);
    return (
        <div key={index} className="prose prose-sm dark:prose-invert prose-p:whitespace-pre-wrap">
        {inlineParts.map((inlinePart, inlineIndex) => {
            if (inlinePart.startsWith('`')) {
            return (
                <code
                key={inlineIndex}
                className="mx-1 rounded bg-secondary px-[0.4rem] py-[0.2rem] font-mono text-sm font-semibold text-secondary-foreground"
                >
                {inlinePart.slice(1, -1)}
                </code>
            );
            }
            return inlinePart;
        })}
        </div>
    );
  });
};


export function ChatPanel({ messages, onNewMessage, speechLang }: ChatPanelProps) {
  const { toast } = useToast();
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
    const codingKeywords = [
      'code', 'function', 'javascript', 'python', 'react', 'html', 'css', 
      'algorithm', 'component', 'script', 'next.js', 'build', 'how to', 
      'show me', 'fix', 'debug', 'create', 'write', 'implement', 'generate',
      'c#', 'java', 'typescript', 'go', 'json'
    ];
    const questionKeywords = ['what is', 'how does', 'explain', 'compare'];
    
    // If a file is present, let the file handlers decide. This is a text-only decision.
    if (file) {
      return false;
    }

    const hasCodingKeyword = codingKeywords.some(keyword => lowerCaseText.includes(keyword));
    const isQuestionAboutCode = questionKeywords.some(kw => lowerCaseText.startsWith(kw)) && hasCodingKeyword;
    
    return hasCodingKeyword || isQuestionAboutCode;
  };


  const handleSendMessage = async (messageText: string = input) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading) return;

    // This is the only path where a file gets handled now.
    if (file && fileDataUri) {
        await handleFileSubmit();
        return;
    }


    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
    };
    onNewMessage(newUserMessage, true);
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
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
      };
      onNewMessage(assistantMessage, false);


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
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      onNewMessage(errorMessage, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    // Instructions can come from the main input if fileInstructions is empty
    const finalInstructions = fileInstructions.trim() || input.trim();

    if (!file || !fileDataUri || !finalInstructions || isLoading) {
         if(!finalInstructions){
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
      id: Date.now().toString(),
      role: "user",
      content: userMessageContent,
    };
    onNewMessage(newUserMessage, true);

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
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
      };
      onNewMessage(assistantMessage, false);


      if (isTtsEnabled && responseText) {
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
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I couldn't process the file. Please check the file and try again.",
      };
      onNewMessage(errorMessage, false);
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
      recognitionRef.current.lang = speechLang;
      recognitionRef.current.start();
    }
  };
  
  const isFileSubmitDisabled = isLoading || !file || !(fileInstructions.trim() || input.trim());
  
  const showWelcomeMessage = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                {showWelcomeMessage ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-20">
                    <div className="p-3 bg-primary/10 rounded-full">
                    <Bot className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-center">How can I help you today?</h1>
                </div>
                ) : (
                <ScrollArea className="h-full mb-4" ref={scrollAreaRef}>
                    <div className="space-y-6 pr-4 py-6">
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
        </div>

      <audio ref={audioRef} className="hidden" />
       <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pb-4">
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
            <div className="relative flex w-full items-center">
                <form
                    className="flex-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (file) handleFileSubmit(); else handleSendMessage();
                    }}
                >
                    <div className="relative rounded-full border bg-card shadow-lg">
                        <Textarea
                            placeholder={file ? "Provide instructions..." : "Ask me anything..."}
                            className="min-h-[56px] w-full resize-none rounded-full border-none bg-transparent p-4 pr-[170px] shadow-none focus-visible:ring-0"
                            value={file ? (fileInstructions || input) : input}
                            onChange={(e) => file ? setFileInstructions(e.target.value) : setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (file) handleFileSubmit(); else handleSendMessage();
                                }
                            }}
                            disabled={isLoading || isRecording}
                            rows={1}
                        />
                        <div className="absolute bottom-3 right-4 flex items-center gap-1">
                             <div className="flex items-center gap-1 border-r pr-2 mr-1">
                                 <Switch
                                     id="tts-switch"
                                     checked={isTtsEnabled}
                                     onCheckedChange={setIsTtsEnabled}
                                     aria-label="Toggle text-to-speech"
                                     className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                                 />
                                 {isTtsEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant={isRecording ? "destructive" : "ghost"}
                                onClick={toggleRecording}
                                disabled={isLoading || !!file}
                                aria-label={isRecording ? "Stop recording" : "Start recording"}
                                className="h-9 w-9"
                            >
                                <Mic className="h-5 w-5" />
                            </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={isLoading}
                                        aria-label="Attach file"
                                        className="h-9 w-9"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="mb-2 w-56">
                                    <DropdownMenuLabel>Attach</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                        <File className="mr-2 h-4 w-4" />
                                        <span>Add photos & files</span>
                                    </DropdownMenuItem>
                                     <DropdownMenuItem disabled>
                                        <Search className="mr-2 h-4 w-4" />
                                        <span>Web search</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <PenSquare className="mr-2 h-4 w-4" />
                                        <span>Canvas</span>
                                    </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>Connect</DropdownMenuLabel>
                                        <DropdownMenuItem disabled>
                                            <Globe className="mr-2 h-4 w-4" />
                                            <span>Google Drive</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Globe className="mr-2 h-4 w-4" />
                                            <span>OneDrive</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Globe className="mr-2 h-4 w-4" />
                                            <span>Sharepoint</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || (!input.trim() && !file)}
                                aria-label="Send message"
                                className="h-9 w-9"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
