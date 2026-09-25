import { CompletionRequest } from "./types";

type OpenAICompatibleConfig = {
  baseUrl: string; // e.g. "https://api.openai.com/v1", "http://localhost:11434/v1"
  apiKey?: string; // some local servers don't require one
  model: string;
  /** Most backends support `response_format: json_object`; a few older/smaller
   *  local servers reject unknown fields outright, so this can be turned off. */
  useJsonResponseFormat?: boolean;
};

export async function callOpenAICompatible(
  config: OpenAICompatibleConfig,
  { system, user, maxTokens }: CompletionRequest
): Promise<string> {
  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(config.useJsonResponseFormat !== false
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Model endpoint returned ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Model endpoint returned no message content");
  }
  return content;
}
