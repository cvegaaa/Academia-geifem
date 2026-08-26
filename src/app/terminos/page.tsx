import { SiteHeader } from "@/components/site-header";

export default function TerminosPage() {
  return (
    <div>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-ink-soft">
        <h1 className="text-2xl font-bold text-ink">Términos y condiciones de uso</h1>
        <p className="mt-1 text-xs text-ink-soft">Última actualización: 24 de agosto de 2026.</p>

        <h2 className="mt-8 text-lg font-bold text-ink">1. Objeto</h2>
        <p className="mt-2">
          GEIFEM Academy es una plataforma de venta de cursos cortos online, operada por GEIFEM
          Consultoría como parte de su programa de responsabilidad social. Estos Términos regulan
          el uso de la plataforma, la compra de cursos y el acceso a su contenido.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">2. Aceptación</h2>
        <p className="mt-2">
          Al crear una cuenta o comprar un curso en GEIFEM Academy aceptas estos Términos y
          nuestra{" "}
          <a href="/privacidad" className="underline">
            Política de Privacidad
          </a>
          . Si no estás de acuerdo, no debes usar la plataforma.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">3. Menores de edad y consentimiento de acudiente</h2>
        <p className="mt-2">
          GEIFEM Academy está dirigida principalmente a jóvenes recién egresados de bachillerato.
          Si tienes menos de 18 años, la creación de tu cuenta y la compra de cursos requieren la
          autorización expresa de tu padre, madre o acudiente legal, quien:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Declara ser tu representante legal y autoriza tu registro y uso de la plataforma</li>
          <li>Acepta estos Términos y la Política de Privacidad en tu nombre</li>
          <li>Es responsable de la información suministrada y del uso que le des a tu cuenta</li>
        </ul>
        <p className="mt-3">
          GEIFEM se reserva el derecho de solicitar la confirmación de esta autorización en
          cualquier momento y de suspender una cuenta si no puede verificarse.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">4. Registro y cuenta</h2>
        <p className="mt-2">
          Debes registrarte con información veraz y mantenerla actualizada. Eres responsable de la
          confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">5. Compra, pago y facturación</h2>
        <p className="mt-2">
          Los pagos se procesan a través de ePayco (PSE, tarjeta u otros medios habilitados). Al
          confirmarse el pago, se activa tu matrícula y se emite automáticamente tu factura
          electrónica ante la DIAN a nombre del documento de identidad que registraste — es
          obligatorio contar con este dato para poder completar la compra.
        </p>
        <p className="mt-3">
          Los cupones de descuento aplican solo a las condiciones específicas de cada código
          (vigencia, número de usos) y no son acumulables entre sí salvo que se indique lo
          contrario.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">6. Acceso al contenido</h2>
        <p className="mt-2">
          El acceso a un curso se habilita una vez el pago queda confirmado. El contenido es para
          uso personal del estudiante matriculado — no puede compartirse, revenderse ni
          distribuirse.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">7. Certificados</h2>
        <p className="mt-2">
          Al completar el 100% de las unidades de un curso, incluyendo la aprobación de sus
          evaluaciones (mínimo 60% de las respuestas correctas), se emite un certificado digital
          de finalización con un código de verificación pública. Estos certificados corresponden a
          formación no formal (educación para el trabajo y el desarrollo humano — ETDH) y no
          constituyen un título académico ni un grado educativo formal.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">8. Reembolsos y cancelaciones</h2>
        <p className="mt-2">
          Por tratarse de contenido digital de acceso inmediato, no se realizan reembolsos una vez
          el estudiante ha accedido al contenido del curso comprado. Si tuviste un problema técnico
          que te impidió acceder a tu curso, escríbenos a contacto@geifem.com y evaluaremos tu
          caso.
        </p>
        <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-800">
          Nota interna: esta cláusula es un punto de partida razonable, pendiente de que GEIFEM
          confirme su política real de reembolsos antes de publicar esta página en producción.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">9. Becas GEIFEM</h2>
        <p className="mt-2">
          Como parte de la responsabilidad social de GEIFEM, un porcentaje de los ingresos de la
          plataforma se destina a becas 100% gratuitas para jóvenes que no pueden pagar un curso.
          La asignación de beneficiarios es manual y a criterio de GEIFEM.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">10. Propiedad intelectual</h2>
        <p className="mt-2">
          Todo el contenido de los cursos (materiales, videos, evaluaciones) es propiedad de
          GEIFEM o de sus licenciantes. Su compra otorga una licencia personal e intransferible de
          uso, no una cesión de derechos.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">11. Modificaciones</h2>
        <p className="mt-2">
          Podemos actualizar estos Términos periódicamente. Los cambios se publican en esta misma
          página con su fecha de actualización.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">12. Ley aplicable</h2>
        <p className="mt-2">
          Estos Términos se rigen por las leyes de la República de Colombia. Cualquier
          controversia se someterá a los jueces competentes de Bogotá D.C.
        </p>

        <h2 className="mt-8 text-lg font-bold text-ink">13. Contacto</h2>
        <p className="mt-2">Si tienes preguntas sobre estos Términos, contáctanos en contacto@geifem.com.</p>
      </article>
    </div>
  );
}
