import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PrivacidadPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Responsable del tratamiento</h2>
        <p className="mb-2">
          En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD) y la Ley Orgánica 3/2018
          (LOPDGDD), te informamos de que el responsable del tratamiento de tus datos personales es:
        </p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>Nombre:</strong> Aizüa</li>
          <li><strong>Actividad:</strong> Comercio electrónico y servicios de consultoría/formación</li>
          <li><strong>Correo electrónico:</strong> aizualabs@outlook.com</li>
          <li><strong>Web:</strong> https://aizua-store.vercel.app</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Datos que recopilamos</h2>
        <p className="mb-2">Recopilamos los siguientes tipos de datos personales:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Datos de identificación:</strong> nombre, apellidos, dirección de envío.</li>
          <li><strong>Datos de contacto:</strong> dirección de correo electrónico, número de teléfono (opcional).</li>
          <li><strong>Datos de pago:</strong> gestionados íntegramente por Stripe. No almacenamos datos de tarjeta.</li>
          <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas (cookies técnicas y analíticas).</li>
          <li><strong>Datos del pedido:</strong> historial de compras, estado del envío, número de seguimiento.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Finalidad y base legal del tratamiento</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border border-gray-200">Finalidad</th>
                <th className="text-left p-2 border border-gray-200">Base legal (Art. 6 RGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-gray-200">Gestión de pedidos y envíos</td>
                <td className="p-2 border border-gray-200">Art. 6.1.b — Ejecución de contrato</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-200">Atención al cliente y devoluciones</td>
                <td className="p-2 border border-gray-200">Art. 6.1.b — Ejecución de contrato</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-200">Cumplimiento de obligaciones fiscales</td>
                <td className="p-2 border border-gray-200">Art. 6.1.c — Obligación legal</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-200">Envío de comunicaciones comerciales (newsletter)</td>
                <td className="p-2 border border-gray-200">Art. 6.1.a — Consentimiento</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-200">Análisis de uso del sitio web</td>
                <td className="p-2 border border-gray-200">Art. 6.1.f — Interés legítimo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Plazo de conservación</h2>
        <p className="mb-2">
          Conservamos tus datos durante el tiempo necesario para cumplir con la finalidad para la que fueron
          recogidos:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Datos de pedidos: 5 años (obligaciones fiscales y contables).</li>
          <li>Datos de newsletter: hasta que retires el consentimiento.</li>
          <li>Datos de navegación: según la política de cookies (máx. 13 meses).</li>
          <li>Datos de atención al cliente: 3 años desde la última interacción.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Destinatarios y transferencias internacionales</h2>
        <p className="mb-2">
          Tus datos pueden ser comunicados a los siguientes terceros para el cumplimiento de los servicios
          contratados:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Stripe Inc.</strong> (pasarela de pago) — transferencia internacional cubierta por cláusulas contractuales estándar.</li>
          <li><strong>Proveedores de logística</strong> (AliExpress / 17track) — dirección de envío para entrega del pedido.</li>
          <li><strong>Brevo / Resend</strong> (email transaccional) — nombre y email para confirmaciones de pedido.</li>
          <li><strong>Vercel</strong> (hosting) — datos de navegación almacenados en servidores EU.</li>
          <li><strong>Supabase</strong> (base de datos) — datos de pedidos y clientes, servidores EU.</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">
          No vendemos ni cedemos tus datos personales a terceros para fines comerciales propios.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Tus derechos</h2>
        <p className="mb-2">
          De acuerdo con el RGPD, tienes derecho a:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Acceso:</strong> conocer qué datos personales tuyos tratamos.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de tus datos.</li>
          <li><strong>Limitación:</strong> solicitar que limitemos el tratamiento de tus datos.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
          <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin que afecte a la licitud del tratamiento previo.</li>
        </ul>
        <p className="mt-2">
          Para ejercer cualquiera de estos derechos, escríbenos a{" "}
          <a href="mailto:aizualabs@outlook.com" className="text-blue-600 underline">
            aizualabs@outlook.com
          </a>
          {" "}indicando tu nombre, solicitud y copia de tu documento de identidad.
          Responderemos en un plazo máximo de 30 días.
        </p>
        <p className="mt-2">
          Si consideras que el tratamiento de tus datos no es conforme a la normativa, puedes presentar una
          reclamación ante la{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Agencia Española de Protección de Datos (AEPD)
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos contra acceso no
          autorizado, pérdida o alteración. Los datos de pago son gestionados exclusivamente por Stripe
          (certificado PCI DSS), y nunca almacenamos información de tarjeta de crédito en nuestros sistemas.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cookies</h2>
        <p>
          Utilizamos cookies propias y de terceros. Para más información, consulta nuestra{" "}
          <a href="/es/legal/cookies" className="text-blue-600 underline">
            Política de Cookies
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Modificaciones</h2>
        <p>
          Nos reservamos el derecho a modificar esta Política de Privacidad para adaptarla a cambios legislativos
          o de negocio. Te informaremos de cambios significativos por email o mediante aviso visible en el Sitio.
          La versión vigente siempre estará disponible en esta página.
        </p>
      </section>
    </main>
  );
}
