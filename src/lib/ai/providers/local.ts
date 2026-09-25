import { AIProvider } from "./types";
import { callOpenAICompatible } from "./openai-compatible";

export function localProvider(): AIProvider {
  const model = process.env.LOCAL_AI_MODEL;
  if (!model) {
    throw new Error(
      "LOCAL_AI_BASE_URL is set but LOCAL_AI_MODEL is missing — set it to whatever model name your local server expects (e.g. \"llama3.1\" for Ollama)."
    );
  }

  return {
    id: "local",
    complete: (req) =>
      callOpenAICompatible(
        {
          // Ollama, LM Studio, llama.cpp's server, and vLLM all default to
          // exposing an OpenAI-compatible API at /v1 on localhost.
          baseUrl: process.env.LOCAL_AI_BASE_URL || "http://localhost:11434/v1",
          apiKey: process.env.LOCAL_AI_API_KEY, // most local servers ignore this
          model,
          // Smaller/older local backends sometimes reject `response_format`
          // outright rather than ignoring it — opt out with LOCAL_AI_JSON_MODE=false.
          useJsonResponseFormat: process.env.LOCAL_AI_JSON_MODE !== "false",
        },
        req
      ),
  };
}
