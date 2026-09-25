import { AIProvider } from "./types";
import { callOpenAICompatible } from "./openai-compatible";

export function customProvider(): AIProvider {
  const baseUrl = process.env.CUSTOM_AI_BASE_URL;
  const model = process.env.CUSTOM_AI_MODEL;
  if (!baseUrl || !model) {
    throw new Error(
      "AI_PROVIDER=custom requires both CUSTOM_AI_BASE_URL and CUSTOM_AI_MODEL."
    );
  }

  return {
    id: "custom",
    complete: (req) =>
      callOpenAICompatible(
        {
          baseUrl,
          apiKey: process.env.CUSTOM_AI_API_KEY,
          model,
        },
        req
      ),
  };
}
