/**
 * Sarvam AI Chat Completions Module
 * Uses Sarvam 105B conversational foundation models (sarvam-105b-conversations / sarvam-105b)
 * to provide fluent, multilingual Indian agricultural intelligence.
 */

import { sarvamFetch } from "./client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

const DEFAULT_MODEL = "sarvam-105b-conversations";
const FALLBACK_MODEL = "sarvam-105b";

/**
 * Calls Sarvam AI Chat Completions endpoint.
 * Returns generated text response.
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 400,
    timeoutMs = 25000,
  } = options;

  try {
    const data = await sarvamFetch<{
      choices?: Array<{
        message?: {
          role?: string;
          content?: string;
        };
      }>;
    }>("/v1/chat/completions", {
      body: {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      timeoutMs,
    });

    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) {
      return content;
    }

    throw new Error("Empty response from Sarvam chat completions");
  } catch (err: any) {
    // If primary model failed and it was the conversations model, try the base model
    if (model === DEFAULT_MODEL) {
      try {
        console.warn(`[Sarvam Chat] Retrying with fallback model ${FALLBACK_MODEL}...`);
        const fallbackData = await sarvamFetch<{
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        }>("/v1/chat/completions", {
          body: {
            model: FALLBACK_MODEL,
            messages,
            temperature,
            max_tokens: maxTokens,
          },
          timeoutMs,
        });

        const fallbackContent = fallbackData.choices?.[0]?.message?.content?.trim();
        if (fallbackContent) {
          return fallbackContent;
        }
      } catch (fbErr: any) {
        console.warn("[Sarvam Chat] Fallback model also failed:", fbErr?.message || fbErr);
      }
    }

    throw err;
  }
}
