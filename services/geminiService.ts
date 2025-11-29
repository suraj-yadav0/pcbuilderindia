import { GoogleGenAI, Type } from "@google/genai";
import { PartType, ComponentData, CompatibilityResult, BuildState } from "../types";

// Helper to get AI instance (handles key selection)
const getAI = async (): Promise<GoogleGenAI> => {
  // Check for API Key presence first
  if (!process.env.API_KEY) {
      // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchComponents = async (category: PartType, query: string = ""): Promise<ComponentData[]> => {
  try {
    const ai = await getAI();
    
    const prompt = `
      Generate a realistic list of 6 PC components available in India for the category: ${category}.
      ${query ? `Search query context: ${query}` : 'Focus on popular, high-value, and high-performance parts.'}
      
      Prices must be in Indian Rupee (INR). 
      Retailers should be a mix of Amazon.in, MDComputers, Vedant Computers.
      Images should be placeholder URLs from unsplash or picsum that represent tech/hardware.
      Specs should be realistic technical specifications.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              image: { type: Type.STRING },
              type: { type: Type.STRING },
              specs: { 
                type: Type.OBJECT,
                properties: {
                    socket: { type: Type.STRING, nullable: true },
                    speed: { type: Type.STRING, nullable: true },
                    capacity: { type: Type.STRING, nullable: true },
                    wattage: { type: Type.STRING, nullable: true },
                    chipset: { type: Type.STRING, nullable: true },
                }
              },
              rating: { type: Type.NUMBER },
              retailer: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["id", "name", "price", "type", "retailer"]
          }
        }
      }
    });

    if (response.text) {
        const rawData = JSON.parse(response.text);
        // Map data to ensure strict type safety/enums where the AI might have been loose
        return rawData.map((item: any) => ({
            ...item,
            image: `https://picsum.photos/seed/${item.id}/200/200`, // Ensure valid image
            type: category // Force category consistency
        }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch components", error);
    return [];
  }
};

export const checkCompatibility = async (build: BuildState): Promise<CompatibilityResult> => {
  try {
    const ai = await getAI();
    
    // Prepare build summary string
    const buildSummary = Object.entries(build)
      .map(([type, part]) => `${type}: ${part?.name} (Specs: ${JSON.stringify(part?.specs)})`)
      .join('\n');

    const prompt = `
      Analyze this PC build for compatibility issues, wattage, and bottlenecks.
      Build Parts:
      ${buildSummary}
      
      If the build is incomplete, analyze only the present parts.
      Calculate estimated total wattage.
      Identify if CPU fits Motherboard socket.
      Identify if PSU is sufficient.
      Identify any major bottlenecks (e.g. powerful GPU weak CPU).
      Give an 'AI Score' from 0-100 for value/performance balance.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCompatible: { type: Type.BOOLEAN },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedWattage: { type: Type.NUMBER },
            bottleneck: { type: Type.STRING },
            aiScore: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No analysis returned");

  } catch (error) {
    console.error("Compatibility check failed", error);
    return {
        isCompatible: true,
        issues: ["Could not verify compatibility (AI Error)"],
        notes: [],
        estimatedWattage: 0,
        bottleneck: "Unknown",
        aiScore: 0
    };
  }
};
