"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";

export type ValoracionFormState = { error?: string } | undefined;

export async function crearValoracion(
  _prevState: ValoracionFormState,
  formData: FormData
): Promise<ValoracionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const solicitudId = formData.get("solicitud_id")?.toString();
  const profesionalId = formData.get("profesional_id")?.toString();
  const puntuacion = Number(formData.get("puntuacion"));
  const comentario = formData.get("comentario")?.toString().trim() || null;

  if (!solicitudId) {
    return { error: "Solicitud inválida." };
  }
  if (!profesionalId) {
    return { error: "Selecciona un profesional." };
  }
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    return { error: "La puntuación debe ser de 1 a 5." };
  }

  const { error: errorValoracion } = await supabase.from("valoraciones").insert({
    solicitud_id: solicitudId,
    profesional_id: profesionalId,
    puntuacion,
    comentario,
  });

  if (errorValoracion) {
    return { error: errorValoracion.message };
  }

  const { error: errorSolicitud } = await supabase
    .from("solicitudes")
    .update({ estado: "cerrada" })
    .eq("id", solicitudId);

  if (errorSolicitud) {
    return { error: errorSolicitud.message };
  }

  revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
  return undefined;
}
