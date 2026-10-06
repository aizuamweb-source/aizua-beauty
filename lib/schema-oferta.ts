/**
 * Envío y devolución en el JSON-LD de la ficha de producto (s350, 06/10/2026).
 *
 * Search Console avisaba en las fichas «Falta el campo hasMerchantReturnPolicy /
 * shippingDetails (en offers)» y Merchant Center puntuaba «Experiencia de
 * devolución: Incompleto» en Francia, Alemania, Italia y Portugal. Los valores
 * salen de lo ya publicado, no se inventan:
 *   · devolución: legal/devoluciones — 14 días naturales, por correo, y los gastos
 *     de devolución corren a cargo del comprador (ReturnFeesCustomerResponsibility);
 *   · envío: el feed de Merchant (app/api/merchant-feed) — gratis, a los mismos
 *     6 países y con el MISMO criterio con shipping_countries (null = sin medir,
 *     se trata como servible, igual que el feed y el botón de comprar).
 * Sin plazos de entrega a propósito: el feed dice 1-3 días de preparación y 3-7 de
 * tránsito, y legal/terminos 7-20 días hábiles (España) y 10-25 (resto de la UE).
 * Hasta que se decida cuál es el cierto, no se repite ninguno de los dos aquí.
 */
const PAISES_ENVIO = ["ES", "FR", "IT", "DE", "IE", "PT"]; // = FREE_SHIPPING_COUNTRIES del feed

export function paisesServibles(sc: string[] | null | undefined): string[] {
  return sc == null ? PAISES_ENVIO : PAISES_ENVIO.filter((c) => sc.includes(c));
}

export function datosEnvioDevolucion(sc: string[] | null | undefined): Record<string, unknown> {
  const paises = paisesServibles(sc);
  if (paises.length === 0) return {};
  return {
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: paises,
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    },
    shippingDetails: paises.map((c) => ({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: c },
    })),
  };
}
