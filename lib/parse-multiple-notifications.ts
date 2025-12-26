/**
 * Parse AI-generated content to extract multiple notification options
 */
import { ParsedNotification } from "./parse-notification";

export interface NotificationOption extends ParsedNotification {
  id: string;
  variation?: string;
}

export function parseMultipleNotifications(content: string): NotificationOption[] {
  const notifications: NotificationOption[] = [];
  
  // Pattern to match variations like "Variation 1:", "**Variation 1:**", "Option 1:", etc.
  const variationPattern = /(?:Variation|Option|Choice)\s*(\d+)[:.]?\s*\n/gi;
  const parts = content.split(variationPattern);
  
  // If we found variations, parse each one
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const variationNum = parts[i];
      const variationContent = parts[i + 1] || "";
      
      // Extract title and body from this variation
      const titleMatch = variationContent.match(/(?:\*\*)?Title(?:\*\*)?\s*[:]?\s*(.+?)(?:\n|Body|body|\*\*Body)/is);
      const bodyMatch = variationContent.match(/(?:\*\*)?Body(?:\*\*)?\s*[:]?\s*(.+?)(?:\n\n|\n(?:\*\*)?(?:Variation|Option|Choice)|\n$|$)/is);
      
      if (titleMatch && bodyMatch) {
        const title = titleMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 50);
        const body = bodyMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 150);
        
        // Extract emoji
        const emojiMatch = (title + ' ' + body).match(/([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
        const emoji = emojiMatch ? emojiMatch[1] : undefined;
        
        notifications.push({
          id: `variation-${variationNum}`,
          title: title.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
          body: body.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
          emoji,
          variation: `Variation ${variationNum}`,
        });
      }
    }
  }
  
  // If no variations found, try to parse as single notification
  if (notifications.length === 0) {
    const titleMatch = content.match(/(?:\*\*)?Title(?:\*\*)?\s*[:]?\s*(.+?)(?:\n|Body|body|\*\*Body)/is);
    const bodyMatch = content.match(/(?:\*\*)?Body(?:\*\*)?\s*[:]?\s*(.+?)(?:\n\n|\n$|$)/is);
    
    if (titleMatch && bodyMatch) {
      const title = titleMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 50);
      const body = bodyMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 150);
      
      const emojiMatch = (title + ' ' + body).match(/([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
      const emoji = emojiMatch ? emojiMatch[1] : undefined;
      
      notifications.push({
        id: "single",
        title: title.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
        body: body.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
        emoji,
      });
    }
  }
  
  return notifications;
}

