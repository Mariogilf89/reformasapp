"use server";

import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Marca que el profesional ya ha visto el tour guiado del calendario (lo
 * haya completado o saltado, sin distinción — ver useCalendarioTour). No se
 * llama al volver a verlo desde el botón "¿Cómo funciona?": esa relanzada no
 * debe tocar esta columna.
 */
export async function marcarCalendarioTourVisto(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") return;

  await supabase
    .from("profesionales")
    .update({ calendario_tour_visto: true })
    .eq("user_id", user.id);
}
