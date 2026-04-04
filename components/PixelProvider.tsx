"use client";
/**
 * components/PixelProvider.tsx — Aizua Pixel Provider
  * Carga Meta Pixel + TikTok Pixel solo con consentimiento de marketing.
   * Lee "aizua_cookie_consent" de localStorage y escucha el evento
    * "aizua:cookie-consent" que emite CookieBanner.tsx al aceptar.
     */

     import Script from "next/script";
     import { usePathname } from "next/navigation";
     import { useEffect, useState } from "react";
     import {
       META_PIXEL_ID,
         TIKTOK_PIXEL_ID,
           initMetaPixel,
             initTikTokPixel,
               pixelPageView,
               } from "@/lib/pixels";

               type ConsentPayload = {
                 analytics?: boolean;
                   marketing?: boolean;
                   };

                   function getConsent(): ConsentPayload {
                     if (typeof window === "undefined") return {};
                       try {
                           return JSON.parse(localStorage.getItem("aizua_cookie_consent") ?? "{}");
                             } catch {
                                 return {};
                                   }
                                   }

                                   export default function PixelProvider() {
                                     const pathname = usePathname();
                                       const [marketing, setMarketing] = useState(false);

                                         // Leer consentimiento inicial
                                           useEffect(() => {
                                               setMarketing(!!getConsent().marketing);
                                                 }, []);

                                                   // Escuchar actualizaciones del CookieBanner
                                                     useEffect(() => {
                                                         const handler = (e: Event) => {
                                                               const consent = (e as CustomEvent<ConsentPayload>).detail;
                                                                     setMarketing(!!consent.marketing);
                                                                         };
                                                                             window.addEventListener("aizua:cookie-consent", handler);
                                                                                 return () => window.removeEventListener("aizua:cookie-consent", handler);
                                                                                   }, []);

                                                                                     // Inicializar pixels al obtener consentimiento
                                                                                       useEffect(() => {
                                                                                           if (!marketing) return;
                                                                                               initMetaPixel();
                                                                                                   initTikTokPixel();
                                                                                                     }, [marketing]);

                                                                                                       // PageView en cada cambio de ruta
                                                                                                         useEffect(() => {
                                                                                                             if (!marketing) return;
                                                                                                                 pixelPageView();
                                                                                                                   }, [pathname, marketing]);

                                                                                                                     if (!marketing) return null;

                                                                                                                       return (
                                                                                                                           <>
                                                                                                                                 {META_PIXEL_ID && (
                                                                                                                                         <Script
                                                                                                                                                   id="meta-pixel"
                                                                                                                                                             strategy="afterInteractive"
                                                                                                                                                                       src="https://connect.facebook.net/en_US/fbevents.js"
                                                                                                                                                                               />
                                                                                                                                                                                     )}
                                                                                                                                                                                           {TIKTOK_PIXEL_ID && (
                                                                                                                                                                                                   <Script
                                                                                                                                                                                                             id="tiktok-pixel"
                                                                                                                                                                                                                       strategy="afterInteractive"
                                                                                                                                                                                                                                 src="https://analytics.tiktok.com/i18n/pixel/events.js"
                                                                                                                                                                                                                                         />
                                                                                                                                                                                                                                               )}
                                                                                                                                                                                                                                                   </>
                                                                                                                                                                                                                                                     );
                                                                                                                                                                                                                                                     }