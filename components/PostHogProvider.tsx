"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
 * ✅ 17/09/2026 — EL HUECO DEL HALLAZGO 16 YA ESTÁ CERRADO. Este comentario
 * decía que PostHog «no aparece en la política de privacidad ni en la de
 * cookies». Ya aparece, en los 6 idiomas de las dos tiendas, con su nombre
 * real (`ph_…_posthog`) y distinguiendo localStorage de cookie. Y con él, la
 * grabación de navegación, que se declara abajo.
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
      // ✅ GRABACIÓN DE NAVEGACIÓN ENCENDIDA Y DECLARADA (17/09/2026).
      // Decisión de Miguel, condicionada al coste: «mientras sea gratuito
      // puedes encenderlo siempre que cambies la política de cookies y todo
      // lo necesario». Medido en la página de precios de PostHog ese día:
      // 5.000 grabaciones/mes gratis, asignación que se renueva sola y «la
      // misma con o sin tarjeta», y en el plan gratuito el uso SE PARA al
      // llegar al límite en vez de cobrar. Declarada ya en la §2 de la
      // política de cookies (6 idiomas) y en la etiqueta del banner.
      session_recording: {
        maskAllInputs: true,          // no se graba lo que se ESCRIBE
        maskTextSelector: '[data-ph-mask]',
      },
    });
  }, [analytics]);

  // ── NADA DE GRABAR EL PROCESO DE PAGO ────────────────────────────────────
  // `maskAllInputs` tapa lo que el visitante ESCRIBE, no lo que la página le
  // MUESTRA, y en checkout/confirmación hay nombre, dirección y pedido en
  // TEXTO. Así que ahí se para la grabación.
  //
  // Y NO se reanuda sola al salir, a propósito: reanudar exigiría llamar a
  // `startSessionRecording()` en cada navegación, y eso puede encender la
  // grabación incluso con el ajuste del proyecto en PostHog apagado — o sea,
  // forzar desde el cliente algo que se decidió fuera. El sentido seguro del
  // error es grabar MENOS, no más: quien pasa por la pasarela deja de estar
  // grabado el resto de su sesión.
  const pathname = usePathname();
  useEffect(() => {
    if (!analytics || !posthog.__loaded) return;
    if (/\/(checkout|confirmacion|confirmation|pago)(\/|$|\?)/.test(pathname || "")) {
      posthog.stopSessionRecording();
    }
  }, [analytics, pathname]);

  if (!POSTHOG_KEY) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
