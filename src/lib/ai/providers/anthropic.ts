import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, CompletionRequest } from "./types";

export function anthropicProvider(): AIProvider {
  return {
    id: "anthropic",
    async complete({ system, user, maxTokens }: CompletionRequest) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Anthropic returned no text content");
      }
      return textBlock.text;
    },
  };
}
