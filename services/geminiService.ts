import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes the user's photo to suggest eras or describe features.
 * Uses gemini-3-pro-preview as requested for "Analyze images".
 */
export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = getClient();
  
  // Clean base64 string if needed
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this person's features (expression, hair, accessories) and suggest 3 fun historical or fictional eras they would fit into perfectly. 
            Return ONLY a valid JSON object with this structure:
            {
              "description": "Short description of the person's vibe",
              "suggestedEras": [
                { "name": "Era Name", "reason": "Why it fits" }
              ]
            }`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    // Fallback if analysis fails
    return {
      description: "A mysterious time traveler.",
      suggestedEras: [
        { name: "Victorian Detective", reason: "Classic and sharp." },
        { name: "Sci-Fi Pilot", reason: "Ready for the future." },
        { name: "Renaissance Artist", reason: "Creative aura." }
      ]
    };
  }
};

/**
 * Generates the time travel image.
 * Uses gemini-2.5-flash-image as requested for the "Nano banana powered app" functionality (editing/generation).
 */
export const generateTimeTravelImage = async (base64Image: string, promptModifier: string): Promise<string> => {
  const ai = getClient();
  
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  // Improved prompt for editing tasks to ensure the model understands it should edit the provided image
  const prompt = `Edit this image. Transform the person in the photo to be ${promptModifier}. Preserve the person's facial features and identity.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // Extract the image from the response parts
    const parts = response.candidates?.[0]?.content?.parts;
    
    // Check for safety blocks or empty responses
    if (!parts || parts.length === 0) {
      throw new Error("No content generated. The request might have been blocked by safety filters.");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // If no image found, check if there's a text explanation (often occurs if prompt is refused)
    const textPart = parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`Gemini could not generate the image: ${textPart.text}`);
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};