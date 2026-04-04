/**
 *  * lib/pixels/index.ts — Aizua Pixel Layer
  * Meta Pixel (fbq) + TikTok Pixel (ttq)
   * Env vars: NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_TIKTOK_PIXEL_ID
    */

    declare global {
      interface Window {
          fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string };
              _fbq?: typeof window.fbq;
                  ttq?: { load: (id: string) => void; page: () => void; track: (event: string, params?: Record<string, unknown>) => void; identify: (params: Record<string, unknown>) => void; instances: unknown[]; queue: unknown[] };
                    }
                    }

                    export const META_PIXEL_ID   = process.env.NEXT_PUBLIC_META_PIXEL_ID   ?? "";
                    export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";

                    export type PixelItem = { id: string; name: string; price: number; qty?: number; category?: string };

                    // ── META ──────────────────────────────────────────────────
                    export function initMetaPixel() {
                      if (typeof window === "undefined" || !META_PIXEL_ID || window.fbq) return;
                        const fbq: any = function (...args: unknown[]) {
                            if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args);
                              };
                                fbq.queue = []; fbq.loaded = true; fbq.version = "2.0";
                                  window.fbq = fbq; window._fbq = fbq;
                                    fbq("init", META_PIXEL_ID);
                                    }
                                    export function metaPageView() {
                                      if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
                                        window.fbq("track", "PageView");
                                        }
                                        export function metaViewContent(item: PixelItem) {
                                          if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
                                            window.fbq("track", "ViewContent", { content_ids: [item.id], content_name: item.name, content_type: "product", currency: "EUR", value: item.price });
                                            }
                                            export function metaAddToCart(item: PixelItem) {
                                              if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
                                                window.fbq("track", "AddToCart", { content_ids: [item.id], content_name: item.name, content_type: "product", currency: "EUR", value: item.price * (item.qty ?? 1), num_items: item.qty ?? 1 });
                                                }
                                                export function metaPurchase(params: { transactionId: string; total: number; items: PixelItem[] }) {
                                                  if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
                                                    window.fbq("track", "Purchase", { content_ids: params.items.map(i => i.id), content_type: "product", currency: "EUR", value: params.total, num_items: params.items.reduce((s, i) => s + (i.qty ?? 1), 0), order_id: params.transactionId });
                                                    }

                                                    // ── TIKTOK ────────────────────────────────────────────────
                                                    export function initTikTokPixel() {
                                                      if (typeof window === "undefined" || !TIKTOK_PIXEL_ID || window.ttq?.instances?.length) return;
                                                        window.ttq = { load: (_id: string) => {}, page: () => {}, track: (_e: string, _p?: Record<string, unknown>) => {}, identify: (_p: Record<string, unknown>) => {}, instances: [], queue: [] };
                                                          window.ttq.load(TIKTOK_PIXEL_ID);
                                                          }
                                                          export function tikTokPageView() {
                                                            if (typeof window === "undefined" || !window.ttq || !TIKTOK_PIXEL_ID) return;
                                                              window.ttq.page();
                                                              }
                                                              export function tikTokViewContent(item: PixelItem) {
                                                                if (typeof window === "undefined" || !window.ttq || !TIKTOK_PIXEL_ID) return;
                                                                  window.ttq.track("ViewContent", { content_id: item.id, content_name: item.name, content_type: "product", currency: "EUR", value: item.price });
                                                                  }
                                                                  export function tikTokAddToCart(item: PixelItem) {
                                                                    if (typeof window === "undefined" || !window.ttq || !TIKTOK_PIXEL_ID) return;
                                                                      window.ttq.track("AddToCart", { content_id: item.id, content_name: item.name, content_type: "product", currency: "EUR", value: item.price * (item.qty ?? 1), quantity: item.qty ?? 1 });
                                                                      }
                                                                      export function tikTokPurchase(params: { transactionId: string; total: number; items: PixelItem[] }) {
                                                                        if (typeof window === "undefined" || !window.ttq || !TIKTOK_PIXEL_ID) return;
                                                                          window.ttq.track("CompletePayment", { content_id: params.items.map(i => i.id).join(","), content_type: "product", currency: "EUR", value: params.total, order_id: params.transactionId });
                                                                          }

                                                                          // ── UNIFIED HELPERS ───────────────────────────────────────
                                                                          export function pixelPageView() { metaPageView(); tikTokPageView(); }
                                                                          export function pixelViewContent(item: PixelItem) { metaViewContent(item); tikTokViewContent(item); }
                                                                          export function pixelAddToCart(item: PixelItem) { metaAddToCart(item); tikTokAddToCart(item); }
                                                                          export function pixelPurchase(params: { transactionId: string; total: number; items: PixelItem[] }) { metaPurchase(params); tikTokPurchase(params); }
 
