import { generateImage } from "@/lib/image-generation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, width, height } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await generateImage({
      prompt,
      width: width || 512,
      height: height || 512,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

