"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { construirCuerpoReporteHtml, enviarEmail } from "@/lib/email";

const EMAIL_AVISO_REPORTES = "mariogilf89@gmail.com";

export type ReporteFormState = { error?: string; success?: boolean } | undefined;

/**
 * Canal mínimo de "¿Algo fue mal? Cuéntanoslo": guarda el reporte en la
 * tabla reportes (revisión manual por ahora, sin panel de administración)
 * y avisa a Mario por email. No exige sesión iniciada — reportes_insert_publico
 * (20260922020000_create_reportes.sql) permite insertar a anon y a
 * authenticated por igual.
 */
export async function crearReporte(
  _prevState: ReporteFormState,
  formData: FormData
): Promise<ReporteFormState> {
  const supabase = await createServerSupabaseClient();

  const contacto = formData.get("contacto")?.toString().trim();
  const mensaje = formData.get("mensaje")?.toString().trim();
  const profesionalId = formData.get("profesional_id")?.toString() || null;
  const solicitudId = formData.get("solicitud_id")?.toString() || null;
  const profesionalNombre = formData.get("profesional_nombre")?.toString() || null;

  if (!contacto) {
    return { error: "Indica un email o teléfono de contacto." };
  }
  if (!mensaje) {
    return { error: "Cuéntanos qué ha pasado." };
  }

  const { error } = await supabase.from("reportes").insert({
    contacto,
    mensaje,
    profesional_id: profesionalId,
    solicitud_id: solicitudId,
  });

  if (error) {
    return { error: error.message };
  }

  try {
    await enviarEmail(
      EMAIL_AVISO_REPORTES,
      "Nuevo reporte en Faenia",
      construirCuerpoReporteHtml({ contacto, mensaje, profesionalNombre })
    );
  } catch (emailError) {
    // El reporte ya ha quedado guardado en la tabla aunque falle el aviso
    // por email, así que no se pierde: solo se registra el fallo.
    console.error("No se pudo enviar el email de aviso de reporte:", emailError);
  }

  return { success: true };
}
