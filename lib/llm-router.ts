/**
 * LLM Router v6 — Respuestas LIMPIAS, gratis primero (Aizüa Beauty)
 * ==============================================================
 * Problema que resuelve: algunos modelos "razonan en voz alta" y vuelcan
 * su cadena de pensamiento en el contenido (el usuario ve el razonamiento
 * en vez de la respuesta del personaje). v6 lo evita:
 *
 *   1. SANEA la salida: elimina bloques <think>/<reasoning>/etc.
 *   2. DETECTA razonamiento filtrado (aunque no tenga etiquetas) y, si lo ve,
 *      DESCARTA esa salida y pasa al siguiente modelo.
 *   3. Da MARGEN de tokens para que el modelo termine de razonar y emita
 *      la respuesta final (que luego saneamos).
 *   4. CASCADA gratis→barato→fiable. Nunca deja al usuario sin respuesta limpia.
 *
 * v6 (29/07/2026, migración de cuenta OpenCode a miguel@aizualabs.com):
 *   - Cascadas rediseñadas con benchmark REAL contra los 23 modelos de OpenCode
 *     Go (no por catálogo): minimax-m2.7 quedó descartado de chat/visión porque
 *     alucinaba datos frente a minimax-m3; kimi-k2.6 sigue siendo el mejor para
 *     generación larga pero es MALO para chat en vivo (lento, a veces vacío).
 *   - FIX de fiabilidad: un HTTP 401 de OpenCode (p.ej. saldo agotado,
 *     "CreditsError") ya NO corta la cascada — antes hacía throw() inmediato y
 *     el usuario se quedaba sin fallback a Anthropic aunque este tuviera saldo.
 *     Ahora un 401 se trata como cualquier otro fallo de modelo: se prueba el
 *     siguiente, y solo se lanza excepción si TODOS los modelos de ambos
 *     proveedores fallan.
 *   - Timeout por intento aplicado a AMBOS proveedores (antes Anthropic no
 *     tenía timeout en store/beauty y una llamada colgada agotaba el límite
 *     de la función de Vercel sin dar oportunidad a Anthropic).
 *
 * Cascada (preferCheap = chat en vivo — widgets, agente SaaS, tutor):
 *   1. minimax-m3   (OpenCode, rápido Y fiel a la base de conocimiento)
 *   2. mimo-v2.5    (OpenCode, algo más lento pero igual de fiel)
 *   3. glm-5.1      (OpenCode, muy rápido, red de calidad aceptable)
 *   4. claude-3-5-haiku  (Anthropic, red de seguridad)
 *   5. claude-3-haiku    (Anthropic, último recurso)
 *
 * Cascada (default, generación larga — sin presión de latencia):
 *   kimi-k2.6 → kimi-k2.5 → minimax-m3 → glm-5.1 → claude-sonnet-4-6 → claude-3-5-haiku
 *
 * Env: OPENCODE_API_KEY (1-3) · ANTHROPIC_API_KEY (red de seguridad)
 */

const OPENCODE_BASE = "https://opencode.ai/zen/go/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Timeout por intento de modelo. Separado por cascada: la de chat no debe
// acercarse al maxDuration de la función de Vercel; la de contenido tolera
// más porque kimi-k2.6 legítimamente puede tardar 30-40s en generación larga
// (mide bien: benchmark real 29/07/2026, mediana 6s, peor caso observado 35s).
const PER_MODEL_TIMEOUT_MS_CHEAP = 20_000;
const PER_MODEL_TIMEOUT_MS_DEFAULT = 45_000;

// Cascada completa — kimi-k2.6 razona mucho (sirve para generación, no chat)
const OPENCODE_MODELS = ["kimi-k2.6", "kimi-k2.5", "minimax-m3", "glm-5.1"];

// Cascada barata/chat — NUNCA kimi-k2.6 (lento e inestable en esta carga: el
// benchmark real lo vio tardar hasta 77s o devolver contenido vacío con los
// max_tokens típicos de un turno de chat). minimax-m3 fue el único modelo
// rápido (~4s) que acertó SIEMPRE los datos de la base de conocimiento.
const OPENCODE_MODELS_CHEAP = ["minimax-m3", "mimo-v2.5", "glm-5.1"];

const ANTHROPIC_MODELS       = ["claude-sonnet-4-6", "claude-3-5-haiku-20241022"];
const ANTHROPIC_MODELS_CHEAP = ["claude-3-5-haiku-20241022", "claude-3-haiku-20240307"];

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMRouteOptions {
  system?: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  preferCheap?: boolean;
  tag?: string;
}

export interface LLMRouteResult {
  text: string;
  provider: "opencode" | "anthropic";
  model: string;
}

