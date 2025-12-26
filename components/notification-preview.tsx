"use client";

import { parseNotificationContent, ParsedNotification } from "@/lib/parse-notification";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationPreviewProps {
  lastMessage?: string;
}

export function NotificationPreview({ lastMessage }: NotificationPreviewProps) {
  const [notification, setNotification] = useState<ParsedNotification | null>(null);

  useEffect(() => {
    if (lastMessage) {
      const parsed = parseNotificationContent(lastMessage);
      setNotification(parsed);
    }
  }, [lastMessage]);

  if (!notification) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your notification preview will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Mobile status bar */}
          <div className="bg-gray-900 dark:bg-black px-4 py-2 flex items-center justify-between text-white text-xs">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-white rounded-sm">
                <div className="w-3 h-1.5 bg-white rounded-sm m-0.5" />
              </div>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>

          {/* Notification preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  {notification.emoji ? (
                    <span className="text-2xl">{notification.emoji}</span>
                  ) : (
                    <Bell className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Notification content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 ml-2">now</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {notification.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                Preview Stats
              </p>
              <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                <div className="flex justify-between">
                  <span>Title:</span>
                  <span className={notification.title.length > 50 ? "text-red-600" : ""}>
                    {notification.title.length}/50
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Body:</span>
                  <span className={notification.body.length > 150 ? "text-red-600" : ""}>
                    {notification.body.length}/150
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

