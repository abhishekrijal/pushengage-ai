"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import { ChatMessage } from "./chat-message";
import { NotificationPreview } from "./notification-preview";
import { Loader2, Send } from "lucide-react";

export function ChatContainer() {
  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get the last assistant message for preview
  const lastAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    
    if (!lastMessage) return "";
    
    // TanStack AI stores content in parts array
    if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      return lastMessage.parts
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
    
    // Fallback to content property
    const content = lastMessage.content;
    
    // Handle string content directly
    if (typeof content === "string") {
      return content;
    }
    
    // Handle array of content parts
    if (Array.isArray(content)) {
      return content
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
    if (content?.content) {
      return typeof content.content === "string" 
        ? content.content 
        : content.content?.text || "";
    }
    
    // Handle text property
    if (content?.text) {
      return content.text;
    }
    
    return "";
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left side - Chat */}
      <div className="flex flex-col flex-1 border-r border-gray-200 dark:border-gray-800">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            PushEngage AI
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Generate effective push notifications with AI
          </p>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
                <svg
                  className="w-12 h-12 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Start Creating Push Notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Describe what kind of push notification you want to create, and
                I'll generate effective content following best practices.
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Try these examples:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Promote a flash sale",
                    "Welcome new users",
                    "Abandoned cart reminder",
                    "New feature announcement",
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        sendMessage(example);
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            // Extract content from TanStack AI message format
            let messageContent: any = message.content;
            
            // TanStack AI stores content in parts array
            if (message.parts && Array.isArray(message.parts)) {
              messageContent = message.parts;
            } else if (message.content) {
              messageContent = message.content;
            }
            
            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={messageContent}
              />
            );
          })}

          {error && (
            <div className="flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700">
                  <p className="text-red-600 dark:text-red-400">
                    Error: {error.message || "Failed to generate response"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">
                    Generating notification...
                  </p>
                </div>
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim() && !isLoading) {
              sendMessage(inputValue.trim());
              setInputValue("");
            }
          }}
          className="flex-shrink-0"
        >
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim() && !isLoading) {
                      sendMessage(inputValue.trim());
                      setInputValue("");
                    }
                  }
                }}
                placeholder="Describe the push notification you want to create..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] max-h-[200px]"
                style={{
                  height: "auto",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-3 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[52px]"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right side - Preview */}
      <div className="w-96 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <div className="h-full flex flex-col">
          <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Preview
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              See how your notification looks
            </p>
          </header>
          <div className="flex-1 overflow-y-auto">
            <NotificationPreview lastMessage={lastAssistantMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}

