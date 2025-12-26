/**
 * Image generation using Gemini (Nano Banana) and Banana.dev services
 */

import { GoogleGenAI } from "@google/genai";

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

/**
 * Map requested width/height to the closest supported Gemini aspect ratio.
 * Gemini only accepts a discrete set of aspect ratios, so we find the closest match.
 */
function deriveGeminiAspectRatio(
  width?: number,
  height?: number
): string | undefined {
  if (!width || !height) {
    return undefined;
  }

  const targetRatio = width / height;
  const supportedRatios: Array<{ label: string; value: number }> = [
    { label: "1:1", value: 1 / 1 },
    { label: "2:3", value: 2 / 3 },
    { label: "3:2", value: 3 / 2 },
    { label: "3:4", value: 3 / 4 },
    { label: "4:3", value: 4 / 3 },
    { label: "4:5", value: 4 / 5 },
    { label: "5:4", value: 5 / 4 },
    { label: "9:16", value: 9 / 16 },
    { label: "16:9", value: 16 / 9 },
    { label: "21:9", value: 21 / 9 },
  ];

  let closest = supportedRatios[0];
  let smallestDiff = Math.abs(targetRatio - closest.value);

  for (let i = 1; i < supportedRatios.length; i++) {
    const diff = Math.abs(targetRatio - supportedRatios[i].value);
    if (diff < smallestDiff) {
      closest = supportedRatios[i];
      smallestDiff = diff;
    }
  }

  return closest.label;
}

/**
 * Generate an image using Google's Gemini image models (aka Nano Banana).
 * Reference: https://ai.google.dev/gemini-api/docs/image-generation#javascript
 */
export async function generateImageWithGemini(
  options: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not set",
    };
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
    });

    const model = options.model || DEFAULT_GEMINI_IMAGE_MODEL;
    const aspectRatio = deriveGeminiAspectRatio(options.width, options.height);

    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: options.prompt }],
        },
      ],
      config: aspectRatio
        ? {
            imageConfig: {
              aspectRatio,
            },
          }
        : undefined,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      return {
        success: false,
        error: "No image returned by Gemini",
      };
    }

    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;

        return {
          success: true,
          imageUrl,
        };
      }
    }

    return {
      success: false,
      error: "Gemini response did not include inline image data",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to generate image with Gemini",
    };
  }
}

/**
 * Generate image using alternative service (Replicate, Stability AI, etc.)
 * This is a placeholder for other image generation services
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  // Prefer Gemini if configured
  if (process.env.GEMINI_API_KEY) {
    return generateImageWithGemini(options);
  }

  // Add other image generation services here
  // e.g., Replicate, Stability AI, OpenAI DALL-E, etc.

  return {
    success: false,
    error: "No image generation service configured",
  };
}
