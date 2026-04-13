import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function DevolucionesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Devoluciones</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Derecho de desistimiento</h2>
        <p className="mb-2">
          De acuerdo con la Directiva 2011/83/UE del Parlamento Europeo y el Real Decreto Legislativo 1/2007
          (TRLGDCU), tienes derecho a desistir del contrato de compra en un plazo de{" "}
          <strong>14 días naturales</strong> desde la recepción del producto, sin necesidad de indicar el motivo.
        </p>
        <p>
          Para ejercer el derecho de desistimiento, debes comunicárnoslo antes de que venza dicho plazo,
          enviando un correo electrónico a{" "}
          <a href="mailto:info@aizualabs.com" className="text-blue-600 underline">
            info@aizualabs.com
          </a>
          {" "}con tu nombre, número de pedido y la indicación de que deseas ejercer el derecho de desistimiento.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Condiciones para la devolución</h2>
        <p className="mb-2">Para que la devolución sea aceptada, el producto debe cumplir las siguientes condiciones:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Estar en su estado original, sin usar, y con su embalaje original intacto.</li>
          <li>Incluir todos los accesorios, manuales y elementos que se entregaron con el pedido.</li>
          <li>No haber sido personalizado o fabricado según especificaciones del cliente.</li>
          <li>No pertenecer a la categoría de productos excluidos del derecho de desistimiento (ver sección 5).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Proceso de devolución</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            <strong>Solicitud:</strong> Envía un correo a info@aizualabs.com indicando tu número de pedido
            y el motivo de la devolución (opcional pero útil para mejorar nuestro servicio).
          </li>
          <li>
            <strong>Confirmación:</strong> Te enviaremos instrucciones de devolución en un plazo de 48 horas
            laborables desde la recepción de tu solicitud.
          </li>
          <li>
            <strong>Envío del producto:</strong> Deberás enviarnos el producto de vuelta utilizando un servicio
            de envío con seguimiento. Los gastos de devolución corren a cargo del comprador, salvo que el
            producto sea defectuoso o el error sea nuestro.
          </li>
          <li>
            <strong>Inspección:</strong> Una vez recibido el producto, lo inspeccionaremos en un plazo
            de 5 días laborables.
          </li>
          <li>
            <strong>Reembolso:</strong> Si la devolución cumple las condiciones, procederemos al reembolso en
            un plazo máximo de 14 días desde la recepción del producto, utilizando el mismo método de pago
            original.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Productos defectuosos o incorrectos</h2>
        <p className="mb-2">
          Si recibes un producto defectuoso, dañado durante el transporte o diferente al pedido, debes
          notificárnoslo en un plazo de <strong>48 horas</strong> desde la recepción mediante correo
          electrónico a info@aizualabs.com, adjuntando:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Número de pedido.</li>
          <li>Descripción del problema.</li>
          <li>Fotografías del producto y del embalaje (especialmente si hay daños visibles).</li>
        </ul>
        <p className="mt-2">
          En este caso, correremos con todos los gastos de devolución y te enviaremos un producto de sustitución
          o te reembolsaremos el importe total, según tu preferencia.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Exclusiones del derecho de desistimiento</h2>
        <p className="mb-2">
          De acuerdo con el artículo 103 del TRLGDCU, el derecho de desistimiento no se aplica a:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Productos personalizados o fabricados según las especificaciones del cliente.</li>
          <li>Productos que puedan deteriorarse o caducar con rapidez.</li>
          <li>Productos sellados que no sean aptos para ser devueltos por razones de protección de la salud
          o higiene, cuando hayan sido abiertos tras la entrega.</li>
          <li>Contenido digital descargado con el consentimiento expreso del consumidor (cursos, ebooks).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Reembolsos</h2>
        <p className="mb-2">
          Los reembolsos se realizarán utilizando el mismo medio de pago que el empleado en la transacción
          original, salvo acuerdo expreso en contrario.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Pagos con tarjeta (Stripe): el reembolso aparecerá en tu extracto en un plazo de 5-10 días
          hábiles, dependiendo de tu banco.</li>
          <li>Los gastos de envío originales solo se reembolsarán si la devolución se debe a un error
          nuestro o a un producto defectuoso.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Garantía legal</h2>
        <p>
          Todos los productos vendidos en Aizüa Store gozan de la garantía legal de conformidad de
          <strong> 3 años</strong> establecida por el Real Decreto-ley 7/2021 que traspone la Directiva
          (UE) 2019/771. Si el producto presenta un defecto de conformidad en ese plazo, podrás solicitar
          la reparación, sustitución, reducción del precio o resolución del contrato según los casos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contacto</h2>
        <p>
          Para cualquier consulta sobre devoluciones, contacta con nosotros en{" "}
          <a href="mailto:info@aizualabs.com" className="text-blue-600 underline">
            info@aizualabs.com
          </a>
          . Nuestro tiempo de respuesta habitual es de 24-48 horas laborables.
        </p>
      </section>
    </main>
  );
}
