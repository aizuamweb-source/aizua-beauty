import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function CookiesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
          dispositivo cuando los visitas. Permiten que el sitio recuerde tus preferencias,
          mantenga tu sesión activa y recopile información sobre cómo utilizas la página.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Cookies que utilizamos</h2>

        <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Cookies técnicas (necesarias)</h3>
        <p className="mb-3 text-sm">
          Son imprescindibles para el funcionamiento básico de la tienda. No requieren
          consentimiento.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Finalidad</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">cart_session</td>
                <td className="border border-gray-200 px-3 py-2">Mantiene el carrito de compra activo</td>
                <td className="border border-gray-200 px-3 py-2">Sesión</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">locale</td>
                <td className="border border-gray-200 px-3 py-2">Recuerda el idioma seleccionado</td>
                <td className="border border-gray-200 px-3 py-2">1 año</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Cookies de pago (Stripe)</h3>
        <p className="mb-3 text-sm">
          Stripe utiliza cookies propias para garantizar la seguridad del proceso de pago y
          prevenir el fraude.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Finalidad</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">__stripe_mid</td>
                <td className="border border-gray-200 px-3 py-2">Detección de fraude en pagos</td>
                <td className="border border-gray-200 px-3 py-2">1 año</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">__stripe_sid</td>
                <td className="border border-gray-200 px-3 py-2">Identificador de sesión de pago</td>
                <td className="border border-gray-200 px-3 py-2">30 min</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Cookies analíticas (opcionales)</h3>
        <p className="mb-3 text-sm">
          Nos ayudan a entender cómo los usuarios interactúan con la tienda para mejorar la
          experiencia. Solo se activan con tu consentimiento.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Finalidad</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">_ga</td>
                <td className="border border-gray-200 px-3 py-2">Google Analytics — identificador de usuario</td>
                <td className="border border-gray-200 px-3 py-2">2 años</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">_ga_*</td>
                <td className="border border-gray-200 px-3 py-2">Google Analytics — estado de sesión</td>
                <td className="border border-gray-200 px-3 py-2">2 años</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Cookies de marketing (opcionales)</h3>
        <p className="mb-3 text-sm">
          Utilizadas para mostrarte publicidad relevante en otras plataformas. Solo se activan
          con tu consentimiento.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Plataforma</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">_fbp</td>
                <td className="border border-gray-200 px-3 py-2">Meta (Facebook/Instagram) Pixel</td>
                <td className="border border-gray-200 px-3 py-2">3 meses</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">_ttp</td>
                <td className="border border-gray-200 px-3 py-2">TikTok Pixel — seguimiento de conversiones</td>
                <td className="border border-gray-200 px-3 py-2">13 meses</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">fr</td>
                <td className="border border-gray-200 px-3 py-2">Meta — publicidad personalizada</td>
                <td className="border border-gray-200 px-3 py-2">3 meses</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono">ttclid</td>
                <td className="border border-gray-200 px-3 py-2">TikTok — identificador de clic en anuncio</td>
                <td className="border border-gray-200 px-3 py-2">7 días</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Cookies de terceros</h2>
        <p className="mb-3">
          Algunos servicios integrados en esta tienda pueden instalar sus propias cookies:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
            <strong>Stripe</strong> — procesador de pagos.{" "}
            <a href="https://stripe.com/es/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Stripe
            </a>
          </li>
          <li>
            <strong>Google Analytics</strong> — análisis de tráfico web.{" "}
            <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Google
            </a>
          </li>
          <li>
            <strong>Meta (Facebook)</strong> — publicidad y retargeting.{" "}
            <a href="https://www.facebook.com/privacy/policy/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Meta
            </a>
          </li>
          <li>
            <strong>TikTok</strong> — publicidad y retargeting.{" "}
            <a href="https://www.tiktok.com/legal/page/eea/privacy-policy/es" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Política de privacidad de TikTok
            </a>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Cómo gestionar las cookies</h2>
        <p className="mb-3">
          Puedes controlar y eliminar las cookies desde la configuración de tu navegador:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Apple Safari
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">
          Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento de la
          tienda (por ejemplo, el carrito de compra).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Base legal</h2>
        <p>
          El uso de cookies técnicas y de pago se basa en el interés legítimo y la necesidad
          contractual (art. 6.1.b y 6.1.f RGPD). Las cookies analíticas y de marketing requieren
          tu consentimiento explícito (art. 6.1.a RGPD), de acuerdo con el art. 22.2 de la LSSI.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Actualizaciones</h2>
        <p>
          Esta política puede actualizarse para reflejar cambios en los servicios utilizados o en
          la normativa aplicable. Te recomendamos revisarla periódicamente.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contacto</h2>
        <p>
          Para cualquier consulta sobre el uso de cookies en esta tienda, puedes contactarnos en:{" "}
          <a href="mailto:info@aizualabs.com" className="text-blue-600 underline">
            info@aizualabs.com
          </a>
        </p>
      </section>
    </main>
  );
        }
