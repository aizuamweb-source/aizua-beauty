import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function TerminosPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones de Compra</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Partes del contrato</h2>
        <p>
          Las presentes condiciones regulan la relación contractual entre{" "}
          <strong>Aizüa</strong> (titular de la tienda aizua-store.vercel.app, en
          adelante «el Vendedor») y el usuario que realiza una compra a través de esta tienda (en
          adelante «el Comprador»). Al finalizar una compra, el Comprador acepta estas condiciones
          en su totalidad.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Proceso de compra</h2>
        <p className="mb-3">El proceso de compra se realiza en los siguientes pasos:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Selección del producto y adición al carrito.</li>
          <li>Revisión del carrito y acceso al proceso de pago.</li>
          <li>Introducción de los datos de envío y método de pago.</li>
          <li>Confirmación del pedido y pago seguro mediante Stripe.</li>
          <li>Recepción de correo electrónico de confirmación del pedido.</li>
        </ol>
        <p className="mt-3 text-sm text-gray-500">
          El contrato de compraventa queda perfeccionado en el momento en que el Vendedor confirma
          el pedido por correo electrónico.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Precios e IVA</h2>
        <p className="mb-3">
          Todos los precios mostrados en la tienda están expresados en euros (EUR) e incluyen el
          Impuesto sobre el Valor Añadido (IVA) aplicable según la normativa española vigente.
        </p>
        <p className="mb-3">
          El Vendedor opera en régimen de recargo de equivalencia para las ventas de productos
          físicos a consumidores finales, por lo que el IVA ya está incluido en el precio final
          mostrado.
        </p>
        <p>
          Los precios pueden variar sin previo aviso. El precio aplicable será el vigente en el
          momento de finalizar el pedido.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Pago</h2>
        <p className="mb-3">
          Los pagos se procesan de forma segura a través de <strong>Stripe</strong>, plataforma de
          pagos certificada PCI-DSS. Se aceptan los siguientes métodos de pago:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm mb-3">
          <li>Tarjeta de crédito o débito (Visa, Mastercard, American Express)</li>
          <li>Apple Pay y Google Pay (según disponibilidad)</li>
        </ul>
        <p className="text-sm text-gray-500">
          El Vendedor no almacena datos de tarjetas bancarias. Toda la información de pago es
          procesada directamente por Stripe bajo sus propias medidas de seguridad.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Envío y plazos de entrega</h2>
        <p className="mb-3">
          La tienda opera bajo un modelo de <strong>dropshipping</strong>: los productos se envían
          directamente desde el proveedor al Comprador. Los plazos estimados de entrega son:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm mb-3">
          <li><strong>España:</strong> 7-20 días hábiles.</li>
          <li><strong>Resto de la UE (Francia, Italia, Irlanda):</strong> 10-25 días hábiles.</li>
        </ul>
        <p className="mb-3 text-sm">
          Estos plazos son orientativos y pueden verse afectados por factores externos (aduanas,
          demoras del transportista, festivos). El Vendedor no se responsabiliza de retrasos
          imputables a terceros.
        </p>
        <p className="text-sm">
          Una vez procesado el pedido, el Comprador recibirá un número de seguimiento para rastrear
          el envío.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          6. Devoluciones y derecho de desistimiento
        </h2>
        <p className="mb-3">
          El Comprador dispone de un plazo de <strong>14 días naturales</strong> desde la recepción
          del producto para ejercer su derecho de desistimiento sin necesidad de justificación,
          conforme a la Directiva 2011/83/UE y el Real Decreto Legislativo 1/2007 (TRLGDCU).
        </p>
        <p>
          Para más información sobre el proceso de devolución, plazos de reembolso y excepciones,
          consulta nuestra{" "}
          <a href="/es/legal/devoluciones" className="text-blue-600 underline">
            Política de Devoluciones
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Garantía legal</h2>
        <p>
          Todos los productos vendidos en esta tienda están sujetos a la garantía legal de
          conformidad de <strong>2 años</strong> desde la entrega, conforme al Real Decreto
          Legislativo 1/2007. En caso de producto defectuoso o no conforme, el Comprador puede
          solicitar la reparación, sustitución, reducción de precio o resolución del contrato.
          Para ejercer esta garantía, contacta con nosotros en{" "}
          <a href="mailto:info@aizualabs.com" className="text-blue-600 underline">
            info@aizualabs.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Responsabilidad</h2>
        <p className="mb-3">
          El Vendedor no se responsabiliza de los daños indirectos, lucro cesante o perjuicios
          derivados del uso incorrecto de los productos adquiridos. La responsabilidad máxima del
          Vendedor se limita al importe pagado por el Comprador en la transacción en cuestión.
        </p>
        <p>
          El Vendedor no garantiza la disponibilidad permanente de todos los productos del
          catálogo. En caso de que un producto no esté disponible tras la confirmación del pedido,
          se notificará al Comprador y se procederá al reembolso íntegro.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Protección de datos</h2>
        <p>
          Los datos personales facilitados durante el proceso de compra serán tratados conforme a
          nuestra{" "}
          <a href="/es/legal/privacidad" className="text-blue-600 underline">
            Política de Privacidad
          </a>
          , en cumplimiento del RGPD (UE) 2016/679 y la LOPDGDD.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          10. Legislación aplicable y resolución de conflictos
        </h2>
        <p className="mb-3">
          Las presentes condiciones se rigen por la legislación española. Para cualquier
          controversia, las partes se someten a los Juzgados y Tribunales competentes según la
          normativa vigente.
        </p>
        <p className="text-sm">
          Conforme al Reglamento (UE) 524/2013, los consumidores de la UE pueden acceder a la
          plataforma de resolución de litigios en línea de la Comisión Europea en:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>
    </main>
  );
}
