/**
 * Image generation using Gemini (Nano Banana) plus PushEngage upload support.
 */

import { GoogleGenAI } from "@google/genai";
import { Buffer } from "node:buffer";

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
const MAX_UPLOAD_BYTES = 1 * 1024 * 1024; // 1 MB
const PUSHENGAGE_UPLOAD_BASE_URL =
  "https://staging-app.pushengage.com/d/v1/sites";
const PUSHENGAGE_UPLOAD_SOURCE = "notification_large_image";

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

type SharpModule = typeof import("sharp");
let sharpPromise: Promise<SharpModule> | null = null;

async function getSharpInstance(): Promise<SharpModule> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((mod) => (mod.default ?? mod) as SharpModule)
      .catch((error) => {
        console.error("Failed to load sharp for image compression:", error);
        throw new Error(
          "Generated image exceeds the 1MB limit and image compression is unavailable (sharp import failed)."
        );
      });
  }

  return sharpPromise;
}

interface OptimizedImage {
  buffer: Buffer;
  mimeType: string;
}

async function ensureOneMegabyteLimit(
  buffer: Buffer,
  mimeType: string
): Promise<OptimizedImage> {
  if (buffer.byteLength <= MAX_UPLOAD_BYTES) {
    return { buffer, mimeType };
  }

  const sharp = await getSharpInstance();
  const qualities = [80, 70, 60, 50, 40, 35, 30, 25];

  for (const quality of qualities) {
    const candidate = await sharp(buffer)
      .resize({
        width: 768,
        height: 768,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    if (candidate.byteLength <= MAX_UPLOAD_BYTES) {
      return {
        buffer: candidate,
        mimeType: "image/webp",
      };
    }
  }

  throw new Error(
    "Generated image exceeds the 1MB limit even after compression. Try a simpler prompt or smaller dimensions."
  );
}

function extractPushEngageError(data: any, status: number): string {
  const tryString = (value: unknown): string | undefined => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    return undefined;
  };

  return (
    tryString(data?.message) ||
    tryString(data?.error) ||
    tryString(data?.error?.message) ||
    tryString(data?.errors?.[0]) ||
    (data && typeof data === "object" ? JSON.stringify(data) : undefined) ||
    `PushEngage upload failed (${status})`
  );
}

/**
 * Upload generated image bytes to PushEngage dashboard.
 */
async function uploadImageToPushEngage(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const authKey = process.env.PUSHENGAGE_DASHBOARD_AUTH_KEY;
  const siteId = process.env.PUSHENGAGE_DASHBOARD_SITE_ID;

  if (!authKey || !siteId) {
    throw new Error(
      "PUSHENGAGE_DASHBOARD_AUTH_KEY and PUSHENGAGE_DASHBOARD_SITE_ID must be set to upload images"
    );
  }

  const uploadUrl = `${PUSHENGAGE_UPLOAD_BASE_URL}/${siteId}/files?upload_source=${encodeURIComponent(
    PUSHENGAGE_UPLOAD_SOURCE
  )}`;

  const extension = mimeType.split("/")[1] || "png";
  const filename = `gemini-image-${Date.now()}.${extension}`;

  const formData = new FormData();
  const arrayBuffer = new ArrayBuffer(fileBuffer.byteLength);
  new Uint8Array(arrayBuffer).set(fileBuffer);
  const blob = new Blob([arrayBuffer], { type: mimeType });
  formData.append("file", blob, filename);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authKey,
    },
    body: formData,
  });

  const rawBody = await response.text();
  let data: any = null;

  console.log("rawBody", JSON.stringify(rawBody, null, 2));
  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  if (!response.ok) {
    throw new Error(extractPushEngageError(data, response.status));
  }

  if (!data || typeof data !== "object") {
    throw new Error(
      "PushEngage upload succeeded but returned an empty payload"
    );
  }

  const remoteUrl =
    data?.data?.url ||
    data?.data?.file_url ||
    data?.file_url ||
    data?.url ||
    data?.data?.full_url;

  if (!remoteUrl) {
    throw new Error("PushEngage upload succeeded but no file URL was returned");
  }

  return remoteUrl;
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
        const inlineData = part.inlineData;
        const mimeType = inlineData.mimeType || "image/png";
        const data = inlineData.data;

        if (!data) {
          continue;
        }

        const fileBuffer = Buffer.from(data, "base64");
        const optimized = await ensureOneMegabyteLimit(fileBuffer, mimeType);

        const uploadedUrl = await uploadImageToPushEngage(
          optimized.buffer,
          optimized.mimeType
        );

        return {
          success: true,
          imageUrl: uploadedUrl,
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
 * Generate image using available providers.
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
