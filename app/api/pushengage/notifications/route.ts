import { getNotifications } from "@/lib/pushengage-api";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || process.env.PUSHENGAGE_DASHBOARD_SITE_ID;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const notifications = await getNotifications(siteId, limit, page);

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}

