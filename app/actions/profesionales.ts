"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { FOTOS_BUCKET, MAX_FOTOS_PROFESIONAL, isCategoria } from "@/lib/profesionales";

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

// Extrae la ruta dentro del bucket (userId/archivo.ext) de una URL pública,
// verificando que la foto pertenece a la carpeta del propio usuario.
function extraerRutaStorage(url: string, userId: string): string | null {
  const marcador = `/storage/v1/object/public/${FOTOS_BUCKET}/${userId}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return `${userId}/${url.slice(indice + marcador.length)}`;
}

export async function agregarFotoProfesional(url: string): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  if (!extraerRutaStorage(url, user.id)) {
    return { error: "Foto no válida." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, fotos")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; fotos: string[] }>();

  if (!perfil) {
    return { error: "Completa tu perfil antes de añadir fotos." };
  }

  const fotosActuales = perfil.fotos ?? [];
  if (fotosActuales.length >= MAX_FOTOS_PROFESIONAL) {
    return { error: `Solo puedes tener un máximo de ${MAX_FOTOS_PROFESIONAL} fotos.` };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ fotos: [...fotosActuales, url] })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

export async function borrarFotoProfesional(url: string): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const ruta = extraerRutaStorage(url, user.id);
  if (!ruta) {
    return { error: "Foto no válida." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, fotos")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; fotos: string[] }>();

  if (!perfil) {
    return { error: "No autorizado." };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ fotos: (perfil.fotos ?? []).filter((foto) => foto !== url) })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.storage.from(FOTOS_BUCKET).remove([ruta]);

  revalidatePath("/dashboard/perfil");
  return { success: true };
}
