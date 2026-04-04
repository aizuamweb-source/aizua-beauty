// lib/klaviyo/client.ts
// Aizua — Klaviyo API v2 client
// Gestiona: sincronización de contactos, propiedades de perfil y eventos de ecommerce
// Free tier: hasta 500 contactos · 500 emails/mes

const KLAVIYO_API = "https://a.klaviyo.com/api";

class KlaviyoClient {
  private key: string;

  constructor() {
    this.key = process.env.KLAVIYO_PRIVATE_KEY!;
  }

  private async call<T>(
    method: "GET" | "POST" | "PATCH",
    endpoint: string,
    body?: object
  ): Promise<T> {
    const res = await fetch(`${KLAVIYO_API}${endpoint}`, {
      method,
      headers: {
        "Authorization":  `Klaviyo-API-Key ${this.key}`,
        "Content-Type":   "application/json",
        "revision":       "2024-02-15",
        "Accept":         "application/json",
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Klaviyo ${method} ${endpoint}: ${res.status} — ${err}`);
    }

    return res.status === 204 ? ({} as T) : res.json();
  }

  // ── CREAR O ACTUALIZAR PERFIL ──
  async upsertProfile(params: {
    email:         string;
    firstName?:    string;
    lastName?:     string;
    phone?:        string;
    lang?:         string;
    country?:      string;
    totalSpent?:   number;
    orderCount?:   number;
    lastOrderDate?: string;
  }) {
    return this.call("POST", "/profile-import/", {
      data: {
        type: "profile",
        attributes: {
          email:       params.email,
          first_name:  params.firstName,
          last_name:   params.lastName,
          phone_number: params.phone,
          properties: {
            lang:             params.lang || "es",
            country:          params.country,
            total_spent:      params.totalSpent,
            order_count:      params.orderCount,
            last_order_date:  params.lastOrderDate,
            customer_tier:    this.getTier(params.totalSpent || 0),
          },
        },
      },
    });
  }

  // ── AÑADIR A LISTA ──
  async addToList(listId: string, emails: string[]) {
    return this.call("POST", `/lists/${listId}/relationships/profiles/`, {
      data: emails.map(email => ({
        type:       "profile",
        attributes: { email },
      })),
    });
  }

  // ── DISPARAR EVENTO ──
  // Los eventos alimentan los flows de Klaviyo automáticamente
  async track(params: {
    event:        string;       // "Placed Order", "Started Checkout", "Subscribed to Newsletter"
    email:        string;
    properties?:  Record<string, unknown>;
    value?:       number;
  }) {
    return this.call("POST", "/events/", {
      data: {
        type: "event",
        attributes: {
          metric: {
            data: {
              type:       "metric",
              attributes:  { name: params.event },
            },
          },
          profile: {
            data: {
              type:       "profile",
              attributes:  { email: params.email },
            },
          },
          properties: {
            ...params.properties,
            ...(params.value !== undefined && { value: params.value }),
          },
          time: new Date().toISOString(),
        },
      },
    });
  }

  // ── EVENTOS ESPECÍFICOS DE AIZUA ──

  // Trigger: flow "Post-purchase"
  async trackOrder(email: string, order: {
    orderNumber: string;
    total:       number;
    items:       Array<{ id: string; name: string; price: number; qty: number; image?: string }>;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }) {
    await this.upsertProfile({ email });
    return this.track({
      event: "Placed Order",
      email,
      value: order.total,
      properties: {
        order_number:       order.orderNumber,
        order_total:        order.total,
        tracking_number:    order.trackingNumber,
        estimated_delivery: order.estimatedDelivery,
        items:              order.items,
        items_count:        order.items.reduce((s, i) => s + i.qty, 0),
      },
    });
  }

  // Trigger: flow "Carrito abandonado"
  async trackAbandonedCart(email: string, cart: {
    items:     Array<{ id: string; name: string; price: number; qty: number; image?: string; slug?: string }>;
    total:     number;
    cartUrl?:  string;
  }) {
    return this.track({
      event: "Started Checkout",
      email,
      value: cart.total,
      properties: {
        cart_total: cart.total,
        cart_url:   cart.cartUrl || `${process.env.NEXT_PUBLIC_APP_URL}/es/carrito`,
        items:      cart.items,
      },
    });
  }

  // Trigger: flow "Welcome series"
  async trackNewsletterSignup(email: string, params: {
    lang?:    string;
    source?:  string;  // "footer", "popup", "product_page"
  } = {}) {
    await this.upsertProfile({ email, lang: params.lang });
    return this.track({
      event: "Subscribed to Newsletter",
      email,
      properties: {
        source:   params.source || "website",
        lang:     params.lang || "es",
      },
    });
  }

  // Trigger: flow "Win-back"
  async trackInactiveMark(email: string, daysSincePurchase: number) {
    return this.track({
      event: "Became Inactive",
      email,
      properties: {
        days_since_purchase: daysSincePurchase,
        inactive_since:      new Date().toISOString(),
      },
    });
  }

  // ── HELPERS ──
  private getTier(spent: number): string {
    if (spent >= 200) return "VIP";
    if (spent >= 80)  return "Regular";
    return "New";
  }
}

export const klaviyo = new KlaviyoClient();
