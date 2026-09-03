"use server";

import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Marca que el profesional ya ha visto el pop-up de bienvenida (lo haya
 * recorrido entero o cerrado con la X en cualquier diapositiva, sin
 * distinción — mismo criterio que marcarCalendarioTourVisto).
 */
export async function marcarPopupBienvenidaVisto(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") return;

  await supabase
    .from("profesionales")
    .update({ popup_bienvenida_visto: true })
    .eq("user_id", user.id);
}
