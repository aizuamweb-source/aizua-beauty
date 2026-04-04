import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API = "https://api.brevo.com/v3";

interface AbandonedCartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface AbandonedCartRow {
  id: string;
  email: string;
  items: AbandonedCartItem[];
  locale: string;
  total: number;
  created_at: string;
  reminder_sent_at?: string;
}

async function sendAbandonedCartEmail(row: AbandonedCartRow): Promise<boolean> {
  const isEs = row.locale === "es";
  const itemsList = row.items
    .map((i) => i.name + " x" + i.qty + " — " + i.price.toFixed(2) + "€")
    .join(", ");

  const emailPayload = {
    to: [{ email: row.email }],
    sender: {
      email: process.env.RESEND_FROM_EMAIL ?? "aizuaweb@gmail.com",
      name: "Aizua Store",
    },
    subject: isEs ? "Olvidaste algo en tu carrito" : "You left something in your cart",
    htmlContent:
      "<p>" +
      (isEs ? "Hola, tienes artículos esperándote:" : "Hi, you have items waiting:") +
      "</p><p>" +
      itemsList +
      "</p><p><strong>Total: " +
      row.total.toFixed(2) +
      "€</strong></p><p><a href='" +
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app") +
      "/" +
      row.locale +
      "/tienda'>" +
      (isEs ? "Volver a la tienda" : "Return to store") +
      "</a></p>",
  };

  try {
    const res = await fetch(BREVO_API + "/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// POST /api/abandoned-cart — cron job that sends reminders for abandoned carts
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .lt("created_at", cutoff)
      .is("reminder_sent_at", null)
      .not("email", "is", null)
      .limit(50);

    if (error) throw error;

    let sent = 0;
    for (const cart of (carts as AbandonedCartRow[]) ?? []) {
      const ok = await sendAbandonedCartEmail(cart);
      if (ok) {
        await supabase
          .from("abandoned_carts")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", cart.id);
        sent++;
      }
    }

    return NextResponse.json({ ok: true, processed: carts?.length ?? 0, sent });
  } catch (err) {
    console.error("[abandoned-cart]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/abandoned-cart?process=true — Vercel cron (daily 10:00)
// GET /api/abandoned-cart?email=x&data=y — save a cart from client
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ── Cron: process abandoned carts ────────────────────────────────────────
  if (searchParams.get("process") === "true") {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
      const { data: carts, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .lt("created_at", cutoff)
        .is("reminder_sent_at", null)
        .not("email", "is", null)
        .limit(50);

      if (error) throw error;

      let sent = 0;
      for (const cart of (carts as AbandonedCartRow[]) ?? []) {
        const ok = await sendAbandonedCartEmail(cart);
        if (ok) {
          await supabase
            .from("abandoned_carts")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", cart.id);
          sent++;
        }
      }

      return NextResponse.json({ ok: true, processed: carts?.length ?? 0, sent });
    } catch (err) {
      console.error("[abandoned-cart cron]", err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Client: save a cart before checkout ──────────────────────────────────
  const email = searchParams.get("email");
  const cartData = searchParams.get("data");

  if (!email || !cartData) {
    return NextResponse.json({ error: "Missing email or data" }, { status: 400 });
  }

  try {
    const items: AbandonedCartItem[] = JSON.parse(decodeURIComponent(cartData));
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    await supabase.from("abandoned_carts").upsert(
      {
        email,
        items,
        total,
        locale: req.headers.get("accept-language")?.startsWith("es") ? "es" : "en",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
