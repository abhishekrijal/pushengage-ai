"use client";

import { ParsedNotification } from "@/lib/parse-notification";
import { Bell, Smartphone, Monitor } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface EnhancedNotificationPreviewProps {
  notification: ParsedNotification | null;
  url?: string;
  image?: string;
}

type PreviewType = "mobile" | "chrome";

export function EnhancedNotificationPreview({
  notification,
  url,
  image,
}: EnhancedNotificationPreviewProps) {
  const [previewType, setPreviewType] = useState<PreviewType>("mobile");

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
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Preview Type Selector */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setPreviewType("mobile")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              previewType === "mobile"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </button>
          <button
            onClick={() => setPreviewType("chrome")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              previewType === "chrome"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Monitor className="w-4 h-4" />
            Chrome
          </button>
        </div>

        {/* Mobile Preview */}
        {previewType === "mobile" && (
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
                    {image && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt="Notification"
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
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
        )}

        {/* Chrome Desktop Preview - macOS Style */}
        {previewType === "chrome" && (
          <div className="relative">
            {/* macOS Desktop Background */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-8 min-h-[500px]">
              {/* macOS Notification - Top Right Corner Style */}
              <div className="absolute top-8 right-8 w-96 group">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-3xl">
                  {/* Close button - appears on hover */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-6 h-6 rounded-full bg-gray-200/80 dark:bg-gray-700/80 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Notification Header with Toggle */}
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/50 border-b border-gray-200/50 dark:border-gray-700/50 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {url ? (() => {
                            try {
                              return new URL(url).hostname;
                            } catch {
                              return "example.com";
                            }
                          })() : "example.com"}
                        </span>
                      </div>
                      {/* Toggle switch - appears on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* App icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                        {notification.emoji ? (
                          <span className="text-2xl">{notification.emoji}</span>
                        ) : (
                          <Bell className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Notification content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {notification.body}
                        </p>
                        {url && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 truncate">
                            {url}
                          </p>
                        )}
                        {image && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt="Notification"
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notification Actions (macOS style) */}
                  <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-end gap-2">
                    <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors">
                      Close
                    </button>
                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
                      View
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview info */}
              <div className="absolute bottom-8 left-8 right-8">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-gray-700/50 shadow-lg">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Preview Stats
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
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
        )}
      </div>
    </div>
  );
}

