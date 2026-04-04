// lib/analytics/events.ts
// Aizua — Sistema centralizado de tracking
// Un único dataLayer.push() → GTM distribuye a GA4, Meta, TikTok y G.Ads

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ── TIPOS ──
type TrackItem = {
  item_id:       string;
  item_name:     string;
  item_category?: string;
  price:         number;
  quantity?:     number;
};

// ── HELPER BASE ──
function push(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

// ════════════════════════════════════
// EVENTOS DE ECOMMERCE
// ════════════════════════════════════

// Visita de página de producto
export function trackViewItem(item: TrackItem) {
  push("view_item", {
    ecommerce: {
      currency: "EUR",
      value:    item.price,
      items:    [{ ...item, quantity: 1 }],
    },
  });
}

// Añadir al carrito
export function trackAddToCart(item: TrackItem, quantity = 1) {
  push("add_to_cart", {
    ecommerce: {
      currency: "EUR",
      value:    item.price * quantity,
      items:    [{ ...item, quantity }],
    },
  });
}

// Eliminar del carrito
export function trackRemoveFromCart(item: TrackItem, quantity = 1) {
  push("remove_from_cart", {
    ecommerce: {
      currency: "EUR",
      value:    item.price * quantity,
      items:    [{ ...item, quantity }],
    },
  });
}

// Ver carrito
export function trackViewCart(items: TrackItem[], total: number) {
  push("view_cart", {
    ecommerce: {
      currency: "EUR",
      value:    total,
      items,
    },
  });
}

// Inicio de checkout
export function trackBeginCheckout(items: TrackItem[], total: number) {
  push("begin_checkout", {
    ecommerce: {
      currency: "EUR",
      value:    total,
      items,
    },
  });
}

// Añadir datos de envío
export function trackAddShippingInfo(items: TrackItem[], total: number, method: string) {
  push("add_shipping_info", {
    ecommerce: {
      currency:        "EUR",
      value:           total,
      shipping_tier:   method,
      items,
    },
  });
}

// Añadir info de pago
export function trackAddPaymentInfo(items: TrackItem[], total: number, method: string) {
  push("add_payment_info", {
    ecommerce: {
      currency:       "EUR",
      value:          total,
      payment_type:   method,
      items,
    },
  });
}

// COMPRA — el evento más importante
export function trackPurchase(params: {
  transactionId: string;
  total:         number;
  shipping?:     number;
  tax?:          number;
  items:         TrackItem[];
}) {
  push("purchase", {
    ecommerce: {
      transaction_id: params.transactionId,
      currency:       "EUR",
      value:          params.total,
      shipping:       params.shipping ?? 0,
      tax:            params.tax ?? 0,
      items:          params.items,
    },
  });
}

// ════════════════════════════════════
// EVENTOS DE ENGAGEMENT
// ════════════════════════════════════

// Búsqueda en la tienda
export function trackSearch(query: string, results: number) {
  push("search", { search_term: query, results_count: results });
}

// Suscripción a newsletter
export function trackNewsletterSignup(method: string = "footer") {
  push("newsletter_signup", { method });
}

// Ver lista de productos (catálogo)
export function trackViewItemList(items: TrackItem[], listName: string) {
  push("view_item_list", {
    ecommerce: {
      item_list_name: listName,
      items,
    },
  });
}

// Click en producto desde lista
export function trackSelectItem(item: TrackItem, listName: string) {
  push("select_item", {
    ecommerce: {
      item_list_name: listName,
      items:          [item],
    },
  });
}

// ════════════════════════════════════
// USO EN COMPONENTES
// ════════════════════════════════════
/*

// En ProductClient.tsx:
import { trackViewItem, trackAddToCart } from "@/lib/analytics/events";

useEffect(() => {
  trackViewItem({
    item_id:       product.id,
    item_name:     product.name.es,
    item_category: product.category,
    price:         product.price,
  });
}, []);

const handleAddToCart = () => {
  trackAddToCart({ item_id: product.id, item_name: product.name.es, price: product.price }, qty);
};

// En la confirmación de pedido (tras Stripe webhook):
trackPurchase({
  transactionId: order.orderNumber,
  total:         order.total,
  shipping:      0,
  items:         order.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
});

*/
