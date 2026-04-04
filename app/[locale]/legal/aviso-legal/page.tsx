import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AvisoLegalPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Aviso Legal</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Datos del titular</h2>
        <p className="mb-2">
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
          Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos identificativos:
        </p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>Titular:</strong> Aizüa</li>
          <li><strong>Actividad:</strong> Comercio electrónico y servicios de consultoría/formación</li>
          <li><strong>NIF:</strong> En poder del titular (disponible a requerimiento de autoridad competente)</li>
          <li><strong>Domicilio fiscal:</strong> España</li>
          <li><strong>Correo electrónico:</strong> aizualabs@outlook.com</li>
          <li><strong>Web:</strong> https://aizua-store.vercel.app</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Objeto y ámbito de aplicación</h2>
        <p className="mb-2">
          El presente Aviso Legal regula el acceso y el uso del sitio web de Aizüa Store (en adelante, "el Sitio"),
          propiedad de Aizüa. El acceso al Sitio implica la aceptación plena y sin reservas de las presentes
          condiciones.
        </p>
        <p>
          Este Aviso Legal se aplica a todos los usuarios que accedan o utilicen el Sitio, independientemente de su
          país de residencia o de la finalidad de su visita.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Propiedad intelectual e industrial</h2>
        <p className="mb-2">
          Todos los contenidos del Sitio — incluyendo textos, imágenes, logotipos, marcas, diseños, código fuente y
          elementos multimedia — son propiedad de Aizüa o de terceros que han autorizado su uso, y están
          protegidos por la legislación vigente en materia de propiedad intelectual e industrial.
        </p>
        <p className="mb-2">
          Queda prohibida la reproducción, distribución, comunicación pública o transformación total o parcial de
          dichos contenidos sin autorización expresa y por escrito del titular, salvo que la ley lo permita.
        </p>
        <p>
          El usuario puede visualizar y, en su caso, realizar copias privadas de los contenidos para uso exclusivamente
          personal y no comercial, siempre que no se supriman los indicadores de derechos de propiedad intelectual.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Condiciones de uso</h2>
        <p className="mb-2">El usuario se compromete a:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Utilizar el Sitio de conformidad con la ley, la moral, el orden público y el presente Aviso Legal.</li>
          <li>No realizar actividades ilícitas, fraudulentas o lesivas de los derechos de terceros.</li>
          <li>No introducir virus, malware o cualquier otro código dañino que pueda perjudicar los sistemas del Sitio.</li>
          <li>No intentar acceder a zonas restringidas del Sitio sin autorización.</li>
          <li>No usar el Sitio con fines comerciales sin el consentimiento expreso del titular.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Exclusión de responsabilidad</h2>
        <p className="mb-2">
          Aizüa no se hace responsable de los daños y perjuicios derivados de:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Interrupciones, errores técnicos o fallos en el acceso al Sitio debidos a causas ajenas.</li>
          <li>La presencia de virus u otros elementos que pudieran causar daños en sistemas informáticos del usuario.</li>
          <li>El uso del Sitio por menores de edad sin supervisión de sus tutores legales.</li>
          <li>Los contenidos de páginas de terceros enlazadas desde el Sitio.</li>
          <li>Los daños derivados de la interrupción temporal o definitiva del servicio.</li>
        </ul>
        <p className="mt-2">
          El titular no garantiza la disponibilidad continua del Sitio y se reserva el derecho de suspenderlo o
          modificarlo cuando lo estime necesario, sin previo aviso.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Legislación aplicable y jurisdicción</h2>
        <p className="mb-2">
          El presente Aviso Legal se rige por la legislación española, en particular por:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).</li>
          <li>Real Decreto Legislativo 1/2007 (TRLGDCU) — protección de consumidores y usuarios.</li>
          <li>Reglamento (UE) 2016/679 (RGPD) — protección de datos personales.</li>
        </ul>
        <p className="mt-2">
          Para la resolución de cualquier conflicto derivado del acceso o uso del Sitio, las partes se someten a los
          Juzgados y Tribunales del domicilio del usuario, salvo que la ley disponga otra cosa.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Modificaciones del aviso legal</h2>
        <p>
          Aizüa se reserva el derecho de modificar el presente Aviso Legal en cualquier momento. Las
          modificaciones entrarán en vigor desde su publicación en el Sitio. Se recomienda al usuario revisar
          periódicamente este aviso para estar informado de posibles cambios.
        </p>
      </section>
    </main>
  );
}
