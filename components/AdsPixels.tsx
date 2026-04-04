"use client";
// components/AdsPixels.tsx
// Loads Google Tag Manager + Meta Pixel + TikTok Pixel
// Drop once in app/[locale]/layout.tsx

import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID; // e.g. "GTM-XXXXXXX"
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID; // e.g. "123456789"
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID; // e.g. "C9XXXX"

export function AdsPixels() {
  return (
    <>
      {/* \u2500\u2500\u2500 Google Tag Manager \u2500\u2500\u2500 */}
      {GTM_ID && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='kl('':j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        </>
      )}

      {/* \u2500\u2500\u2500 Meta Pixel \u2500\u2500\u2500 */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,"t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');`}
        </Script>
      )}

      {/* \u2500\u2500\u2500 TikTok Pixel \u2500\u2500\u2500 */}
      {TIKTOK_PIXEL_ID && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkii="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${TIKTOK_PIXEL_ID}');
            ttq.page();
          }(window, document, 'ttq');`}
        </Script>
      )}
    </>
  );
}

// \u2500\u2500\u2500 Conversion tracking helpers (call from checkout/confirmation page) \u2500\u2500\u2500

export function trackPurchase(opts: {
  value: number;
  currency: string;
  orderId: string;
  items?: Array<{ id: string; name: string; price: number; quantity: number }>;
}) {
  const { value, currency, orderId, items = [] } = opts;

  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: orderId,
        value,
        currency,
        items: items.map((i) =>({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  }

  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "Purchase", {
      value,
      currency,
      content_ids: items.map((i) => i.id),
      content_type: "product",
      num_items: items.reduce((s, i) => s + i.quantity, 0),
    });
  }

  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track("PlaceAnOrder", {
      value,
      currency,
      content_id: items[0]?.id ?? "",
      content_type: "product",
      quantity: items.reduce((s, i) => s + i.quantity, 0),
    });
  }
}

export function trackAddToCart(opts: { productId: string; name: string; price: number; currency?: string }) {
  const { productId, name, price, currency = "EUR" } = opts;
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event: "add_to_cart", ecommerce: { currency, value: price, items: [{ item_id: productId, item_name: name, price }] } });
  }
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "AddToCart", { value: price, currency, content_ids: [productId] });
  }
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track("AddToCart", { value: price, currency, content_id: productId });
  }
}

export function trackViewContent(opts: { productId: string; name: string; price: number }) {
  const { productId, name, price } = opts;
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event: "view_item", ecommerce: { items: [{ item_id: productId, item_name: name, price }] } });
  }
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "ViewContent", { content_ids: [productId], content_name: name, value: price, currency: "EUR" });
  }
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track("ViewContent", { content_id: productId, content_name: name, value: price, currency: "EUR" });
  }
}
