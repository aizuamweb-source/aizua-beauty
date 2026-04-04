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

export function getListIdForLocale(locale: string, type: "newsletter" | "clientes" | "academy" | "consulting"): number {
  const envMap: Record<string, string | undefined> = {
    "newsletter-es": process.env.BREVO_LIST_NEWSLETTER_ES,
    "newsletter-en": process.env.BREVO_LIST_NEWSLETTER_EN,
    "clientes-es": process.env.BREVO_LIST_CLIENTES,
    "academy-es": process.env.BREVO_LIST_ACADEMY,
    "consulting-es": process.env.BREVO_LIST_CONSULTING,
  };
  const key = type + "-" + (locale === "es" ? "es" : "en");
  const id = Number(envMap[key] ?? envMap[type + "-es"]);
  if (!id) throw new Error("Brevo list ID not configured for: " + key);
  return id;
}
