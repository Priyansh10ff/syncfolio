export type CompletionRequest = {
  system: string;
  user: string;
  maxTokens: number;
};

export type AIProvider = {
  /** Short id, used in error messages — "anthropic", "openai", "gemini", "local", "custom". */
  id: string;
  /** Sends the request, returns the raw text of the model's reply. */
  complete(req: CompletionRequest): Promise<string>;
};

export type ProviderId = "anthropic" | "openai" | "gemini" | "local" | "custom";

/**
 * Resolves which provider to use. If AI_PROVIDER is set explicitly, that
 * wins. Otherwise, the first provider with a key/config present is used —
 * so a fresh clone with only ANTHROPIC_API_KEY set just works, and someone
 * running everything locally only needs LOCAL_AI_BASE_URL.
 */
export function resolveProviderId(): ProviderId | null {
  const explicit = process.env.AI_PROVIDER as ProviderId | undefined;
  if (explicit) return explicit;

  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LOCAL_AI_BASE_URL) return "local";
  if (process.env.CUSTOM_AI_BASE_URL) return "custom";
  return null;
}

export function isAIConfigured(): boolean {
  return resolveProviderId() !== null;
}
