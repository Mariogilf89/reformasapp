import "server-only";
import { Resend } from "resend";

const REMITENTE = "Faenia <notificaciones@faenia.es>";

/**
 * Cuerpo del email de acceso passwordless de un cliente (cuenta creada al
 * contactar a un profesional, sin contraseña). Lo usan tanto el aviso al
 * crear la cuenta (crearSolicitudYContactar) como el reenvío manual
 * (reenviarAccesoCliente) — mismo enlace, mismo mensaje en los dos sitios.
 */
export function construirCuerpoEnlaceAccesoHtml(enlace: string) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2>Accede a tu cuenta de Faenia</h2>
      <p>Pulsa el siguiente enlace para entrar y ver el estado de tus solicitudes:</p>
      <p><a href="${enlace}">${enlace}</a></p>
    </div>
  `;
}

export async function enviarEmail(destinatario: string, asunto: string, cuerpoHtml: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: destinatario,
    subject: asunto,
    html: cuerpoHtml,
  });

  if (error) {
    throw new Error(error.message);
  }
}
