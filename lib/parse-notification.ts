/**
 * Parse AI-generated notification content to extract title and body
 */
export interface ParsedNotification {
  title: string;
  body: string;
  emoji?: string;
}

export function parseNotificationContent(content: string): ParsedNotification | null {
  // Try to find structured format (Title: ... Body: ...)
  // Match "Title:" or "**Title:**" followed by content until "Body:" or end
  const titleMatch = content.match(/(?:\*\*)?Title(?:\*\*)?\s*[:]?\s*(.+?)(?:\n|Body|body|\*\*Body)/is);
  // Match "Body:" or "**Body:**" followed by content
  const bodyMatch = content.match(/(?:\*\*)?Body(?:\*\*)?\s*[:]?\s*(.+?)(?:\n\n|\n$|$)/is);
  
  if (titleMatch && bodyMatch) {
    const title = titleMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 50);
    const body = bodyMatch[1].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 150);
    
    // Check for emoji in title or body
    const emojiMatch = (title + ' ' + body).match(/([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
    const emoji = emojiMatch ? emojiMatch[1] : undefined;
    
    return {
      title: title.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
      body: body.replace(emoji ? new RegExp(emoji, 'g') : /^/, '').trim(),
      emoji,
    };
  }

  // Try to find emoji at the start
  const emojiMatch = content.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
  const emoji = emojiMatch ? emojiMatch[1] : undefined;

  // Try to split by newlines
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length >= 2) {
    // First line as title, rest as body
    return {
      title: lines[0].trim().replace(/^[:\-•]\s*/, '').substring(0, 50),
      body: lines.slice(1).join(' ').trim().substring(0, 150),
      emoji,
    };
  }

  // If single line, try to split by common separators
  const separators = [' - ', ' | ', ': ', ' — '];
  for (const sep of separators) {
    if (content.includes(sep)) {
      const parts = content.split(sep);
      if (parts.length >= 2) {
        return {
          title: parts[0].trim().substring(0, 50),
          body: parts.slice(1).join(sep).trim().substring(0, 150),
          emoji,
        };
      }
    }
  }

  // Fallback: use first 50 chars as title, rest as body
  if (content.length > 0) {
    return {
      title: content.substring(0, 50).trim(),
      body: content.substring(50, 200).trim() || content.trim().substring(0, 150),
      emoji,
    };
  }

  return null;
}

