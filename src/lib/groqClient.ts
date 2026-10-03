// Browser port of the Groq logic in server/index.js. Used by the static demo
// build to talk to Groq directly from the visitor's browser using a key the
// visitor supplies themselves. No key is ever bundled with the site.

import { getGroqKey } from "./demoMode";

const GROQ_BASE = "https://api.groq.com/openai/v1";

export const preferredModels = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
];

let modelCache: { apiKey: string; model: string } | null = null;

export function listGroqModels(apiKey: string) {
  return fetch(`${GROQ_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).then(async (response) => {
    if (response.status === 401) throw new Error("Your Groq API key was rejected by Groq. Check the key and try again.");
    if (!response.ok) throw new Error("Could not reach Groq to verify the key. Try again shortly.");
    const { data = [] } = await response.json();
    const available: string[] = data.map((item: { id: string }) => item.id);
    return preferredModels.find((model) => available.includes(model)) ||
      available.find((model) => !/whisper|guard|tts|playai|orpheus|compound|prompt/i.test(model)) ||
      "llama-3.3-70b-versatile";
  });
}

async function getGroqModel(apiKey: string): Promise<string> {
  if (modelCache && modelCache.apiKey === apiKey) return modelCache.model;
  let model = "";
  try {
    model = await listGroqModels(apiKey);
  } catch (error) {
    console.warn("Could not list available Groq models:", error instanceof Error ? error.message : error);
  }
  if (!model) model = "llama-3.3-70b-versatile";
  modelCache = { apiKey, model };
  return model;
}

// Parse JSON from a string, cleaning up code fences and handling partial JSON
export function parseJson(content: unknown): Record<string, unknown> {
  const cleaned = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned invalid JSON");
  }
}

export function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function findQuestionArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["questions", "interviewQuestions", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  for (const key of ["data", "result", "interview"]) {
    const nested = findQuestionArray(record[key]);
    if (nested.length) return nested;
  }
  const values = Object.values(record);
  return values.length && values.every((item) =>
    item && typeof item === "object" && !Array.isArray(item) &&
    ((item as Record<string, unknown>).question || (item as Record<string, unknown>).prompt || (item as Record<string, unknown>).text))
    ? values
    : [];
}

export interface NormalizedQuestion {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  expectedPoints: string[];
  timeLimit: string;
}

export function normalizeQuestions(value: unknown, focus: string): NormalizedQuestion[] {
  return findQuestionArray(value)
    .map((raw, index) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const item = raw as Record<string, unknown>;
      const question = [item.question, item.prompt, item.text].find((entry) => typeof entry === "string" && entry.trim());
      if (typeof question !== "string") return null;
      const expectedPoints = stringArray(item.expectedPoints || item.keyPoints || item.evaluationCriteria);
      return {
        id: Number.isInteger(Number(item.id)) && Number(item.id) > 0 ? Number(item.id) : index + 1,
        question: question.trim(),
        category: typeof item.category === "string" ? item.category : focus === "hr" ? "Behavioral" : "Technical",
        difficulty: typeof item.difficulty === "string" ? item.difficulty : "Medium",
        expectedPoints,
        timeLimit: typeof item.timeLimit === "string" ? item.timeLimit : focus === "hr" ? "5 minutes" : "3-5 minutes",
      };
    })
    .filter((item): item is NormalizedQuestion => Boolean(item))
    .slice(0, 10);
}

interface GroqJsonOptions {
  temperature?: number;
  maxTokens?: number;
}

// Send a prompt to the Groq API (directly from the browser) and return parsed JSON
export async function groqJson(systemPrompt: string, userPrompt: string, options: GroqJsonOptions = {}): Promise<Record<string, unknown>> {
  const apiKey = getGroqKey();
  if (!apiKey) {
    const error = new Error("No Groq API key saved");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  const body: Record<string, unknown> = {
    model: await getGroqModel(apiKey),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
    response_format: { type: "json_object" },
  };
  const send = () => fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let response = await send();
  if (response.status === 400) {
    delete body.response_format;
    response = await send();
  }
  if (!response.ok) {
    const error = new Error(response.status === 429 ? "Groq rate limit reached. Try again shortly." : "Groq request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  const result = await response.json();
  return parseJson(result.choices?.[0]?.message?.content);
}
