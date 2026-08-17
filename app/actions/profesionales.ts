"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isCategoria } from "@/lib/profesionales";

export type PerfilFormState = { error?: string; success?: boolean } | undefined;

export async function guardarPerfilProfesional(
  _prevState: PerfilFormState,
  formData: FormData
): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const categorias = formData.getAll("categorias").map(String).filter(isCategoria);
  const zona = formData.get("zona")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim();

  if (categorias.length === 0) {
    return { error: "Selecciona al menos una categoría." };
  }
  if (!zona) {
    return { error: "Indica tu zona de cobertura." };
  }
  if (!descripcion) {
    return { error: "Añade una descripción." };
  }

  const nombre = user.user_metadata?.full_name ?? user.email ?? "Profesional";

  const { error } = await supabase.from("profesionales").upsert(
    { user_id: user.id, nombre, categorias, zona, descripcion },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}
