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
  apiKey: string
): Promise<PushEngageResponse> {
  try {
    // PushEngage API endpoint based on official API documentation
    const baseUrl = process.env.PUSHENGAGE_API_URL || "https://api.pushengage.com";
    const apiUrl = `${baseUrl}/notifications`;
    
    // Validate inputs
    if (!apiKey) {
      console.error("PushEngage API: Missing apiKey", { hasApiKey: !!apiKey });
      return {
        status: 400,
        message: "API key is missing",
      };
    }
    
    // Build form data for application/x-www-form-urlencoded
    // Field names must match API specification: notification_title, notification_message, notification_url
    const formData = new URLSearchParams();
    formData.append("notification_title", notification.title);
    formData.append("notification_message", notification.message);

    // Add optional fields only if provided
    if (notification.url) {
      formData.append("notification_url", notification.url);
    }

    if (notification.image) {
      formData.append("image_url", notification.image);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Api-Key": apiKey, // PushEngage requires API key in header as "Api-Key"
      },
      body: formData.toString(),
    });

    // Get response text first to handle both JSON and HTML responses
    const responseText = await response.text();
    
    // Log the raw response for debugging
    console.log("PushEngage API Response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      responsePreview: responseText.substring(0, 500), // Log first 500 chars
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type") || "";
    let data: any;
    
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        return {
          status: response.status || 500,
          message: "Invalid JSON response from API",
          data: { rawResponse: responseText.substring(0, 200) },
        };
      }
    } else {
      // Response is not JSON (likely HTML error page)
      console.error("PushEngage API returned non-JSON response:", {
        contentType,
        status: response.status,
        responsePreview: responseText.substring(0, 500),
      });
      
      // Try to extract error message from HTML if possible
      const errorMatch = responseText.match(/<title>(.*?)<\/title>/i) || 
                        responseText.match(/<h1>(.*?)<\/h1>/i) ||
                        responseText.match(/error[^<]*/i);
      
      const errorMessage = errorMatch 
        ? `API Error: ${errorMatch[1] || errorMatch[0]}` 
        : `API returned HTML instead of JSON (Status: ${response.status})`;
      
      return {
        status: response.status || 500,
        message: errorMessage,
        data: { 
          contentType,
          rawResponse: responseText.substring(0, 500),
        },
      };
    }

    // Check if the API returned an error in the response data
    // Some APIs return 200 status but include error in the payload
    if (data.success === false || data.error_code) {
      const errorMessage = data.message || data.error || "Failed to send notification";
      console.error("PushEngage API Error:", {
        error_code: data.error_code,
        message: errorMessage,
        fullResponse: data,
      });
      
      return {
        status: response.status || 400,
        message: errorMessage,
        data,
      };
    }

    if (!response.ok) {
      return {
        status: response.status,
        message: data.message || data.error || "Failed to send notification",
        data,
      };
    }

    return {
      status: 200,
      message: data.message || "Notification sent successfully",
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

