"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({ onSend, disabled, value, onChange }: ChatInputProps) {
  const [input, setInput] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) {
      setInput(value);
    }
  }, [value]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (onChange) {
        onChange("");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the push notification you want to create..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700",
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[52px] max-h-[200px]"
          )}
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
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={cn(
            "px-4 py-3 rounded-lg bg-purple-500 text-white",
            "hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors flex items-center justify-center",
            "min-w-[52px]"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

