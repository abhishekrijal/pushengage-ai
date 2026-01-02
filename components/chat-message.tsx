"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string | any;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  
  // Handle different content formats from TanStack AI
  let displayContent = "";
  
  // Handle string content directly
  if (typeof content === "string") {
    displayContent = content;
  } 
  // Handle array of content parts (TanStack AI format - parts array)
  else if (Array.isArray(content)) {
    displayContent = content
      .map((part: any) => {
        // TanStack AI format: { type: "text", content: "..." }
        if (part?.type === "text" && part?.content) {
          return part.content;
        }
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        if (part?.content) return typeof part.content === "string" ? part.content : part.content?.text;
        return "";
      })
      .filter(Boolean)
      .join("");
  } 
  // Handle object with parts array (TanStack AI message format)
  else if (content?.parts && Array.isArray(content.parts)) {
    displayContent = content.parts
      .map((part: any) => {
        if (part?.type === "text" && part?.content) {
          return part.content;
        }
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        if (part?.content) return typeof part.content === "string" ? part.content : part.content?.text;
        return "";
      })
      .filter(Boolean)
      .join("");
  }
  // Handle object with content property
  else if (content?.content) {
    displayContent = typeof content.content === "string" 
      ? content.content 
      : content.content?.text || "";
  } 
  // Handle text property
  else if (content?.text) {
    displayContent = content.text;
  } 
  // Handle delta format (streaming)
  else if (content?.delta) {
    displayContent = content.delta;
  }
  
  // Fallback: try to stringify if nothing worked
  if (!displayContent && content) {
    console.warn("Unhandled content format:", content);
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser
          ? "bg-pe-primary-50 dark:bg-pe-primary-950/20 justify-end"
          : "bg-gray-50 dark:bg-gray-900/50 justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pe-primary-600 dark:bg-pe-primary-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "flex-1 max-w-[80%]",
          isUser ? "text-right" : "text-left"
        )}
      >
        <div
          className={cn(
            "inline-block p-3 rounded-lg",
            isUser
              ? "bg-pe-primary-600 dark:bg-pe-primary-500 text-white"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{displayContent}</p>
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pe-primary-600 dark:bg-pe-primary-500 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}

