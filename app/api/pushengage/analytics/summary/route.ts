import { getAnalyticsSummary } from "@/lib/pushengage-api";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || process.env.PUSHENGAGE_DASHBOARD_SITE_ID;
    const startDate = searchParams.get("start_created_at");
    const endDate = searchParams.get("end_created_at");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const summary = await getAnalyticsSummary(siteId, startDate || undefined, endDate || undefined);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("Error fetching analytics summary:", error);
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : "Internal server error";
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}

