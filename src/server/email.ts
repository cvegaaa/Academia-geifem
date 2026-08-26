import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Envío de correo transaccional. Si RESEND_API_KEY todavía no está configurada (cuenta de
 * Resend pendiente de crear), no envía nada y solo deja un log — nunca rompe el flujo que lo
 * llama (compra, certificado, etc.) por un problema de notificaciones.
 */
async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY no configurada — no se envió "${input.subject}" a ${input.to}`);
    return;
  }
  try {
    await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to: input.to, subject: input.subject, html: input.html });
  } catch (err) {
    console.error(`[email] No se pudo enviar "${input.subject}" a ${input.to}:`, err);
  }
}

function wrapper(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #17162b;">
      <p style="font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #4b4a63;">GEIFEM Academy</p>
      <h1 style="font-size: 20px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #4b4a63;">GEIFEM Academy · responsabilidad social de GEIFEM Consultoría</p>
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, nombre: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Bienvenido a GEIFEM Academy",
    html: wrapper(
      `¡Hola, ${nombre}!`,
      `<p>Tu cuenta en GEIFEM Academy ya está lista. Explora el catálogo de cursos cortos y prácticos, hechos para impulsar tu primer empleo.</p>`,
    ),
  });
}

export async function sendPaymentConfirmationEmail(
  to: string,
  nombre: string,
  cursos: string[],
  totalCOP: number,
): Promise<void> {
  const lista = cursos.map((c) => `<li>${c}</li>`).join("");
  await sendEmail({
    to,
    subject: "Confirmación de tu compra en GEIFEM Academy",
    html: wrapper(
      "Tu pago fue confirmado",
      `<p>Hola, ${nombre}. Confirmamos tu compra por <strong>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(totalCOP)}</strong>:</p>
       <ul>${lista}</ul>
       <p>Ya puedes acceder a tus cursos desde tu cuenta en GEIFEM Academy.</p>`,
    ),
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Recupera tu contraseña de GEIFEM Academy",
    html: wrapper(
      "Recuperar contraseña",
      `<p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el siguiente enlace (válido por 1 hora):</p>
       <p><a href="${url}" style="color: #1a3a63; font-weight: bold;">Restablecer contraseña</a></p>
       <p>Si no fuiste tú, puedes ignorar este correo — tu contraseña actual sigue siendo válida.</p>`,
    ),
  });
}

export async function sendCertificateReadyEmail(to: string, nombre: string, curso: string, codigo: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Tu certificado de "${curso}" ya está listo`,
    html: wrapper(
      "¡Felicitaciones!",
      `<p>Hola, ${nombre}. Completaste el curso <strong>${curso}</strong> y tu certificado ya está disponible en tu cuenta.</p>
       <p>Código de verificación: <strong>${codigo}</strong></p>`,
    ),
  });
}
