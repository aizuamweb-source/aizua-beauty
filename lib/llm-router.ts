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
 *   4. claude-haiku-4-5  (Anthropic, red de seguridad)
 *   5. claude-sonnet-5   (Anthropic, último recurso)
 *
 * Cascada (default, generación larga — sin presión de latencia):
 *   kimi-k2.6 → minimax-m3 → glm-5.1 → claude-sonnet-5 → claude-haiku-4-5
 *
 * s277: kimi-k2.5 y los IDs claude-sonnet-4-6/claude-3-5-haiku-20241022/
 * claude-3-haiku-20240307 SALEN de las cascadas. kimi-k2.5 esta RETIRADO
 * (verificado en vivo con `requests`, no `urllib` — con urllib Cloudflare
 * devuelve 403 error 1010 para CUALQUIER modelo y parece que todo esta caido
 * cuando no lo esta: "[404] No allowed providers are available for the
 * selected model"). Los 3 IDs de Anthropic no se pudieron verificar en vivo
 * porque la cuenta esta sin credito (error de facturacion antes que de
 * modelo invalido en cualquier ID probado) — se sustituyen por los 3 modelos
 * vigentes de hoy (mismo criterio ya aplicado en llm_router.py del Business
 * System, commit 07b90f9). Mientras no haya credito esto no cambia el
 * comportamiento observable (las 5 vias de la cascada de pago siguen
 * fallando igual), pero deja el fallback listo para el dia que se recargue.
 *
 * Env: OPENCODE_API_KEY (1-3) · ANTHROPIC_API_KEY (red de seguridad)
 */

const OPENCODE_BASE = "https://opencode.ai/zen/go/v1/chat/completions";

// ── Cabecera de sesion exigida por OpenCode (avisado el 03/09/2026) ─────────
// Su correo dice que desde el 06/09 las peticiones SIN `x-opencode-session`
// pueden dar error, y nombra los dos user agents que se la estan saltando:
// "Python requests" (el Business System, ya arreglado) y **"Node fetch"**, que
// es ESTO. Perderlo no degrada: manda toda la cascada al fallback de Anthropic,
// que esta sin saldo (`_anthropicSinSaldo`) y con IDs de una generacion
// retirada — o sea, al suelo, y en la superficie de los clientes que pagan.
//
// Piden "un id estable por conversacion". Aqui SI hay conversaciones (el chat
// del widget), asi que se acepta un `sessionId` del llamador; cuando no lo
// manda, se usa uno por INSTANCIA. En Vercel una instancia caliente atiende
// muchas peticiones, asi que un id de modulo ya da la estabilidad que piden
// para agrupar, sin obligar a tocar los 37 puntos de llamada del ecosistema.
//
// Es un id aleatorio y nada mas: ni correo, ni clave, ni nada que identifique
// a un cliente.
const OPENCODE_SESSION_INSTANCIA =
  process.env.OPENCODE_SESSION?.trim() ||
  globalThis.crypto?.randomUUID?.().replace(/-/g, "") ||
  Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Cabeceras de CUALQUIER llamada a OpenCode. Usar siempre esta funcion: asi la
 *  cabecera de sesion no depende de que quien escriba la proxima llamada se
 *  acuerde de ponerla. */
function opencodeHeaders(apiKey: string, sessionId?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "x-opencode-session": (sessionId && sessionId.trim()) || OPENCODE_SESSION_INSTANCIA,
  };
}
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Timeout por intento de modelo. Separado por cascada: la de chat no debe
// acercarse al maxDuration de la función de Vercel; la de contenido tolera
// más porque kimi-k2.6 legítimamente puede tardar 30-40s en generación larga
// (mide bien: benchmark real 29/07/2026, mediana 6s, peor caso observado 35s).
const PER_MODEL_TIMEOUT_MS_CHEAP = 20_000;
const PER_MODEL_TIMEOUT_MS_DEFAULT = 45_000;

// Cascada completa — kimi-k2.6 razona mucho (sirve para generación, no chat)
// s277: kimi-k2.5 retirado (ver comentario de cabecera) — fuera de la cascada.
const OPENCODE_MODELS = ["kimi-k2.6", "minimax-m3", "glm-5.1"];

// Cascada barata/chat — NUNCA kimi-k2.6 (lento e inestable en esta carga: el
// benchmark real lo vio tardar hasta 77s o devolver contenido vacío con los
// max_tokens típicos de un turno de chat). minimax-m3 fue el único modelo
// rápido (~4s) que acertó SIEMPRE los datos de la base de conocimiento.
const OPENCODE_MODELS_CHEAP = ["minimax-m3", "mimo-v2.5", "glm-5.1"];

