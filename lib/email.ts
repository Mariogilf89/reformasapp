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

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Cuerpo del email de aviso que recibe Mario cuando un cliente envía un
 * reporte desde "¿Algo fue mal? Cuéntanoslo" (ver app/actions/reportes.ts).
 * contacto/mensaje son texto libre de un usuario no siempre autenticado, así
 * que se escapan antes de meterlos en el HTML del email.
 */
export function construirCuerpoReporteHtml(datos: {
  contacto: string;
  mensaje: string;
  profesionalNombre: string | null;
}) {
  const contacto = escaparHtml(datos.contacto);
  const mensaje = escaparHtml(datos.mensaje).replace(/\n/g, "<br>");
  const profesionalNombre = datos.profesionalNombre ? escaparHtml(datos.profesionalNombre) : null;

  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2>Nuevo reporte en Faenia</h2>
      ${profesionalNombre ? `<p><strong>Profesional:</strong> ${profesionalNombre}</p>` : ""}
      <p><strong>Contacto de quien reporta:</strong> ${contacto}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
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
