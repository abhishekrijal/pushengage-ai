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

    const siteId = process.env.PUSHENGAGE_SITE_ID;
    const apiKey = process.env.PUSHENGAGE_API_KEY;

    if (!siteId || !apiKey) {
      return NextResponse.json(
        { error: "PushEngage credentials not configured" },
        { status: 500 }
      );
    }

    const result = await sendPushEngageNotification(
      {
        title,
        message,
        url,
        icon,
        image,
      },
      siteId,
      apiKey
    );

    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status }
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

