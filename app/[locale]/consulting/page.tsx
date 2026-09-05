import { redirect } from "next/navigation";

const CONSULTING_URL = "https://aizualabs.com";

// s280 — force-static. Esta pagina es texto fijo: no lee supabase, no hace
// fetch, no usa cookies() ni headers() ni searchParams (verificado). Sin
// declarar nada se renderizaba en el servidor en cada visita para devolver
// siempre lo mismo. Mismo criterio que las legales, ya aplicado en la s277.
export const dynamic = "force-static";

export default function ConsultingPage() {
  redirect(CONSULTING_URL);
}
