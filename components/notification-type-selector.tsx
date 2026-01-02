"use client";

import { Radio, Droplets, Zap, ShoppingCart, Eye, Workflow, TrendingDown, Package, UserPlus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "broadcast" | "drip" | "triggered" | "workflow";

export interface NotificationTypeSelectorProps {
  onSelect: (type: NotificationType) => void;
}

export function NotificationTypeSelector({ onSelect }: NotificationTypeSelectorProps) {
  const options = [
    {
      id: "broadcast" as NotificationType,
      title: "Push Broadcast",
      description: "Send a one-time notification to all your subscribers",
      icon: Radio,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "drip" as NotificationType,
      title: "Drip",
      description: "Create a series of automated notifications over time",
      icon: Droplets,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
    {
      id: "triggered" as NotificationType,
      title: "Triggered Campaign",
      description: "Set up notifications based on user behavior",
      icon: Zap,
      color: "from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
    },
    {
      id: "workflow" as NotificationType,
      title: "Workflow",
      description: "Create complex multi-step notification sequences",
      icon: Workflow,
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "group relative p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700",
              "bg-white dark:bg-gray-800",
              "hover:border-pe-primary-300 dark:hover:border-pe-primary-600",
              "transition-all duration-200 hover:shadow-lg",
              "text-left"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
              option.color,
              option.hoverColor,
              "transition-all duration-200 group-hover:scale-110"
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {option.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export type TriggeredCampaignType = "browse" | "cart-abandonment" | "price-drop" | "back-in-stock" | "welcome-series" | "re-engagement";

export interface TriggeredCampaignSelectorProps {
  onSelect: (type: TriggeredCampaignType) => void;
  onBack: () => void;
}

export function TriggeredCampaignSelector({ onSelect, onBack }: TriggeredCampaignSelectorProps) {
  const options = [
    {
      id: "browse" as TriggeredCampaignType,
      title: "Browse Abandonment",
      description: "Re-engage users who viewed products but didn't purchase",
      icon: Eye,
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      id: "cart-abandonment" as TriggeredCampaignType,
      title: "Cart Abandonment",
      description: "Recover lost sales by reminding users about items in their cart",
      icon: ShoppingCart,
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      id: "price-drop" as TriggeredCampaignType,
      title: "Price Drop Alert",
      description: "Notify users when products they're interested in go on sale",
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
    },
    {
      id: "back-in-stock" as TriggeredCampaignType,
      title: "Back in Stock",
      description: "Alert users when out-of-stock items become available again",
      icon: Package,
      color: "from-cyan-500 to-cyan-600",
      hoverColor: "hover:from-cyan-600 hover:to-cyan-700",
    },
    {
      id: "welcome-series" as TriggeredCampaignType,
      title: "Welcome Series",
      description: "Onboard new subscribers with a sequence of welcome messages",
      icon: UserPlus,
      color: "from-amber-500 to-amber-600",
      hoverColor: "hover:from-amber-600 hover:to-amber-700",
    },
    {
      id: "re-engagement" as TriggeredCampaignType,
      title: "Re-engagement",
      description: "Win back inactive users with targeted re-engagement campaigns",
      icon: Clock,
      color: "from-violet-500 to-violet-600",
      hoverColor: "hover:from-violet-600 hover:to-violet-700",
    },
  ];

  return (
    <div className="mt-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-pe-primary-600 dark:hover:text-pe-primary-400 flex items-center gap-2 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to notification types
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
                "group relative p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700",
                "bg-white dark:bg-gray-800",
                "hover:border-pe-primary-300 dark:hover:border-pe-primary-600",
                "transition-all duration-200 hover:shadow-lg",
                "text-left"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                option.color,
                option.hoverColor,
                "transition-all duration-200 group-hover:scale-110"
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

