"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { Bot } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const token = localStorage.getItem("rakshit-ai-token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (isAuthenticated === true) {
    return <Dashboard />;
  }

  // This will be shown briefly before redirect happens or if auth state is false
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-pulse text-primary" />
    </div>
  );
}
