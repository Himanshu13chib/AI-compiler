import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// Fallback chain for Gemini Free Tier rate-limits
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest",
];

// Determine initial model
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
let activeModelName: string | null = null;

export function getActiveModelName(): string {
  if (!activeModelName) {
    activeModelName = DEFAULT_MODEL;
  }
  return activeModelName;
}

export function getModel(modelName = getActiveModelName()): GenerativeModel {
  return getGeminiClient().getGenerativeModel({ model: modelName });
}

export async function generateJSON<T>(
  prompt: string,
  systemInstruction: string,
  retries = 5
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    const currentModel = getActiveModelName();
    const model = getModel(currentModel);
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });
      
      const text = result.response.text();
      const cleaned = cleanAndRepairJSON(text);
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error(`[Attempt ${attempt + 1}/${retries}] generateJSON failed on model ${currentModel}:`, err);
      
      const isRateLimit = 
        String(err).includes("429") || 
        String(err).includes("quota") || 
        String(err).includes("rate-limits") || 
        String(err).includes("exceeded") ||
        String(err).includes("limit: 20");
      
      if (isRateLimit) {
        // Find next model in fallback list
        const currentIndex = FALLBACK_MODELS.indexOf(currentModel);
        if (currentIndex !== -1 && currentIndex < FALLBACK_MODELS.length - 1) {
          const nextModel = FALLBACK_MODELS[currentIndex + 1];
          console.warn(`[API QUOTA EXCEEDED] Automatically falling back from ${currentModel} to ${nextModel}...`);
          activeModelName = nextModel;
          // Retry immediately with the new model
          attempt++;
          continue;
        }
      }
      
      if (attempt === retries - 1) {
        throw new Error(`JSON generation failed after ${retries} attempts: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      const delayMs = isRateLimit ? 10000 * (attempt + 1) : 2000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delayMs));
      attempt++;
    }
  }
  throw new Error("Failed to generate JSON after retries");
}

export async function generateText(
  prompt: string,
  systemInstruction: string,
  retries = 3
): Promise<string> {
  let attempt = 0;
  while (attempt < retries) {
    const currentModel = getActiveModelName();
    const model = getModel(currentModel);
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
      });
      return result.response.text();
    } catch (err) {
      console.error(`[Attempt ${attempt + 1}/${retries}] generateText failed on model ${currentModel}:`, err);
      
      const isRateLimit = 
        String(err).includes("429") || 
        String(err).includes("quota") || 
        String(err).includes("rate-limits") || 
        String(err).includes("exceeded") ||
        String(err).includes("limit: 20");
        
      if (isRateLimit) {
        const currentIndex = FALLBACK_MODELS.indexOf(currentModel);
        if (currentIndex !== -1 && currentIndex < FALLBACK_MODELS.length - 1) {
          const nextModel = FALLBACK_MODELS[currentIndex + 1];
          console.warn(`[API QUOTA EXCEEDED] Automatically falling back from ${currentModel} to ${nextModel}...`);
          activeModelName = nextModel;
          attempt++;
          continue;
        }
      }
      
      if (attempt === retries - 1) {
        throw err;
      }
      
      const delayMs = isRateLimit ? 10000 * (attempt + 1) : 2000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delayMs));
      attempt++;
    }
  }
  throw new Error("Failed to generate text after retries");
}

export async function* generateStream(
  prompt: string,
  systemInstruction: string
): AsyncGenerator<string> {
  const model = getModel();
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

function cleanAndRepairJSON(rawText: string): string {
  let text = rawText.trim();
  
  // Remove markdown code blocks if present
  text = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();

  // Fix literal newlines inside double-quoted strings
  text = text.replace(/"([^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  });

  // Try to parse. If it succeeds, return immediately.
  try {
    JSON.parse(text);
    return text;
  } catch {
    // Continue to repair
  }

  // Count braces, brackets, and quotes to auto-close
  const stack: ("object" | "array")[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") stack.push("object");
      else if (char === "}") stack.pop();
      else if (char === "[") stack.push("array");
      else if (char === "]") stack.pop();
    }
  }

  if (inString) {
    text += '"';
  }

  // Clean trailing punctuation
  text = text.trim()
    .replace(/,\s*$/, "")
    .replace(/:\s*$/, "")
    .replace(/,\s*"\w+"\s*:\s*$/, "")
    .replace(/,\s*[^,]+$/, "");

  // Close remaining items on stack
  while (stack.length > 0) {
    const type = stack.pop();
    if (type === "object") {
      text = text.trim().replace(/,\s*$/, "").replace(/:\s*$/, "") + "}";
    } else if (type === "array") {
      text = text.trim().replace(/,\s*$/, "") + "]";
    }
  }

  return text;
}
