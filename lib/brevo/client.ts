/**
 * lib/brevo/client.ts
 * Lightweight Brevo (ex-Sendinblue) API client for AizuaLabs
 * Covers: contacts, transactional email, list management
 */

const BREVO_BASE = "https://api.brevo.com/v3";

function getKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY is not set");
  return key;
}

function brevoHeaders() {
  return {
    "api-key": getKey(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface BrevoContact {
  email: string;
  attributes?: Record<string, string | number | boolean>;
  listIds?: number[];
  updateEnabled?: boolean;
}

export interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

export interface BrevoTransactionalEmail {
  to: BrevoEmailRecipient[];
  sender: BrevoEmailRecipient;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  replyTo?: BrevoEmailRecipient;
  tags?: string[];
  params?: Record<string, string | number>;
}

export interface BrevoContactInfo {
  email: string;
  id: number;
  listIds: number[];
  attributes: Record<string, unknown>;
  emailBlacklisted: boolean;
}

// ────────────────────────────────────────────
// Contacts
// ────────────────────────────────────────────

export async function upsertContact(contact: BrevoContact): Promise<{ id?: number; ok: boolean }> {
  const res = await fetch(BREVO_BASE + "/contacts", {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify({ ...contact, updateEnabled: contact.updateEnabled ?? true }),
  });

  if (res.status === 204 || res.status === 201 || res.status === 200) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data.id };
  }

  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "duplicate_parameter") return { ok: true };
  }

  const err = await res.json().catch(() => ({}));
  throw new Error("Brevo upsertContact error " + res.status + ": " + JSON.stringify(err));
}

export async function getContact(email: string): Promise<BrevoContactInfo | null> {
  const res = await fetch(BREVO_BASE + "/contacts/" + encodeURIComponent(email), {
    headers: brevoHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Brevo getContact error " + res.status);
  return res.json();
}

export async function addContactToList(email: string, listId: number): Promise<void> {
  const res = await fetch(BREVO_BASE + "/contacts/lists/" + listId + "/contacts/add", {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify({ emails: [email] }),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Brevo addToList error " + res.status);
  }
}

export async function removeContactFromList(email: string, listId: number): Promise<void> {
  const res = await fetch(BREVO_BASE + "/contacts/lists/" + listId + "/contacts/remove", {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify({ emails: [email] }),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Brevo removeFromList error " + res.status);
  }
}

// ────────────────────────────────────────────
// Transactional Email
// ────────────────────────────────────────────

export async function sendTransactionalEmail(email: BrevoTransactionalEmail): Promise<{ messageId: string }> {
  const res = await fetch(BREVO_BASE + "/smtp/email", {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify(email),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error("Brevo sendEmail error " + res.status + ": " + JSON.stringify(err));
  }
  return res.json();
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/**
 * Lee una variable de lista tratando la CADENA VACIA como ausente.
 *
 * s265. ?? solo cae al defecto con null o undefined. En el entorno de beauty las
 * variables BREVO_LIST_BEAUTY_ES y _EN estan puestas a "", asi que env ?? "11"
 * devolvia "" y Number("") es 0, no 11. Con eso el contacto se creaba sin ninguna
 * lista: quien se suscribia no se suscribia a nada.
 */
function envLista(v: string | undefined): number {
  const s = (v ?? "").trim();
  return s ? Number(s) : 0;
}

/**
 * s265 - ESTA ES LA TIENDA DE BELLEZA. "newsletter" son las listas 11/12 de
 * AizuaBeauty, NUNCA las 5/6 de AizuaTec.
 *
 * Antes esto leia BREVO_LIST_NEWSLETTER_ES/_EN, que en el entorno de beauty valen 5 y
 * 6 - las de AizuaTec. El chat daba de alta ahi a quien dejaba su correo en una tienda
 * de belleza: cruza dos marcas que no pueden mezclarse, y manda gadgets a quien pidio
 * cosmetica, que es justo lo que el art. 21.2 de la LSSI no ampara.
 *
 * Se leen las variables de BEAUTY con 11/12 literales de respaldo, para que esto sea
 * correcto por construccion y no dependa de que el entorno este bien puesto.
 */
export function getListIdForLocale(locale: string, type: "newsletter" | "clientes" | "academy" | "consulting"): number {
  const es = locale === "es";
  const envMap: Record<string, number> = {
    "newsletter-es": envLista(process.env.BREVO_LIST_BEAUTY_ES) || 11,
    "newsletter-en": envLista(process.env.BREVO_LIST_BEAUTY_EN) || 12,
    "clientes-es": envLista(process.env.BREVO_LIST_CLIENTES),
    "academy-es": envLista(process.env.BREVO_LIST_ACADEMY),
    "consulting-es": envLista(process.env.BREVO_LIST_CONSULTING),
  };
  const key = type + "-" + (es ? "es" : "en");
  const id = envMap[key] || envMap[type + "-es"];
  if (!id) throw new Error("Brevo list ID not configured for: " + key);
  return id;
}

// ────────────────────────────────────────────
// Customer enrollment (post-compra)
// ────────────────────────────────────────────

/**
 * Alta/actualización de un comprador como cliente en Brevo + enrolado en la lista "Clientes".
 * Lo usa el webhook de Stripe tras payment_intent.succeeded.
 * Solo se setea FIRSTNAME (atributo estándar de Brevo): enviar atributos custom no definidos
 * en la cuenta (COUNTRY, totalSpent) provocaría un 400 y abortaría el alta. Si se quieren
 * registrar, hay que crear esos atributos en Brevo primero.
 */
export async function addCustomer(
  email: string,
  opts: { firstName?: string; lang?: string; country?: string; totalSpent?: number } = {}
): Promise<void> {
  const listId = getListIdForLocale(opts.lang ?? "es", "clientes");
  await upsertContact({
    email,
    attributes: opts.firstName ? { FIRSTNAME: opts.firstName } : {},
    listIds: [listId],
  });
}

/** Namespace agregado — lo importa el webhook como `import { brevo } from "@/lib/brevo/client"`. */
export const brevo = {
  upsertContact,
  getContact,
  addContactToList,
  removeContactFromList,
  sendTransactionalEmail,
  getListIdForLocale,
  addCustomer,
};
