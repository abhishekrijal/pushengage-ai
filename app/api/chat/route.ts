import { chat, toServerSentEventsStream } from "@tanstack/ai";
import { createGemini } from "@tanstack/ai-gemini";
import { getSystemPrompt } from "@/lib/push-notification-guidelines";
import { getNotifications, getAnalyticsSummary, getNotificationResultSummary } from "@/lib/pushengage-api";

// Helper function to detect if user is asking about analytics/notifications
function isAnalyticsQuery(message: string): boolean {
  const analyticsKeywords = [
    "best performing",
    "top performing",
    "performance",
    "analytics",
    "statistics",
    "stats",
    "results",
    "how did",
    "how well",
    "click rate",
    "open rate",
    "engagement",
    "resend",
    "send again",
    "reuse",
    "previous notification",
    "past notification",
    "notification history",
    "what was",
    "show me",
    "list notifications",
  ];
  const lowerMessage = message.toLowerCase();
  return analyticsKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Fetch analytics data based on query
async function fetchAnalyticsData(query: string, siteId: string) {
  try {
    // Fetch all data in parallel with error handling
    const [notificationsData, analyticsData, resultData] = await Promise.allSettled([
      getNotifications(siteId, 50, 1).catch(err => {
        console.error("Error fetching notifications:", err);
        return null;
      }),
      getAnalyticsSummary(siteId).catch(err => {
        console.error("Error fetching analytics summary:", err);
        return null;
      }),
      getNotificationResultSummary(siteId).catch(err => {
        console.error("Error fetching notification results:", err);
        return null;
      }),
    ]);
    
    return {
      notifications: notificationsData.status === 'fulfilled' && notificationsData.value ? notificationsData.value : null,
      analytics: analyticsData.status === 'fulfilled' && analyticsData.value ? analyticsData.value : null,
      results: resultData.status === 'fulfilled' && resultData.value ? resultData.value : null,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the last user message safely
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const userQuery = lastMessage && typeof lastMessage.content === 'string' ? lastMessage.content : "";
    const siteId = process.env.PUSHENGAGE_DASHBOARD_SITE_ID;
    
    // Check if this is an analytics query
    let analyticsContext = "";
    if (userQuery && isAnalyticsQuery(userQuery) && siteId) {
      console.log("Analytics query detected:", userQuery);
      try {
        const analyticsData = await fetchAnalyticsData(userQuery, siteId);
        console.log("Analytics data fetched:", {
          hasNotifications: !!analyticsData?.notifications,
          hasAnalytics: !!analyticsData?.analytics,
          hasResults: !!analyticsData?.results,
        });
        if (analyticsData && (analyticsData.notifications || analyticsData.analytics || analyticsData.results)) {
          // Format analytics data for the AI
          analyticsContext = `\n\nANALYTICS DATA AVAILABLE:\n`;
          
          if (analyticsData.notifications) {
            // Handle different response structures - API returns { status: 200, data: { data: { data: [...] } } }
            let notifications: any[] = [];
            const notifData = analyticsData.notifications;
            
            // Try to extract notifications array from various nested structures
            if (Array.isArray(notifData)) {
              notifications = notifData;
            } else if (Array.isArray(notifData.data)) {
              notifications = notifData.data;
            } else if (notifData.data && Array.isArray(notifData.data.data)) {
              notifications = notifData.data.data;
            } else if (notifData.data && notifData.data.data && Array.isArray(notifData.data.data.data)) {
              notifications = notifData.data.data.data;
            } else if (Array.isArray(notifData.notifications)) {
              notifications = notifData.notifications;
            } else if (notifData.data?.notifications && Array.isArray(notifData.data.notifications)) {
              notifications = notifData.data.notifications;
            }
            
            console.log("Parsed notifications count:", notifications.length);
            
            // Filter for push broadcasts only (or assume all are broadcasts if type not specified)
            const broadcasts = notifications.filter((n: any) => {
              const type = n.notification_type || n.type || n.notification_type_id;
              return type === "broadcast" || type === 1 || !type; // 1 might be broadcast type ID
            });
            
            if (broadcasts.length > 0) {
              analyticsContext += `\nRECENT PUSH BROADCASTS (${broadcasts.length} found):\n`;
              broadcasts.slice(0, 10).forEach((notif: any, idx: number) => {
                analyticsContext += `${idx + 1}. ID: ${notif.notification_id || notif.id || 'N/A'}\n`;
                analyticsContext += `   Title: ${notif.notification_title || notif.title || 'N/A'}\n`;
                analyticsContext += `   Message: ${notif.notification_message || notif.message || notif.body || 'N/A'}\n`;
                if (notif.sentcount || notif.sent_count || notif.sent) analyticsContext += `   Sent: ${notif.sentcount || notif.sent_count || notif.sent}\n`;
                if (notif.clickcount || notif.click_count || notif.clicks) analyticsContext += `   Clicks: ${notif.clickcount || notif.click_count || notif.clicks}\n`;
                if (notif.ctr || notif.click_rate) analyticsContext += `   Click Rate: ${((notif.ctr || notif.click_rate || 0) * 100).toFixed(2)}%\n`;
                if (notif.created_at || notif.created) analyticsContext += `   Created: ${notif.created_at || notif.created}\n`;
                if (notif.notification_url || notif.url) analyticsContext += `   URL: ${notif.notification_url || notif.url}\n`;
                analyticsContext += `\n`;
              });
            } else if (notifications.length > 0) {
              // If no broadcasts found but we have notifications, show them anyway
              analyticsContext += `\nRECENT NOTIFICATIONS (${notifications.length} found):\n`;
              notifications.slice(0, 10).forEach((notif: any, idx: number) => {
                analyticsContext += `${idx + 1}. ID: ${notif.id || notif.notification_id || 'N/A'}\n`;
                analyticsContext += `   Title: ${notif.title || notif.notification_title || 'N/A'}\n`;
                analyticsContext += `   Message: ${notif.message || notif.notification_message || notif.body || 'N/A'}\n`;
                if (notif.sent_count || notif.sent) analyticsContext += `   Sent: ${notif.sent_count || notif.sent}\n`;
                if (notif.click_count || notif.clicks) analyticsContext += `   Clicks: ${notif.click_count || notif.clicks}\n`;
                analyticsContext += `\n`;
              });
            }
          }
          
          if (analyticsData.analytics) {
            analyticsContext += `\nOVERALL ANALYTICS SUMMARY:\n`;
            analyticsContext += JSON.stringify(analyticsData.analytics, null, 2);
            analyticsContext += `\n`;
          }
          
          if (analyticsData.results) {
            analyticsContext += `\nNOTIFICATION RESULTS SUMMARY:\n`;
            analyticsContext += JSON.stringify(analyticsData.results, null, 2);
            analyticsContext += `\n`;
          }
        }
      } catch (error) {
        console.error("Error processing analytics query:", error);
        // Don't throw - continue with normal chat flow even if analytics fails
      }
    }

    // Create Gemini adapter
    const adapter = createGemini(process.env.GEMINI_API_KEY);

    // Get system prompt with guidelines and analytics capabilities
    const enhancedSystemPrompt = getSystemPrompt() + `
    
====================
ANALYTICS & NOTIFICATION MANAGEMENT CAPABILITIES
====================

You can help users with:
1. Finding their best performing push broadcasts
2. Analyzing notification performance metrics
3. Resending successful notifications
4. Viewing notification history

When users ask about:
- "best performing notification" → Analyze the notifications data and identify the one with highest click rate, engagement, or performance metrics
- "resend" or "send again" → Help them resend a notification by providing the notification details in the standard format
- "show notifications" or "list notifications" → Present a summary of recent push broadcasts
- Performance questions → Use the analytics data to provide insights

IMPORTANT FOR RESENDING:
- If user wants to resend a notification, extract the notification details (title, body, URL, image) from the analytics data
- Present it in the standard notification format so they can send it
- Focus on PUSH BROADCASTS only unless specifically asked about other types

${analyticsContext}
`;

    // Ensure we have valid messages
    const validMessages = messages
      .filter((msg: any) => msg && msg.role && (msg.content !== undefined || msg.parts !== undefined))
      .map((msg: any) => {
        let content = msg.content;
        if (content === undefined && msg.parts) {
          content = msg.parts;
        }
        if (typeof content !== 'string' && !Array.isArray(content)) {
          content = JSON.stringify(content);
        }
        return {
          role: msg.role,
          content: content,
        };
      });

    // Create chat stream
    const stream = await chat({
      adapter,
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: enhancedSystemPrompt,
        },
        ...validMessages,
      ],
    });

    // Convert to SSE stream response
    return new Response(toServerSentEventsStream(stream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

