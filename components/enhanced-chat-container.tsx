"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import { ChatMessage } from "./chat-message";
import { EnhancedNotificationPreview } from "./enhanced-notification-preview";
import { NotificationOptionsSelector } from "./notification-options-selector";
import { NotificationFollowupForm } from "./notification-followup-form";
import { parseMultipleNotifications, NotificationOption } from "@/lib/parse-multiple-notifications";
import { ParsedNotification } from "@/lib/parse-notification";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { PushEngageLogo } from "./pushengage-logo";
import { ThemeToggle } from "./theme-toggle";

interface SavedNotification {
  notification: ParsedNotification;
  url?: string;
  image?: string;
}

export function EnhancedChatContainer() {
  const [inputValue, setInputValue] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<ParsedNotification | null>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [notificationOptions, setNotificationOptions] = useState<NotificationOption[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<SavedNotification[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [notificationUrl, setNotificationUrl] = useState<string>("");
  const [notificationImage, setNotificationImage] = useState<string>("");
  
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

  // Get the last assistant message and parse notifications
  const lastAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    
    if (!lastMessage) return "";
    
    // Handle different content formats from TanStack AI (same logic as ChatMessage)
    let messageContent: any = null;
    
    // Check if message has content directly (could be string or object)
    if ((lastMessage as any).content !== undefined) {
      messageContent = (lastMessage as any).content;
    }
    // Check if message has parts array
    else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      messageContent = lastMessage.parts;
    }
    // Check if the message itself is the content (fallback)
    else if (typeof lastMessage === "string") {
      messageContent = lastMessage;
    }
    
    if (!messageContent) {
      return "";
    }
    
    // Extract text content from various formats
    // Handle string content directly
    if (typeof messageContent === "string") {
      // Filter out any non-text patterns (like object references)
      if (messageContent.startsWith("[") || messageContent.includes("[object")) {
        return "";
      }
      return messageContent;
    }
    // Handle array of content parts (TanStack AI format - parts array)
    else if (Array.isArray(messageContent)) {
      return messageContent
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
    // Handle object with parts array
    else if (messageContent?.parts && Array.isArray(messageContent.parts)) {
      return messageContent.parts
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
    else if (messageContent?.content) {
      return typeof messageContent.content === "string" 
        ? messageContent.content 
        : messageContent.content?.text || "";
    }
    // Handle text property
    else if (messageContent?.text) {
      const text = messageContent.text;
      // Filter out object references or invalid content
      if (typeof text === "string" && !text.startsWith("[") && !text.includes("[object")) {
        return text;
      }
      return "";
    }
    
    // If we got here, we couldn't extract valid content
    // Log for debugging (only in browser console)
    if (typeof window !== "undefined") {
      console.warn("Could not extract text content from message:", lastMessage);
    }
    
    return "";
  }, [messages]);

  // Parse notifications when message changes (only when loading is complete)
  useEffect(() => {
    // Only parse when not loading and we have a message
    if (!isLoading && lastAssistantMessage && lastAssistantMessage.trim().length > 0) {
      const options = parseMultipleNotifications(lastAssistantMessage);
      setNotificationOptions(options);
      // Always update to the first notification when new options are parsed
      if (options.length > 0) {
        setSelectedNotification(options[0]);
        setSelectedNotificationId(options[0].id);
        // Reset URL and image when new notification is parsed
        setNotificationUrl("");
        setNotificationImage("");
      } else {
        // If no options found, clear the selection
        setSelectedNotification(null);
        setSelectedNotificationId(null);
      }
    }
  }, [lastAssistantMessage, isLoading]);

  const handleSelectNotification = (option: NotificationOption) => {
    setSelectedNotification(option);
    setSelectedNotificationId(option.id);
  };

  const handleNotificationChange = (updatedNotification: ParsedNotification) => {
    setSelectedNotification(updatedNotification);
  };

  const handleSaveNotification = (data: {
    notification: ParsedNotification;
    url?: string;
    image?: string;
  }) => {
    setSavedNotifications((prev) => [...prev, data]);
    setNotificationUrl(data.url || "");
    setNotificationImage(data.image || "");
    alert("Notification saved as draft!");
  };

  const handleSendNotification = async (data: {
    notification: ParsedNotification;
    url?: string;
    image?: string;
  }) => {
    setIsSending(true);
    try {
      const response = await fetch("/api/pushengage/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.notification.title,
          message: data.notification.body,
          url: data.url,
          icon: data.notification.emoji,
          image: data.image,
        }),
      });

      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text();
      const contentType = response.headers.get("content-type") || "";
      let result: any;
      
      if (contentType.includes("application/json")) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError: any) {
          throw new Error(`Invalid JSON response from server. Status: ${response.status}`);
        }
      } else {
        // Non-JSON response (likely HTML error page)
        throw new Error(`Server returned an error (Status: ${response.status}). Please check the API configuration.`);
      }

      if (!response.ok || result.success === false) {
        const errorMessage = result.error || result.message || "Failed to send notification";
        throw new Error(errorMessage);
      }

      alert("Notification sent successfully via PushEngage!");
      setSelectedNotification(null);
      setNotificationOptions([]);
      setNotificationUrl("");
      setNotificationImage("");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left side - Chat */}
      <div className="flex flex-col flex-1 border-r border-gray-200 dark:border-gray-800">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <PushEngageLogo width={140} height={20} />
              </div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  AI Assistant
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Generate effective push notifications
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block p-4 rounded-full bg-pe-primary-100 dark:bg-pe-primary-900/20 mb-4">
                  <svg
                    className="w-12 h-12 text-pe-primary-600 dark:text-pe-primary-400"
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
                  I&apos;ll generate effective content following best practices.
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
                      setSelectedNotification(null);
                      setNotificationOptions([]);
                      setNotificationUrl("");
                      setNotificationImage("");
                        }}
                        className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pe-primary-50 dark:hover:bg-pe-primary-900/20 hover:border-pe-primary-300 dark:hover:border-pe-primary-700 transition-colors"
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
              let messageContent: any = null;
              
              // TanStack AI stores content in parts array
              if (message.parts && Array.isArray(message.parts)) {
                messageContent = message.parts;
              } else if ((message as any).content) {
                messageContent = (message as any).content;
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pe-primary-600 dark:bg-pe-primary-500 flex items-center justify-center">
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
              setSelectedNotification(null);
              setNotificationOptions([]);
              setNotificationUrl("");
              setNotificationImage("");
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
                      setSelectedNotification(null);
                      setNotificationOptions([]);
                    }
                  }
                }}
                placeholder="Describe the push notification you want to create..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pe-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] max-h-[200px]"
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
                className="px-4 py-3 rounded-lg bg-pe-primary-600 text-white hover:bg-pe-primary-700 dark:bg-pe-primary-500 dark:hover:bg-pe-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[52px]"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right side - Preview & Actions */}
      <div className="w-[600px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-800 px-4 h-20 flex items-center flex-shrink-0 bg-gradient-to-r from-pe-primary-50 to-transparent dark:from-pe-primary-950/20">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Preview & Send
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Preview and configure your notification
            </p>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Notification Options Selector */}
          {notificationOptions.length > 1 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <NotificationOptionsSelector
                options={notificationOptions}
                selectedId={selectedNotificationId}
                onSelect={handleSelectNotification}
              />
            </div>
          )}

          {/* Preview */}
          <div className="p-4">
            <EnhancedNotificationPreview
              notification={selectedNotification}
              url={notificationUrl}
              image={notificationImage}
            />
          </div>

          {/* Follow-up Form (without buttons) */}
          {selectedNotification && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <NotificationFollowupForm
                notification={selectedNotification}
                onSave={handleSaveNotification}
                onSend={handleSendNotification}
                isLoading={isSending}
                onUrlChange={setNotificationUrl}
                onImageChange={setNotificationImage}
                onNotificationChange={handleNotificationChange}
                initialUrl={notificationUrl}
                initialImage={notificationImage}
                showButtons={false}
              />
            </div>
          )}
        </div>

        {/* Sticky Action Buttons */}
        {selectedNotification && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex-shrink-0 shadow-lg">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!notificationUrl.trim()) {
                    alert("Please enter a notification URL");
                    return;
                  }
                  handleSaveNotification({
                    notification: selectedNotification,
                    url: notificationUrl.trim(),
                    image: notificationImage || undefined,
                  });
                }}
                disabled={isSending || !notificationUrl.trim()}
                className={cn(
                  "flex-1 px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600",
                  "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-50 dark:hover:bg-gray-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                )}
              >
                Save Draft
              </button>
              <button
                onClick={() => {
                  if (!notificationUrl.trim()) {
                    alert("Please enter a notification URL");
                    return;
                  }
                  handleSendNotification({
                    notification: selectedNotification,
                    url: notificationUrl.trim(),
                    image: notificationImage || undefined,
                  });
                }}
                disabled={isSending || !notificationUrl.trim()}
                className={cn(
                  "flex-1 px-4 py-3 text-sm rounded-lg bg-pe-primary-600 text-white",
                  "hover:bg-pe-primary-700 dark:bg-pe-primary-500 dark:hover:bg-pe-primary-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors flex items-center justify-center gap-2 font-medium"
                )}
              >
                <Send className="w-4 h-4" />
                Send via PushEngage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