// s277: los 3 IDs anteriores (claude-sonnet-4-6, claude-3-5-haiku-20241022,
// claude-3-haiku-20240307) son de una generacion de modelos retirada — ver
// comentario de cabecera.
// s280: se enciende la primera vez que Anthropic contesta "credit balance is
// too low" y sobrevive mientras viva el proceso (una instancia caliente de
// Vercel atiende muchas peticiones). Deliberadamente NO se persiste: un
// despliegue o un arranque en frio lo olvida y se vuelve a probar, que es lo que
// hace falta el dia que la cuenta se recargue.
let _anthropicSinSaldo = false;

const ANTHROPIC_MODELS       = ["claude-sonnet-5", "claude-haiku-4-5-20251001"];
const ANTHROPIC_MODELS_CHEAP = ["claude-haiku-4-5-20251001", "claude-sonnet-5"];

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
  /** Override del timeout por modelo (ms). Súbelo en trabajos de fondo que
   *  piden JSON largo; NO lo subas en rutas con maxDuration corto (p.ej.
   *  /api/chat, 30s) porque la función moriría antes que la cascada.
   *  Medido s230: con el default cheap de 20s, un prompt de social-content que
   *  pide tiktok_script tarda ~20s en el único modelo que devuelve JSON limpio
   *  (mimo-v2.5) y se cortaba justo en el filo → la cascada entera fallaba y
   *  escalaba a Anthropic (sin saldo) → 0 piezas para aizuatec y ecommerce. */
  perModelTimeoutMs?: number;
  /** Id estable de conversacion para `x-opencode-session`. Mandalo cuando la
   *  llamada pertenezca a una conversacion real (el chat del widget): OpenCode
   *  agrupa por el. Si no se manda, se usa el id de la instancia. */
  sessionId?: string;
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
 * Hay caracteres CJK (chino/japones/coreano) en el texto?
 *
 * Ninguna de nuestras marcas publica en CJK: los 6 locales del store son
 * es/en/fr/de/pt/it. Un ideograma suelto significa SIEMPRE fuga del modelo
 * (kimi/minimax son de origen chino y mezclan tokens CJK a media frase).
 * Caso real s230: salio a Telegram un copy de consulting que decia
 * "resultados en semanas, no en 6 meses de<ideograma>". El router de Python ya
 * tenia esta guardia desde s227; el de TypeScript no, y por eso paso.
 *
 * Rangos: puntuacion CJK, hiragana, katakana, ideogramas unificados y hangul.
 * Escrito con escapes uXXXX a proposito: con los caracteres literales el
 * fichero dependeria de su codificacion para seguir siendo correcto.
 * Los emoji NO caen aqui (viven en planos altos), asi que no hay falso positivo.
 */
export function containsCJK(t: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/u.test(t);
}

