import { sendPushEngageNotification } from "@/lib/pushengage-api";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, message, url, icon, image } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PUSHENGAGE_API_KEY;

    if (!apiKey) {
      console.error("PushEngage credentials missing:", {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
      });
      return NextResponse.json(
        { error: "PushEngage API key not configured" },
        { status: 500 }
      );
    }

    // Log that credentials are present (without exposing the actual key)
    console.log("PushEngage API call:", {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 8) + "...",
    });

    const result = await sendPushEngageNotification(
      {
        title,
        message,
        url,
        icon,
        image,
      },
      apiKey
    );

    // Check if the API response indicates failure (even if HTTP status is 200)
    if (result.status !== 200 || (result.data && result.data.success === false)) {
      const errorMessage = result.data?.message || result.message || "Failed to send notification";
      const errorCode = result.data?.error_code;
      
      return NextResponse.json(
        { 
          error: errorMessage,
          error_code: errorCode,
          success: false,
        },
        { status: result.status !== 200 ? result.status : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error sending PushEngage notification:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

