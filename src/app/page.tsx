"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { Bot } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // This effect runs only on the client
    const token = localStorage.getItem("rakshit-ai-token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.replace("/login");
    }
    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  // This will be shown briefly before redirect happens
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-pulse text-primary" />
    </div>
  );
}
