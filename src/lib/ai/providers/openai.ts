import { AIProvider } from "./types";
import { callOpenAICompatible } from "./openai-compatible";

export function openaiProvider(): AIProvider {
  return {
    id: "openai",
    complete: (req) =>
      callOpenAICompatible(
        {
          baseUrl: "https://api.openai.com/v1",
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        },
        req
      ),
  };
}