/**
 * Heuristica: el texto parece razonamiento interno filtrado (sin etiquetas)?
 * Frases meta inequivocas que un personaje JAMAS le diria a un usuario.
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
  perModelTimeoutMs,
  sessionId,
}: LLMRouteOptions): Promise<LLMRouteResult> {
  const opencodeKey  = process.env.OPENCODE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!opencodeKey && !anthropicKey) {
    throw new Error(`[LLM ${tag}] Sin OPENCODE_API_KEY ni ANTHROPIC_API_KEY`);
  }

  const perModelTimeout =
    perModelTimeoutMs ?? (preferCheap ? PER_MODEL_TIMEOUT_MS_CHEAP : PER_MODEL_TIMEOUT_MS_DEFAULT);

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
  // s265: ANTES solo sobrevivia `lastError`, y como Anthropic es el ULTIMO de
  // la cascada, el throw final solo ensenaba SU fallo. Los de OpenCode —el
  // proveedor primario, el de pago— se perdian, asi que un "credit balance is
  // too low" de Anthropic parecia LA causa cuando podia ser solo el sintoma de
  // que el primario ya habia fallado por otro motivo. La accion correcta
  // (recargar Anthropic vs arreglar la clave de OpenCode) depende de eso.
  const fallos: string[] = [];

  // ── 1-3. OpenCode (gratis, plano) ─────────────────────────────────────
  if (opencodeKey) {
    const modelsToTry = preferCheap ? OPENCODE_MODELS_CHEAP : OPENCODE_MODELS;
    for (const model of modelsToTry) {
      // s279: un modelo que razona puede gastarse TODO el presupuesto pensando y
      // devolver content vacio con finish_reason 'length'. Eso NO significa "este
      // modelo no sirve": significa "lo he cortado a mitad de la frase". Es la
      // unica senal inequivoca de que falta sitio, asi que se le da una segunda
      // oportunidad al MISMO modelo con el triple de margen antes de pasar al
      // siguiente.
      // Ojo con la tentacion de subir el presupuesto base a todos: medido en la
      // s277 contra la API real, subirlo a ciegas da resultados erraticos y NO
      // monotonos (los mismos modelos fallan a 3000 y funcionan a 2200 y a 4500).
      // Aqui se sube solo cuando el propio proveedor dice que se quedo corto, y
      // solo para esa llamada: el modo barato conserva su latencia habitual.
      const presupuestos = [ocMaxTokens, ocMaxTokens * 3];

      // s280 — EL SEGUNDO INTENTO TAMBIEN SUBE EL TIEMPO, NO SOLO LOS TOKENS.
      //
      // Sintoma real (Telegram, 04/09): "[LLM consulting-content] Sin modelo
      // disponible (4 intentos) — minimax-m3: aborted due to timeout |
      // mimo-v2.5: aborted due to timeout | glm-5.1: aborted due to timeout |
      // anthropic: la cuenta no tiene saldo". Los TRES se quedaron sin tiempo,
      // no sin capacidad.
      //
      // Causa medida contra la API real el 04/09, con la carga de un boletin
      // (max_tokens 1400), dos intentos por modelo:
      //     minimax-m3  28.3s / 20.7s     mimo-v2.5  26.4s / 31.3s
      //     glm-5.1     14.3s / 15.2s  (y uno de los dos devolvio 0 caracteres)
      // O sea: 5 de 6 pasan del techo de 20s del modo barato. Ese techo se
      // eligio para el chat en vivo, donde hay una persona esperando, y
      // consulting-content lo heredaba por usar preferCheap.
      //
      // Por que se arregla AQUI y no en el llamante: hay 7 generadores de
      // contenido en los 3 repos con preferCheap y sin timeout explicito
      // (consulting-content, kdp-content-blast, academy-newsletter,
      // wizard-generate-prompt, social/generate...). Parchearlos uno a uno deja
      // el siguiente que alguien anada con el mismo fallo. Y `maxTokens` no
      // sirve para distinguir chat de generacion: el chat de consulting tambien
      // pide 1400.
      const tiempos = [perModelTimeout, Math.max(perModelTimeout * 3, 60_000)];

      for (let intento = 0; intento < presupuestos.length; intento++) {
        const budget = presupuestos[intento];
        try {
          const res = await fetchWithTimeout(OPENCODE_BASE, {
            method: "POST",
            headers: opencodeHeaders(opencodeKey, sessionId),
            body: JSON.stringify({ model, messages: baseMessages, max_tokens: budget, temperature, stream: false }),
          }, tiempos[intento]);

          if (!res.ok) {
            // FIX v6: un 401 (incl. saldo agotado / CreditsError) YA NO corta la
            // cascada — se prueba el siguiente modelo igual que cualquier otro fallo.
            const t = await res.text().catch(() => "");
            lastError = `${model} HTTP ${res.status}: ${t.slice(0, 150)}`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
            break;
          }

          const data = await res.json();
          const rawText: string | null | undefined = data?.choices?.[0]?.message?.content;
          const cleaned = sanitizeReply(rawText);

          const finish: string = data?.choices?.[0]?.finish_reason ?? "?";

          // s279: `finish_reason: 'length'` significa que la respuesta esta
          // CORTADA, y da igual si llego vacia o a medias:
          //   - vacia  -> el razonamiento se comio el presupuesto entero
          //   - a medias -> JSON sin la llave de cierre
          // Medido el 03/09 con minimax-m3 a 120 tokens: devuelve 450 caracteres
          // con finish 'length' y el JSON sin cerrar — que es exactamente el
          // error "respuesta TRUNCADA por minimax-m3 (ninguna llave de cierre)"
          // que llegaba a Telegram. ANTES el router aceptaba ese texto cortado y
          // lo devolvia como bueno, asi que el fallo aparecia rio abajo, ya sin
          // ningun reintento posible. Ahora se reintenta con el triple de sitio,
          // que es la respuesta correcta a "me has cortado".
          if (finish === "length") {
            if (intento === 0) {
              console.warn(`[LLM ${tag}] ${model} corto la respuesta (finish: length, ${(cleaned ?? "").length} car) — reintento con ${presupuestos[1]} tokens`);
              continue;   // reintenta ESTE modelo con mas margen
            }
            lastError = cleaned
              ? `${model} sigue cortando la respuesta con ${presupuestos[1]} tokens (finish: length)`
              : `${model} gasta el presupuesto razonando y no llega a responder (probado con ${presupuestos[0]} y ${presupuestos[1]} tokens)`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
            break;
          }

          if (!cleaned) {
            lastError = `${model} devuelve respuesta vacia (finish: ${finish})`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
            break;
          }
          if (looksLikeLeakedReasoning(cleaned)) {
            lastError = `${model} salida = razonamiento filtrado`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — descartando, siguiente`);
            break;
          }
          if (containsCJK(cleaned)) {
            lastError = `${model} salida con caracteres CJK (fuga de tokens)`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — descartando, siguiente`);
            break;
          }

          console.log(`[LLM ${tag}] OK opencode/${model}${intento > 0 ? " (2o intento, con mas margen)" : ""}`);
          return { text: cleaned, provider: "opencode", model };

        } catch (err: unknown) {
          // Timeouts y errores de red también degradan al siguiente modelo, nunca cortan la cascada.
          const msg = err instanceof Error ? err.message : String(err);

          // s280: un TIMEOUT ya no abandona el modelo. Antes este `break` se
          // llevaba por delante su segundo intento, asi que un modelo que
          // necesitaba 28s con un techo de 20s se descartaba sin haber fallado
          // nunca por capacidad. "Te he cortado el tiempo" y "no sabes hacerlo"
          // no son lo mismo, igual que en s279 no lo eran "te he cortado los
          // tokens" y "no sabes hacerlo".
          const esTimeout = /abort|timeout|timed out|ETIMEDOUT/i.test(msg);
          if (esTimeout && intento === 0) {
            lastError = `${model}: sin tiempo con ${Math.round(tiempos[0] / 1000)}s`;
            fallos.push(lastError);
            console.warn(`[LLM ${tag}] ${lastError} — reintento con ${Math.round(tiempos[1] / 1000)}s`);
            continue;   // mismo modelo, mas tiempo
          }

          lastError = `${model}: ${msg.slice(0, 150)}`;
          fallos.push(lastError);
          console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
          break;
        }
      }
    }
    console.warn(`[LLM ${tag}] OpenCode no dio respuesta limpia — escalando a Anthropic`);
  }

  // ── 4-5. Anthropic (red de seguridad: fiable y sin razonamiento filtrado) ──
  if (!anthropicKey) {
    // s265: se listan TODOS los intentos, no solo el ultimo.
    throw new Error(`[LLM ${tag}] OpenCode sin respuesta limpia y sin ANTHROPIC_API_KEY. Intentos (${fallos.length}): ${fallos.join(" | ")}`);
  }

  // s280: si YA sabemos que la cuenta no tiene saldo, no se vuelve a llamar.
  // La s279 dejo de probar el segundo modelo dentro de la misma llamada, pero
  // cada llamada nueva volvia a preguntar desde cero: en una instancia caliente
  // de Vercel eso son dos peticiones inutiles y su latencia por CADA generacion.
  // La falta de saldo es de la cuenta y no se arregla reintentando, asi que se
  // recuerda mientras viva el proceso. Un despliegue o un arranque en frio la
  // olvida, que es exactamente lo que se quiere el dia que se recargue.
  if (_anthropicSinSaldo) {
    fallos.push("anthropic: omitido (ya se sabia que la cuenta no tiene saldo)");
    throw new Error(
      `[LLM ${tag}] Sin modelo disponible (${fallos.length} intentos) — OpenCode no dio texto util y Anthropic se omite por falta de saldo ya conocida. Detalle: ${fallos.map((f) => f.slice(0, 90)).join(" | ")}`,
    );
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
        const cuerpo = JSON.stringify(err);
        // s279: este 400 llegaba a Telegram como un volcado de JSON cortado a
        // mitad ('..."message":"Your cr') que no dice nada a quien lo lee. Y
        // encima se probaba el SEGUNDO modelo de Anthropic para obtener el mismo
        // error: la falta de saldo es de la CUENTA, no del modelo, asi que no hay
        // nada que degradar — solo tiempo que perder y ruido que anadir.
        if (/credit balance is too low/i.test(cuerpo)) {
          _anthropicSinSaldo = true;   // s280: no volver a preguntar en este proceso
          lastError = "anthropic: la cuenta no tiene saldo (no es un fallo del modelo; hay que recargar)";
          fallos.push(lastError);
          console.warn(`[LLM ${tag}] ${lastError} — se deja de intentar Anthropic`);
          break;
        }
        lastError = `anthropic/${model} HTTP ${res.status}: ${cuerpo.slice(0, 200)}`;
        fallos.push(lastError);
        // Degradar al siguiente modelo salvo que sea el último — nunca cortar en seco
        // (antes solo se reintentaba en 404/not_found; un 400 de saldo insuficiente
        // debe poder pasar al siguiente modelo/proveedor tambien, no solo not_found).
        console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
        continue;
      }

      const data = await res.json();
      const cleaned = sanitizeReply(data.content?.[0]?.text ?? "");
      if (!cleaned) { lastError = `anthropic/${model} respuesta vacia`; fallos.push(lastError); continue; }
      if (containsCJK(cleaned)) {
        lastError = `anthropic/${model} salida con caracteres CJK (fuga de tokens)`;
        fallos.push(lastError);
        console.warn(`[LLM ${tag}] ${lastError} — descartando, siguiente`);
        continue;
      }

      console.log(`[LLM ${tag}] OK anthropic/${model} (fallback)`);
      return { text: cleaned, provider: "anthropic", model };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `anthropic/${model}: ${msg.slice(0, 150)}`;
      fallos.push(lastError);
      console.warn(`[LLM ${tag}] ${lastError} — siguiente`);
    }
  }

  // s265: ANTES era "Ultimo: ${lastError}", que por construccion era SIEMPRE el
  // ultimo modelo de Anthropic y borraba los fallos de OpenCode. Ahora se listan
  // los cinco intentos con su proveedor delante, para poder decidir si hay que
  // recargar Anthropic o arreglar OpenCode. Se recorta cada uno para que el
  // mensaje entero quepa en un aviso de Telegram.
  // s279: el mensaje que llegaba a Telegram era el volcado de los 5 intentos con
  // JSON crudo dentro. Como Telegram RECORTA POR EL FINAL, la causa legible se
  // quedaba fuera y lo que se leia era `{"type":"error","error":{"type":...`.
  // Ahora se agrupa por CAUSA, se dice en castellano y va DELANTE; el detalle
  // tecnico queda detras, que es lo que se puede perder sin coste.
  const _sinSitio = fallos.filter((f) => /gasta el presupuesto razonando/.test(f)).length;
  const _sinSaldo = fallos.some((f) => /no tiene saldo/.test(f));
  // s280: el tiempo tambien es una causa, y era la REAL del aviso del 04/09.
  // Antes no tenia linea propia: los tres timeouts se contaban como "ningun
  // modelo devolvio texto util" y el resumen encabezaba con la falta de saldo de
  // Anthropic, que es lo que NO se puede arreglar desde el codigo. Se nombra
  // primero lo accionable.
  const _sinTiempo = fallos.filter((f) => /sin tiempo con|abort|timeout/i.test(f)).length;
  const _causas: string[] = [];
  if (_sinTiempo) {
    _causas.push(`${_sinTiempo} intento(s) de OpenCode se quedaron sin tiempo (ya se reintenta con el triple; si persiste, sube perModelTimeoutMs en el llamante)`);
  }
  if (_sinSitio) {
    _causas.push(`${_sinSitio} modelo(s) de OpenCode gastan el presupuesto razonando y no llegan a responder`);
  }
  if (_sinSaldo) {
    // Miguel, 04/09: Anthropic no va a tener saldo a corto ni medio plazo. Asi
    // que esto NO es una incidencia a resolver ni la causa a mirar primero: es
    // una condicion conocida del entorno. La red de seguridad real es el
    // reintento con mas tiempo de la cascada de OpenCode.
    _causas.push("Anthropic sigue sin saldo (condicion conocida, no es la causa a mirar)");
  }
  const _resumen = _causas.length ? _causas.join("; ") : "ningun modelo devolvio texto util";
  const _detalle = fallos.map((f) => f.slice(0, 90)).join(" | ");
  throw new Error(
    `[LLM ${tag}] Sin modelo disponible (${fallos.length} intentos) — ${_resumen}. Detalle: ${_detalle}`,
  );
}