// ── Saneado de razonamiento ─────────────────────────────────────────────

const REASONING_TAGS = "think|thinking|thought|reason|reasoning|analysis|scratchpad|reflection";

/**
 * Limpia bloques de razonamiento del texto.
 * Devuelve null si tras limpiar no queda una respuesta real (todo era razonamiento).
 */
export function sanitizeReply(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let t = raw;

  // 1. Eliminar bloques cerrados <think>...</think>, <reasoning>...</reasoning>, etc.
  t = t.replace(new RegExp(`<(${REASONING_TAGS})[^>]*>[\\s\\S]*?<\\/(${REASONING_TAGS})>`, "gi"), "");

  // 2. Si queda una etiqueta de razonamiento ABIERTA sin cerrar (respuesta cortada
  //    a mitad del razonamiento) → todo lo que va después es razonamiento: lo quitamos.
  const openTag = t.match(new RegExp(`<(${REASONING_TAGS})[^>]*>`, "i"));
  if (openTag && typeof openTag.index === "number") {
    t = t.slice(0, openTag.index);
  }

  t = t.trim();
  if (!t) return null;
  return t;
}

/**
 * Heurística: ¿el texto parece razonamiento interno filtrado (sin etiquetas)?
 * Frases meta inequívocas que un personaje JAMÁS le diría a un usuario.
 * Conservadora: ante la duda preferimos descartar y probar otro modelo
 * (siempre hay fallback fiable), nunca mostrar razonamiento.
 */
export function looksLikeLeakedReasoning(t: string): boolean {
  const lower = t.toLowerCase();

  const metaPhrases = [
    "el usuario ha proporcionado", "el usuario quiere", "el usuario está",
    "el usuario me ha", "el usuario ha dicho", "el usuario acaba",
    "el usuario pregunta", "el usuario ha preguntado", "el cliente pregunta",
    "respuestas parciales", "me falta saber",
    "necesito calificar", "necesito preguntar", "necesito averiguar",
    "mi objetivo es preguntar", "mi objetivo es calificar",
    "según mis instrucciones", "según las instrucciones", "revisando las instrucciones",
    "según mis reglas", "según el system", "mi tarea es",
    "tengo que preguntar", "debo preguntar",
    "debo responder", "debo contestar", "debo actuar como",
    "voy a responder", "voy a contestar", "mi respuesta será",
    "para responder a", "para contestar", "como personaje",
    "como marta", "como alex", "como lucía", "como lucia",
    "el personaje que", "estoy actuando como", "mi rol es",
    "the user has provided", "the user wants", "the user said",
    "the user is asking", "the user asks",
    "i need to ask", "i should ask", "let me think", "let me analyze",
    "my goal is to", "i need to respond", "i should respond",
    "i will respond", "as the character", "my role is",
    "according to my instructions", "according to the instructions",
    "system prompt", "step 1:", "paso 1:",
    "preguntas son:", "ya tengo respuestas",
    // Francés / Italiano (el chat puede recibirlos en otros idiomas)
    "l'utilisateur", "je dois répondre", "je vais répondre", "selon les instructions",
    "l'utente", "devo rispondere", "secondo le istruzioni",
  ];
  let hits = 0;
  for (const p of metaPhrases) if (lower.includes(p)) hits++;

  const startsReasoning = /^(okay[,.\s]|alright[,.\s]|the user\b|el usuario\b|l'utilisateur\b|l'utente\b|i need to\b|i should\b|debo\b|voy a (responder|contestar)|let me (think|see|analyze|check)|déjame (pensar|analizar)|vamos a (analizar|calificar)|primero[,.] (voy|necesito|tengo)|revisando\b|analizando\b)/i
    .test(t.trim());

  return startsReasoning || hits >= 2;
}

// ── Router ──────────────────────────────────────────────────────────────

const NO_REASONING_SUFFIX =
  "\n\n[FORMATO DE SALIDA] Devuelve únicamente el resultado final solicitado (el mensaje para el usuario o el JSON pedido). NO muestres tu razonamiento, tu plan, tus notas internas ni pasos numerados de análisis. Habla siempre como el personaje, en su voz, sin meta-comentarios.";

