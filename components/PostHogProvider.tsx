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
      if (posthog.__loaded) posthog.opt_out_capturing();
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
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-mask]',
      },
    });
  }, [analytics]);

  if (!POSTHOG_KEY) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
