import { SiteHeader } from "@/components/site-header";

export default function PrivacidadPage() {
  return (
    <div>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-ink-soft">
        <h1 className="text-2xl font-bold text-ink">Política de Privacidad</h1>
        <p className="mt-1 text-xs text-ink-soft">
          Última actualización: 24 de agosto de 2026 · Adaptada de la política de{" "}
          <a href="https://geifem.com/politica-de-privacidad" className="underline" target="_blank" rel="noreferrer">
            GEIFEM Consultoría
          </a>{" "}
          para GEIFEM Academy, la plataforma de cursos online.
        </p>

        <p className="mt-6">
          GEIFEM ("nosotros", "nuestro" o "la empresa"), a través de su unidad de negocio{" "}
          <strong>GEIFEM Academy</strong>, se compromete a proteger la privacidad y los datos
          personales de las personas que interactúan con esta plataforma de cursos online.
        </p>
        <p className="mt-3">
          Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos
          tu información personal, en cumplimiento de la Ley 1581 de 2012 (Ley de Protección de
          Datos Personales de Colombia) y sus decretos reglamentarios.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">1. Responsable del tratamiento de datos</h2>
        <p className="mt-2">
          Razón social: GEIFEM
          <br />
          Unidad de negocio: GEIFEM Academy
          <br />
          Correo de contacto: contacto@geifem.com
          <br />
          Ciudad: Bogotá D.C., Colombia
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">2. Datos que recopilamos</h2>
        <p className="mt-2">Cuando creas una cuenta, compras un curso o usas la plataforma, podemos recopilar:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Nombre y datos de contacto (correo electrónico)</li>
          <li>Documento de identidad (número y tipo) — requerido para emitir tu factura electrónica</li>
          <li>Historial de compras, matrículas y progreso dentro de los cursos</li>
          <li>Resultados de evaluaciones y certificados obtenidos</li>
          <li>Metadatos técnicos (fecha, hora, dispositivo) para seguridad y soporte</li>
        </ul>
        <p className="mt-3">
          <strong>No almacenamos datos de tu tarjeta ni de tu método de pago</strong> — el pago se
          procesa directamente por ePayco, nuestro proveedor de pasarela de pagos; nosotros solo
          recibimos la confirmación de que el pago fue exitoso.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">3. Finalidad del tratamiento</h2>
        <p className="mt-2">Usamos tu información para:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Darte acceso a los cursos que compraste y hacer seguimiento de tu progreso</li>
          <li>Emitir tu certificado de finalización y permitir su verificación pública</li>
          <li>Emitir la factura electrónica de tu compra (obligación legal DIAN, vía Alegra)</li>
          <li>Responder tus consultas y brindarte soporte</li>
          <li>Enviarte notificaciones relacionadas con tu compra o tu progreso, cuando ese canal esté activo</li>
          <li>Cumplir obligaciones legales o contractuales aplicables</li>
        </ul>

        <h2 className="mt-8 text-lg font-bold text-ink">4. Proveedores que procesan datos en nuestro nombre</h2>
        <p className="mt-2">
          Para operar la plataforma usamos los siguientes proveedores, quienes procesan tus datos
          bajo sus propias políticas de seguridad y solo para los fines aquí descritos:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>ePayco:</strong> procesamiento de pagos (PSE, tarjeta)</li>
          <li><strong>Alegra:</strong> facturación electrónica ante la DIAN</li>
        </ul>

        <h2 className="mt-8 text-lg font-bold text-ink">5. Menores de edad</h2>
        <p className="mt-2">
          GEIFEM Academy está dirigida principalmente a jóvenes recién egresados de bachillerato,
          quienes pueden ser menores de edad. Si eres menor de edad, la creación de tu cuenta y la
          compra de cursos requieren la autorización de tu padre, madre o acudiente legal — ver
          nuestros{" "}
          <a href="/terminos" className="underline">
            Términos y condiciones
          </a>{" "}
          para el detalle de este consentimiento.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">6. Conservación de los datos</h2>
        <p className="mt-2">
          Conservamos tu información personal durante el tiempo necesario para cumplir con las
          finalidades descritas en esta política, incluyendo el tiempo exigido por la normativa
          tributaria y contable aplicable (facturación electrónica).
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">7. Tus derechos</h2>
        <p className="mt-2">Como titular de tus datos personales, tienes derecho a:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Conocer, actualizar y rectificar tu información</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos</li>
          <li>Ser informado sobre el uso que se le ha dado a tus datos</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley</li>
          <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que lo impida</li>
          <li>Acceder de forma gratuita a tus datos personales que hayan sido objeto de tratamiento</li>
        </ul>
        <p className="mt-3">Para ejercer estos derechos, puedes escribirnos a contacto@geifem.com.</p>

        <h2 className="mt-8 text-lg font-bold text-ink">8. Seguridad de la información</h2>
        <p className="mt-2">
          Implementamos medidas técnicas y organizativas razonables para proteger tu información
          contra acceso no autorizado, pérdida o alteración.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">9. Cambios a esta política</h2>
        <p className="mt-2">
          Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio será
          publicado en esta misma página con su respectiva fecha de actualización.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">10. Contacto</h2>
        <p className="mt-2">
          Si tienes preguntas sobre esta Política de Privacidad, contáctanos en contacto@geifem.com.
        </p>
      </article>
    </div>
  );
}