/** ¿Es un fallo "de proveedor" (saldo agotado, rate limit, servidor caído) que debe
 *  degradar al siguiente modelo/proveedor, en vez de un fallo de programación? Sí para
 *  cualquier respuesta no-200 de OpenCode — incluido 401 (OpenCode usa 401 para
 *  "CreditsError", no solo para key inválida; no hay forma fiable de distinguirlos
 *  sin acoplarse al texto exacto del error, así que se trata siempre como degradable). */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

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

  if (!opencodeKey && !anthropicKey) {
    throw new Error(`[LLM ${tag}] Sin OPENCODE_API_KEY ni ANTHROPIC_API_KEY`);
  }

  const perModelTimeout = preferCheap ? PER_MODEL_TIMEOUT_MS_CHEAP : PER_MODEL_TIMEOUT_MS_DEFAULT;

  // Antirrazonamiento: reforzamos en el system que solo emita el resultado final.
  const sys = (system ?? "") + NO_REASONING_SUFFIX;

  // Margen de tokens: damos espacio para que los modelos que razonan terminen
  // y emitan la respuesta final (que luego saneamos). La cascada de contenido
  // (kimi-k2.6 primero) necesita más margen que la de chat: benchmark real
  // muestra content=None con poco margen porque el razonamiento se come el budget.
  const ocMaxTokens = Math.max(maxTokens, 700) + (preferCheap ? 0 : 3000);

  const baseMessages = [
    { role: "system" as const, content: sys },
    ...messages,
  ];

  let lastError = "";

  // ── 1-3. OpenCode (gratis, plano) ─────────────────────────────────────
  if (opencodeKey) {
    const modelsToTry = preferCheap ? OPENCODE_MODELS_CHEAP : OPENCODE_MODELS;
    for (const model of modelsToTry) {
      try {
        const res = await fetchWithTimeout(OPENCODE_BASE, {
          method: "POST",
          headers: {
            Authorization:  `Bearer ${opencodeKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages: baseMessages, max_tokens: ocMaxTokens, temperature, stream: false }),
        }, perModelTimeout);

        if (!res.ok) {
          // FIX v6: un 401 (incl. saldo agotado / CreditsError) YA NO corta la
          // cascada — se prueba el siguiente modelo igual que cualquier otro fallo.
          const t = await res.text().catch(() => "");
          lastError = `${model} HTTP ${res.status}: ${t.slice(0, 150)}`;
          console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
          continue;
        }

        const data = await res.json();
        const rawText: string | null | undefined = data?.choices?.[0]?.message?.content;
        const cleaned = sanitizeReply(rawText);

        if (!cleaned) {
          lastError = `${model} content vacio/solo-razonamiento (finish: ${data?.choices?.[0]?.finish_reason ?? "?"})`;
          console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
          continue;
        }
        if (looksLikeLeakedReasoning(cleaned)) {
          lastError = `${model} salida = razonamiento filtrado`;
          console.warn(`[LLM ${tag}] ${lastError} — descartando, siguiente`);
          continue;
        }

        console.log(`[LLM ${tag}] OK opencode/${model}`);
        return { text: cleaned, provider: "opencode", model };

      } catch (err: unknown) {
        // Timeouts y errores de red también degradan al siguiente modelo, nunca cortan la cascada.
        const msg = err instanceof Error ? err.message : String(err);
        lastError = `${model}: ${msg.slice(0, 150)}`;
        console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
      }
    }
    console.warn(`[LLM ${tag}] OpenCode no dio respuesta limpia — escalando a Anthropic`);
  }

  // ── 4-5. Anthropic (red de seguridad: fiable y sin razonamiento filtrado) ──
  if (!anthropicKey) {
    throw new Error(`[LLM ${tag}] OpenCode sin respuesta limpia y sin ANTHROPIC_API_KEY. Ultimo: ${lastError}`);
  }

  const anthropicModels = preferCheap ? ANTHROPIC_MODELS_CHEAP : ANTHROPIC_MODELS;

  for (const model of anthropicModels) {
    try {
      const res = await fetchWithTimeout(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type":      "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens:  maxTokens,
          temperature,
          system: sys,
          messages,
        }),
      }, perModelTimeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastError = `anthropic/${model} HTTP ${res.status}: ${JSON.stringify(err).slice(0, 200)}`;
        // Degradar al siguiente modelo salvo que sea el último — nunca cortar en seco
        // (antes solo se reintentaba en 404/not_found; un 400 de saldo insuficiente
        // debe poder pasar al siguiente modelo/proveedor tambien, no solo not_found).
        console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
        continue;
      }

      const data = await res.json();
      const cleaned = sanitizeReply(data.content?.[0]?.text ?? "");
      if (!cleaned) { lastError = `anthropic/${model} respuesta vacia`; continue; }

      console.log(`[LLM ${tag}] OK anthropic/${model} (fallback)`);
      return { text: cleaned, provider: "anthropic", model };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `anthropic/${model}: ${msg.slice(0, 150)}`;
      console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
    }
  }

  throw new Error(`[LLM ${tag}] Todos los modelos fallaron. Ultimo: ${lastError}`);
}
