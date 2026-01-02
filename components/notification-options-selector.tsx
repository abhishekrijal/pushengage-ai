"use client";

import { NotificationOption } from "@/lib/parse-multiple-notifications";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface NotificationOptionsSelectorProps {
  options: NotificationOption[];
  selectedId: string | null;
  onSelect: (option: NotificationOption) => void;
}

export function NotificationOptionsSelector({
  options,
  selectedId,
  onSelect,
}: NotificationOptionsSelectorProps) {
  if (options.length <= 1) return null;

  return (
    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Select a Notification Option
      </h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className={cn(
              "w-full text-left p-3 rounded-lg border-2 transition-all",
              selectedId === option.id
                ? "border-pe-primary-600 bg-pe-primary-50 dark:bg-pe-primary-900/20 dark:border-pe-primary-500"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {option.variation && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {option.variation}
                  </p>
                )}
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {option.emoji && <span className="mr-1">{option.emoji}</span>}
                  {option.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {option.body}
                </p>
              </div>
              {selectedId === option.id && (
                <Check className="w-5 h-5 text-pe-primary-600 dark:text-pe-primary-400 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

