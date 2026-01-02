import { getSiteByID } from "@/lib/pushengage-api";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Get site ID from query parameter or environment variable
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || process.env.PUSHENGAGE_DASHBOARD_SITE_ID;

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required. Provide it as a query parameter or set PUSHENGAGE_DASHBOARD_SITE_ID environment variable." },
        { status: 400 }
      );
    }

    const siteData = await getSiteByID(siteId);

    // Check if the API response indicates failure
    if (!siteData || siteData.error) {
      // Extract error message properly - ensure it's always a string
      let errorMsg = "Failed to fetch site data";
      if (siteData?.error) {
        if (typeof siteData.error === 'string') {
          errorMsg = siteData.error;
        } else if (siteData.error?.message) {
          errorMsg = typeof siteData.error.message === 'string' 
            ? siteData.error.message 
            : JSON.stringify(siteData.error.message);
        } else {
          errorMsg = JSON.stringify(siteData.error);
        }
      } else if (siteData?.message) {
        errorMsg = typeof siteData.message === 'string' 
          ? siteData.message 
          : JSON.stringify(siteData.message);
      }
      
      return NextResponse.json(
        { 
          error: errorMsg,
          success: false,
        },
        { status: siteData?.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: siteData,
    });
  } catch (error: any) {
    console.error("Error fetching PushEngage site:", error);
    
    // Extract error message properly - ensure it's always a string
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      errorMessage = error.message || String(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      // Ensure message is a string, not an object
      errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
    } else if (error?.error) {
      // Ensure error is a string, not an object
      errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract meaningful info from the error object
      if (error.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else {
      errorMessage = String(error);
    }
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}

