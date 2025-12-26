/**
 * PushEngage API integration
 * Reference: https://www.pushengage.com/api/rest-api/getting-started
 */

export interface PushEngageNotification {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  image?: string;
}

export interface PushEngageResponse {
  status: number;
  message: string;
  data?: any;
}

export async function sendPushEngageNotification(
  notification: PushEngageNotification,
  siteId: string,
  apiKey: string
): Promise<PushEngageResponse> {
  try {
    // PushEngage API endpoint - adjust based on actual API documentation
    // Common formats: /api/v1/notifications or /v1/sites/{siteId}/notifications
    const apiUrl = `https://api.pushengage.com/api/v1/notifications`;
    
    const requestBody: any = {
      site_id: siteId,
      title: notification.title,
      message: notification.message,
    };

    // Add optional fields only if provided
    if (notification.url) {
      requestBody.url = notification.url;
    }
    if (notification.icon) {
      requestBody.icon = notification.icon;
    }
    if (notification.image) {
      requestBody.image = notification.image;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        // Alternative: Some APIs use API key in header
        // "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        message: data.message || data.error || "Failed to send notification",
        data,
      };
    }

    return {
      status: 200,
      message: "Notification sent successfully",
      data,
    };
  } catch (error: any) {
    console.error("PushEngage API error:", error);
    return {
      status: 500,
      message: error.message || "Failed to send notification",
    };
  }
}

