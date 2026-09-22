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
  const comentario = formData.get("comentario")?.toString().trim() || null;

  const puntualidad = Number(formData.get("puntualidad"));
  const calidad = Number(formData.get("calidad"));
  const precio = Number(formData.get("precio"));
  const comunicacion = Number(formData.get("comunicacion"));

  if (!solicitudId) {
    return { error: "Solicitud inválida." };
  }
  if (!profesionalId) {
    return { error: "Selecciona un profesional." };
  }
  for (const valor of [puntualidad, calidad, precio, comunicacion]) {
    if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
      return { error: "Puntúa los 4 criterios (puntualidad, calidad, precio, comunicación)." };
    }
  }

  // La nota general se calcula como la media de los 4 criterios, redondeada
  // al entero más cercano (la columna puntuacion sigue siendo un entero
  // 1-5), en vez de pedirla también al cliente por separado.
  const puntuacion = Math.round((puntualidad + calidad + precio + comunicacion) / 4);

  const { error: errorValoracion } = await supabase.from("valoraciones").insert({
    solicitud_id: solicitudId,
    profesional_id: profesionalId,
    puntuacion,
    puntualidad,
    calidad,
    precio,
    comunicacion,
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
