import "server-only";
import { Resend } from "resend";

const REMITENTE = "Faenia <notificaciones@faenia.es>";

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
