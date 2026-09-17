"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { getStoredConsent } from "@/components/CookiesBanner";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

/**
 * PostHog SOLO con consentimiento de analítica.
 *
 * QUÉ ESTABA ROTO, medido en producción por la auditoría legal (hallazgo 16,
 * PRIORIDAD 1): `posthog.init()` corría dentro de un `useEffect` sin ninguna
 * comprobación, así que en un navegador limpio ya existía
 * `ph_<key>_posthog` en localStorage con `aizua_cookie_consent === null`. Y con
 * `autocapture: true` y grabación de sesión. La clave real está en el bundle de
 * producción, o sea que no era teórico: pasaba en cada visita.
 *
 * NO SE INVENTA UN MECANISMO NUEVO: se reutiliza el que esta web ya tiene y que
 * `PixelProvider` ya respeta para Meta y TikTok — `aizua_cookie_consent` en
 * localStorage + el evento `aizua:cookie-consent` que emite `CookiesBanner`.
 * Dos mecanismos de consentimiento en la misma web acabarían diciendo cosas
 * distintas, y el usuario no sabría cuál manda.
 *
 * PostHog va en `analytics`, no en `marketing`: es medición de uso del sitio.
 *
 * LA DIRECCIÓN DEL FALLO ES LA SEGURA: sin nada guardado no se inicializa. Si
 * localStorage está bloqueado, si el JSON está corrupto o si el usuario no ha
 * decidido todavía, `getStoredConsent()` devuelve null → no se mide.
 *
 * ⚠️ LO QUE ESTO NO ARREGLA, y sigue siendo del hallazgo 16: PostHog **no
 * aparece en la política de privacidad ni en la de cookies** de esta marca (que
 * listan Stripe, Google, Meta y TikTok). El consentimiento lo hace lícito
 * ejecutarlo; que el texto legal lo nombre es una decisión de Miguel y sigue
 * abierta en la auditoría.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [analytics, setAnalytics] = useState(false);

  // Decisión ya guardada de una visita anterior.
  useEffect(() => {
    setAnalytics(!!getStoredConsent()?.analytics);
  }, []);

  // Decisión tomada ahora mismo en el banner.
  useEffect(() => {
    const handler = (e: Event) => {
      const c = (e as CustomEvent<{ analytics?: boolean }>).detail;
      setAnalytics(!!c?.analytics);
    };
    window.addEventListener("aizua:cookie-consent", handler);
    return () => window.removeEventListener("aizua:cookie-consent", handler);
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (!analytics) {
      // RETIRADA DEL CONSENTIMIENTO: si ya se había cargado en esta pestaña y
      // el usuario lo quita, hay que dejar de enviar. Sin este `opt_out` el
      // gate solo valdría para la primera carga de la página.
      if (posthog.__loaded) {
        // EL ORDEN NO ES INDIFERENTE Y ESTÁ MEDIDO (s308, consulting):
        // `reset()` borra la persistencia ENTERA, incluida la marca de
        // opt-out. Al revés (`opt_out` y luego `reset`) el
        // `__ph_opt_in_out_<clave>` pasaba de "0" a null, o sea que PostHog
        // dejaba de recordar que se dijo no. Primero se corta la identidad,
        // después se marca el rechazo.
        //
        // Y esto hacía falta de verdad: medido en producción el 17/09/2026,
        // con solo `opt_out_capturing()` el `ph_<clave>_posthog` se quedaba
        // con su `distinct_id` intacto — se dejaba de enviar, pero el
        // identificador recogido MIENTRAS había permiso seguía ahí y podía
        // volver a hilarse si aceptaba otra vez. `reset(true)` descarta
        // también el `$device_id`.
        posthog.reset(true);
        posthog.opt_out_capturing();
        // ⚠️ NO deja el almacenamiento a cero, y la política NO lo promete:
        // queda un id anónimo nuevo sin usar y la marca del rechazo, que es
        // justo lo que permite recordarlo. Quien manda de todas formas es
        // nuestro `aizua_cookie_consent`: sin él a true, `init()` no corre.
      }
      return;
    }

    if (posthog.__loaded) {
      posthog.opt_in_capturing();   // volvió a aceptar tras haber rechazado
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      // 🔴 GRABACIÓN DE PANTALLA DESACTIVADA EXPLÍCITAMENTE (17/09/2026).
      // Este bloque `session_recording` NO enciende la grabación por sí
      // solo: sin `disable_session_recording` la decisión la toma el ajuste
      // del proyecto en PostHog, que desde el código no se puede leer. Daba
      // igual mientras la CSP bloqueaba TODO el tráfico de PostHog; al
      // abrirla ese freno de hecho desaparece, y ni la política de cookies
      // ni el banner declaran grabación de pantalla — que es un tratamiento
      // bastante más intrusivo que medir uso. Así que se apaga aquí: es
      // volver al comportamiento real de ayer, no retirar algo que
      // funcionara. Consulting hace lo mismo desde siempre.
      // Para encenderla: declararla primero en la política y en el banner.
      disable_session_recording: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-mask]',
      },
    });
  }, [analytics]);

  if (!POSTHOG_KEY) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
