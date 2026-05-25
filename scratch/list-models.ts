import fs from 'fs';
import path from 'path';

// Manual env loader
const envPath = "c:\\Users\\Asus\\Desktop\\internship\\appcompiler\\.env.local";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API Key");
  const ai = new GoogleGenerativeAI(apiKey);
  
  // We can call ListModels using the standard fetch since the SDK might not expose it directly or we want raw results
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  
  console.log("=== SUPPORTED MODELS ===");
  if (data.models) {
    for (const m of data.models) {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`);
      }
    }
  } else {
    console.log("Error fetching models:", data);
  }
}

main().catch(err => console.error("Error listing models:", err));
