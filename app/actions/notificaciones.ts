"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Notificacion } from "@/lib/notificaciones";

export async function obtenerNotificaciones(): Promise<Notificacion[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("notificaciones")
    .select("id, tipo, titulo, cuerpo, url, leida, creado_en")
    .order("creado_en", { ascending: false })
    .limit(20)
    .returns<Notificacion[]>();

  return data ?? [];
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
  revalidatePath("/dashboard");
}

export async function marcarTodasLeidas(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("usuario_id", user.id)
    .eq("leida", false);
  revalidatePath("/dashboard");
}
