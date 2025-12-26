/**
 * Image generation using Banana.dev or similar services
 * Supports multiple image generation APIs
 */

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

/**
 * Generate image using Banana.dev API
 * Reference: https://www.banana.dev/
 */
export async function generateImageWithBanana(
  options: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  try {
    const apiKey = process.env.BANANA_API_KEY;
    const modelKey = process.env.BANANA_MODEL_KEY || "stable-diffusion-v1-5";

    if (!apiKey) {
      return {
        success: false,
        error: "BANANA_API_KEY is not set",
      };
    }

    // Banana.dev API endpoint
    const response = await fetch("https://api.banana.dev/start/v4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        modelKey,
        startOnly: true,
        modelInputs: {
          prompt: options.prompt,
          width: options.width || 512,
          height: options.height || 512,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      return {
        success: false,
        error: data.message || "Failed to start image generation",
      };
    }

    // Poll for result
    const callId = data.id;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const checkResponse = await fetch("https://api.banana.dev/check/v4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          id: callId,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkData.finished) {
        if (checkData.modelOutputs && checkData.modelOutputs[0]?.image_base64) {
          // Convert base64 to data URL
          const imageBase64 = checkData.modelOutputs[0].image_base64;
          const imageUrl = `data:image/png;base64,${imageBase64}`;
          
          return {
            success: true,
            imageUrl,
          };
        } else if (checkData.modelOutputs && checkData.modelOutputs[0]?.image_url) {
          return {
            success: true,
            imageUrl: checkData.modelOutputs[0].image_url,
          };
        } else {
          return {
            success: false,
            error: "No image in response",
          };
        }
      }

      if (checkData.failed) {
        return {
          success: false,
          error: checkData.message || "Image generation failed",
        };
      }

      attempts++;
    }

    return {
      success: false,
      error: "Image generation timeout",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to generate image",
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
  // Try Banana.dev first
  if (process.env.BANANA_API_KEY) {
    return generateImageWithBanana(options);
  }

  // Add other image generation services here
  // e.g., Replicate, Stability AI, OpenAI DALL-E, etc.

  return {
    success: false,
    error: "No image generation service configured",
  };
}

