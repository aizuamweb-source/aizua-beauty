/**
 * LLM Router v1 — TypeScript / Vercel edition
 * =============================================
 * Prioridad:
 *   1. OpenCode Go (Kimi K2.6) — plan flat-rate, API compatible con OpenAI
 *   2. Anthropic Claude        — fallback (pago por token)
 *
 * Usar en API routes de Vercel en lugar de llamar a Anthropic directamente.
 * Añadir OPENCODE_API_KEY como env var en Vercel para activar la prioridad 1.
 *
 * Uso:
 *   import { llmRoute } from "@/lib/llm-router";
 *   const { text, provider } = await llmRoute({
 *     system: "Eres un asistente...",
 *     messages: [{ role: "user", content: "..." }],
 *     maxTokens: 1200,
 *   });
 */

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMRouteOptions {
  /** System prompt (texto plano — se convierte automáticamente al formato de cada proveedor) */
  system?: string;
  /** Historial completo de mensajes (sin el system) */
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Si true, usa claude-haiku en el fallback Anthropic (más barato para tareas simples) */
  preferCheap?: boolean;
  /** Etiqueta para logs */
  tag?: string;
}

export interface LLMRouteResult {
  text: string;
  provider: "opencode" | "anthropic";
  model: string;
}

// ── Configuración ─────────────────────────────────────────────────────────────

const OPENCODE_URL   = "https://opencode.ai/zen/go/v1/chat/completions";
const OPENCODE_MODEL = "kimi-k2.6";

const ANTHROPIC_URL     = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SONNET_MODELS = [
  "claude-sonnet-4-6",
  "claude-3-5-sonnet-20241022",
  "claude-3-sonnet-20240229",
];
const HAIKU_MODELS = [
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307",
];

// ── Implementación ────────────────────────────────────────────────────────────

export async function llmRoute({
  system,
  messages,
  maxTokens = 1500,
  temperature = 0.7,
  preferCheap = false,
  tag = "llm",
}: LLMRouteOptions): Promise<LLMRouteResult> {
  const opencodeKey  = process.env.OPENCODE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // ─── 1. OpenCode Go (Kimi K2.6) ──────────────────────────────────────────
  if (opencodeKey) {
    try {
      const body = {
        model: OPENCODE_MODEL,
        messages: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature,
      };

      const res = await fetch(OPENCODE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opencodeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        // Timeout 120s — Kimi K2.6 puede tardar con razonamiento extenso
        signal: AbortSignal.timeout(120_000),
      });

      if (res.ok) {
        const data = await res.json();
        const text: string | null = data.choices?.[0]?.message?.content ?? null;
        if (text) {
          console.log(`[LLM ${tag}] ✅ opencode/${OPENCODE_MODEL}`);
          return { text, provider: "opencode", model: OPENCODE_MODEL };
        }
        // content=null → modelo agotó tokens en razonamiento → fallback
        console.warn(`[LLM ${tag}] OpenCode content=null → fallback Anthropic`);
      } else {
        console.warn(`[LLM ${tag}] OpenCode HTTP ${res.status} → fallback Anthropic`);
      }
    } catch (err) {
      console.warn(`[LLM ${tag}] OpenCode error → fallback Anthropic:`, err);
    }
  }

  // ─── 2. Anthropic Claude (fallback) ───────────────────────────────────────
  if (!anthropicKey) {
    throw new Error(`[LLM Router ${tag}] Sin OPENCODE_API_KEY ni ANTHROPIC_API_KEY`);
  }

  const models = preferCheap ? HAIKU_MODELS : SONNET_MODELS;
  let lastErr = "";

  for (const model of models) {
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key":         anthropicKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type":      "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens:  maxTokens,
          temperature,
          ...(system ? { system } : {}),
          messages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastErr = `HTTP ${res.status} ${JSON.stringify(err).slice(0, 200)}`;
        // Solo reintentar con el siguiente modelo si es "not_found"
        if (lastErr.toLowerCase().includes("not_found") || lastErr.includes("404")) continue;
        throw new Error(`Anthropic ${lastErr}`);
      }

      const data = await res.json();
      const text: string = data.content?.[0]?.text ?? "";
      if (!text) throw new Error("Anthropic: respuesta vacía");

      console.log(`[LLM ${tag}] ✅ anthropic/${model}`);
      return { text, provider: "anthropic", model };
    } catch (err) {
      if (err instanceof Error && (err.message.includes("not_found") || err.message.includes("404"))) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`[LLM Router ${tag}] Todos los modelos fallaron. Último: ${lastErr}`);
}
