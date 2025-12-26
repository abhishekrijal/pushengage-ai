"use client";

import { useState, useEffect } from "react";
import { ParsedNotification } from "@/lib/parse-notification";
import { Send, Link as LinkIcon, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationFollowupFormProps {
  notification: ParsedNotification;
  onSave: (data: {
    notification: ParsedNotification;
    url?: string;
    image?: string;
  }) => void;
  onSend: (data: {
    notification: ParsedNotification;
    url?: string;
    image?: string;
  }) => void;
  isLoading?: boolean;
  onUrlChange?: (url: string) => void;
  onImageChange?: (image: string) => void;
  onNotificationChange?: (notification: ParsedNotification) => void;
  initialUrl?: string;
  initialImage?: string;
  showButtons?: boolean;
}

export function NotificationFollowupForm({
  notification,
  onSave,
  onSend,
  isLoading = false,
  onUrlChange,
  onImageChange,
  onNotificationChange,
  initialUrl = "",
  initialImage = "",
  showButtons = true,
}: NotificationFollowupFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [editableTitle, setEditableTitle] = useState(notification.title);
  const [editableBody, setEditableBody] = useState(notification.body);

  // Update local state when notification prop changes
  useEffect(() => {
    setEditableTitle(notification.title);
    setEditableBody(notification.body);
  }, [notification.title, notification.body]);

  // Update local state when initialUrl or initialImage props change
  useEffect(() => {
    setUrl(initialUrl);
    setImageUrl(initialImage);
  }, [initialUrl, initialImage]);

  // Update parent state when URL/image changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange?.(newUrl);
  };

  const handleImageChange = (newImage: string) => {
    setImageUrl(newImage);
    onImageChange?.(newImage);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditableTitle(newTitle);
    const updatedNotification: ParsedNotification = {
      ...notification,
      title: newTitle,
    };
    onNotificationChange?.(updatedNotification);
  };

  const handleBodyChange = (newBody: string) => {
    setEditableBody(newBody);
    const updatedNotification: ParsedNotification = {
      ...notification,
      body: newBody,
    };
    onNotificationChange?.(updatedNotification);
  };

  const getCurrentNotification = (): ParsedNotification => {
    return {
      ...notification,
      title: editableTitle,
      body: editableBody,
    };
  };

  const handleSave = () => {
    if (!url.trim()) {
      alert("Please enter a notification URL");
      return;
    }
    onSave({
      notification: getCurrentNotification(),
      url: url.trim(),
      image: imageUrl || undefined,
    });
  };

  const handleSend = () => {
    if (!url.trim()) {
      alert("Please enter a notification URL");
      return;
    }
    onSend({
      notification: getCurrentNotification(),
      url: url.trim(),
      image: imageUrl || undefined,
    });
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      // Use custom prompt or generate from notification content
      const prompt = imagePrompt || `${editableTitle}. ${editableBody}`;
      
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width: 512,
          height: 512,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      if (result.imageUrl) {
        handleImageChange(result.imageUrl);
        setShowImageInput(true);
        alert("Image generated successfully!");
      }
    } catch (error: any) {
      alert(`Error generating image: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Notification Details
      </h3>

      {/* Editable Title */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title <span className="text-gray-500">({editableTitle.length}/50)</span>
        </label>
        <input
          type="text"
          value={editableTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          maxLength={50}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-purple-500",
            editableTitle.length > 50 ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
          )}
        />
      </div>

      {/* Editable Body */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Body <span className="text-gray-500">({editableBody.length}/150)</span>
        </label>
        <textarea
          value={editableBody}
          onChange={(e) => handleBodyChange(e.target.value)}
          maxLength={150}
          rows={3}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none",
            editableBody.length > 150 ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
          )}
        />
      </div>

      {/* URL Input - Required */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          <LinkIcon className="w-4 h-4 inline mr-1" />
          Notification URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/page"
          required
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-purple-500",
            !url.trim() ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
          )}
        />
        {!url.trim() && (
          <p className="text-xs text-red-500 mt-1">URL is required</p>
        )}
      </div>

      {/* Image Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ImageIcon className="w-4 h-4" />
            {showImageInput ? "Hide" : "Add"} Image (optional)
          </button>
          {!showImageInput && (
            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className={cn(
                "flex items-center gap-2 text-xs px-3 py-1.5 rounded-md",
                "bg-purple-500 text-white hover:bg-purple-600",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              )}
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Generate with AI
                </>
              )}
            </button>
          )}
        </div>

        {/* Image URL Input */}
        {showImageInput && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image Prompt (optional - uses notification content by default)
              </label>
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., A beautiful sunset over mountains"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => handleImageChange(e.target.value)}
                placeholder="https://example.com/image.jpg or use Generate button"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg border border-purple-500 text-purple-600 dark:text-purple-400",
                  "hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                  "flex items-center gap-2"
                )}
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={imageUrl}
                  alt="Generated"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions - Only show if showButtons is true */}
      {showButtons && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isLoading || !url.trim()}
            className={cn(
              "flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            )}
          >
            Save Draft
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !url.trim()}
            className={cn(
              "flex-1 px-4 py-2 text-sm rounded-lg bg-purple-500 text-white",
              "hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors flex items-center justify-center gap-2"
            )}
          >
            <Send className="w-4 h-4" />
            Send via PushEngage
          </button>
        </div>
      )}
    </div>
  );
}

