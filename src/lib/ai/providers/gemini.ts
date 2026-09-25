import { AIProvider } from "./types";
import { callOpenAICompatible } from "./openai-compatible";

export function geminiProvider(): AIProvider {
  return {
    id: "gemini",
    complete: (req) =>
      callOpenAICompatible(
        {
          baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        },
        req
      ),
  };
}
