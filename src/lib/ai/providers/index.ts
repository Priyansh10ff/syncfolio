import { AIProvider, resolveProviderId, isAIConfigured } from "./types";
import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import { localProvider } from "./local";
import { customProvider } from "./custom";

export { isAIConfigured };

/** Builds the active provider from env, or throws if none is configured. */
export function getProvider(): AIProvider {
  const id = resolveProviderId();
  switch (id) {
    case "anthropic":
      return anthropicProvider();
    case "openai":
      return openaiProvider();
    case "gemini":
      return geminiProvider();
    case "local":
      return localProvider();
    case "custom":
      return customProvider();
    default:
      throw new Error("AI_NOT_CONFIGURED");
  }
}
