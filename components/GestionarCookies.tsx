"use client";

/**
 * components/GestionarCookies.tsx — la vuelta atrás del consentimiento.
 *
 * POR QUÉ EXISTE, medido el 17/09/2026 en las dos tiendas: el banner salía UNA
 * vez y no volvía nunca (`if (!stored) setVisible(true)` y nada más). Una vez
 * pulsado «Aceptar» no había forma de cambiar de opinión en toda la tienda.
 * El art. 7.3 del RGPD exige que retirar el consentimiento sea **tan fácil
 * como darlo**, así que sin esto:
 *   · el consentimiento que recogía el banner era discutible de origen, y
 *   · cualquier frase de la política que dijera «puedes retirarlo» sería
 *     FALSA — el mismo tipo de promesa incumplida que la auditoría legal
 *     existe para encontrar.
 *
 * Es el mismo componente que cerró ese hueco en consulting (s308), traído aquí
 * con los 6 idiomas de la tienda en vez de dos. Se mantiene el CONTRATO
 * compartido del ecosistema: solo emite `aizua:gestionar-cookies` y quien
 * decide qué pintar es `CookiesBanner`, que es el único dueño del estado del
 * consentimiento. Dos componentes escribiendo la misma decisión acabarían
 * discrepando.
 *
 * Es un `<button>` y no un `<a href="#">` a propósito: no navega a ningún
 * sitio, abre un panel. Un enlace que no enlaza rompe la navegación por
 * teclado y el lector de pantalla anuncia algo que no va a pasar.
 *
 * Se usa en dos sitios y los dos hacen falta:
 *   · `components/nav/Footer.tsx` — presente en toda la tienda.
 *   · la §4 de `legal/cookies` — que es donde el texto dice cómo gestionarlas,
 *     y donde hasta ahora solo se ofrecía la configuración del navegador (que
 *     no sirve para el almacenamiento local).
 */

import { useState } from "react";

const TEXTO: Record<string, { label: string; abierto: string }> = {
  es: { label: "Gestionar cookies",    abierto: "Panel abierto abajo ↙" },
  en: { label: "Manage cookies",       abierto: "Panel opened below ↙" },
  fr: { label: "Gérer les cookies",    abierto: "Panneau ouvert ci-dessous ↙" },
  de: { label: "Cookies verwalten",    abierto: "Panel unten geöffnet ↙" },
  pt: { label: "Gerir cookies",        abierto: "Painel aberto abaixo ↙" },
  it: { label: "Gestisci i cookie",    abierto: "Pannello aperto sotto ↙" },
};

export default function GestionarCookies({
  locale = "es",
  variante = "enlace",
}: {
  locale?: string;
  /** `enlace` para el pie · `boton` para el cuerpo de la política */
  variante?: "enlace" | "boton";
}) {
  // Confirmación visible: sin esto, en la §4 el panel se abre abajo a la
  // izquierda y desde media página parece que el botón no ha hecho nada.
  const [pulsado, setPulsado] = useState(false);
  const t = TEXTO[locale] ?? TEXTO.es;

  const abrir = () => {
    window.dispatchEvent(new CustomEvent("aizua:gestionar-cookies"));
    setPulsado(true);
    window.setTimeout(() => setPulsado(false), 4000);
  };

  if (variante === "boton") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={abrir}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #00C9B1",
            background: "#fff",
            color: "#00A895",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          🍪 {t.label}
        </button>
        {pulsado && <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>{t.abierto}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={abrir}
      style={{
        padding: 0,
        border: "none",
        background: "none",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {t.label}
    </button>
  );
}
