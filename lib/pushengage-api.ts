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
    const baseUrl = process.env.PUSHENGAGE_REST_API_URL || "https://api.pushengage.com";
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

export async function getSiteByID(siteId: string): Promise<any> {
  try {
    const authKey = process.env.PUSHENGAGE_DASHBOARD_AUTH_KEY;
    
    // Use the same base URL pattern as image upload
    // The base URL should be: https://staging-app.pushengage.com/d/v1
    let baseUrl = process.env.PUSHENGAGE_DASHBOARD_API_URL || "https://staging-app.pushengage.com/d/v1";
    
    // Remove trailing slash if present to avoid double slashes
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    // Construct URL - ensure no double slashes by normalizing
    const apiUrl = `${baseUrl}/sites/${siteId}`.replace(/([^:]\/)\/+/g, '$1');
    
    if (!authKey) {
      throw new Error("PUSHENGAGE_DASHBOARD_AUTH_KEY is not configured");
    }

    console.log("Fetching site data:", { apiUrl, siteId, hasAuthKey: !!authKey });

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("API Error Response:", { status: response.status, statusText: response.statusText, body: errorText });
      
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      
      // Extract error message from various possible formats - ensure it's always a string
      let errorMessage: string;
      if (typeof errorData?.message === 'string') {
        errorMessage = errorData.message;
      } else if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData?.error?.message && typeof errorData.error.message === 'string') {
        errorMessage = errorData.error.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else {
        errorMessage = `Failed to fetch site: ${response.status} ${response.statusText}`;
        // Log the full error data for debugging
        console.error("Unhandled error format:", JSON.stringify(errorData, null, 2));
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Site API Response:", JSON.stringify(data, null, 2));
    
    // Check if the response data itself indicates an error
    if (data && typeof data === 'object' && (data.error || data.success === false)) {
      let errorMsg: string;
      if (typeof data.error === 'string') {
        errorMsg = data.error;
      } else if (typeof data.message === 'string') {
        errorMsg = data.message;
      } else if (data.error?.message && typeof data.error.message === 'string') {
        errorMsg = data.error.message;
      } else if (data.error && typeof data.error === 'object') {
        errorMsg = JSON.stringify(data.error);
      } else {
        errorMsg = 'Failed to fetch site data';
      }
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error: any) {
    // Log the raw error for debugging
    console.error("Error fetching site by ID - Raw error:", error);
    console.error("Error type:", typeof error);
    console.error("Error instanceof Error:", error instanceof Error);
    if (error && typeof error === 'object') {
      console.error("Error keys:", Object.keys(error));
      console.error("Error stringified:", JSON.stringify(error, null, 2));
    }
    
    // Ensure we always throw an Error instance with a proper string message
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message || String(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      // Ensure message is a string, not an object
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.message instanceof Error) {
        errorMessage = error.message.message || String(error.message);
      } else {
        errorMessage = JSON.stringify(error.message);
      }
    } else if (error?.error) {
      // Ensure error is a string, not an object
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error instanceof Error) {
        errorMessage = error.error.message || String(error.error);
      } else {
        errorMessage = JSON.stringify(error.error);
      }
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract any meaningful information
      const errorStr = JSON.stringify(error);
      if (errorStr !== '{}' && errorStr !== 'null') {
        errorMessage = errorStr;
      } else {
        errorMessage = 'Unknown error occurred while fetching site data';
      }
    } else {
      errorMessage = String(error);
    }
    
    console.error("Final error message:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getNotifications(
  siteId: string,
  limit: number = 10,
  page: number = 1
): Promise<any> {
  try {
    const authKey = process.env.PUSHENGAGE_DASHBOARD_AUTH_KEY;
    let baseUrl = process.env.PUSHENGAGE_DASHBOARD_API_URL || "https://staging-app.pushengage.com/d/v1";
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    const apiUrl = `${baseUrl}/sites/${siteId}/notifications?limit=${limit}&page=${page}`.replace(/([^:]\/)\/+/g, '$1');
    
    if (!authKey) {
      throw new Error("PUSHENGAGE_DASHBOARD_AUTH_KEY is not configured");
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData?.message || errorData?.error || `Failed to fetch notifications: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function getAnalyticsSummary(
  siteId: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    const authKey = process.env.PUSHENGAGE_DASHBOARD_AUTH_KEY;
    let baseUrl = process.env.PUSHENGAGE_DASHBOARD_API_URL || "https://staging-app.pushengage.com/d/v1";
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    let apiUrl = `${baseUrl}/sites/${siteId}/analytics/summary?expand=analytics_in_metadata`;
    if (startDate) {
      apiUrl += `&start_created_at=${startDate}`;
    }
    if (endDate) {
      apiUrl += `&end_created_at=${endDate}`;
    }
    apiUrl = apiUrl.replace(/([^:]\/)\/+/g, '$1');
    
    if (!authKey) {
      throw new Error("PUSHENGAGE_DASHBOARD_AUTH_KEY is not configured");
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData?.message || errorData?.error || `Failed to fetch analytics summary: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching analytics summary:", error);
    throw error;
  }
}

export async function getNotificationResultSummary(
  siteId: string
): Promise<any> {
  try {
    const authKey = process.env.PUSHENGAGE_DASHBOARD_AUTH_KEY;
    let baseUrl = process.env.PUSHENGAGE_DASHBOARD_API_URL || "https://staging-app.pushengage.com/d/v1";
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    const apiUrl = `${baseUrl}/sites/${siteId}/analytics/notification-result/summary?include_meta=total,curr`.replace(/([^:]\/)\/+/g, '$1');
    
    if (!authKey) {
      throw new Error("PUSHENGAGE_DASHBOARD_AUTH_KEY is not configured");
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData?.message || errorData?.error || `Failed to fetch notification result summary: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching notification result summary:", error);
    throw error;
  }
}