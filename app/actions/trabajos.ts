"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { FOTOS_BUCKET, MAX_FOTOS_TRABAJO, extraerRutaStorage, isCategoria } from "@/lib/profesionales";

export type TrabajoFormState = { error?: string; success?: boolean } | undefined;

export type FotoTrabajo = { url: string; descripcion: string };

export async function crearTrabajo(
  _prevState: TrabajoFormState,
  formData: FormData
): Promise<TrabajoFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const titulo = formData.get("titulo")?.toString().trim();
  const categoria = formData.get("categoria")?.toString() ?? "";
  const fotosRaw = formData.get("fotos")?.toString();

  if (!titulo) {
    return { error: "Añade un título para el trabajo." };
  }
  if (!isCategoria(categoria)) {
    return { error: "Selecciona una categoría válida." };
  }

  let fotos: FotoTrabajo[];
  try {
    fotos = fotosRaw ? JSON.parse(fotosRaw) : [];
  } catch {
    return { error: "Fotos no válidas." };
  }

  if (!Array.isArray(fotos) || fotos.length === 0) {
    return { error: "Añade al menos una foto del trabajo." };
  }
  if (fotos.length > MAX_FOTOS_TRABAJO) {
    return { error: `Solo puedes añadir un máximo de ${MAX_FOTOS_TRABAJO} fotos.` };
  }
  for (const foto of fotos) {
    if (
      typeof foto?.url !== "string" ||
      typeof foto?.descripcion !== "string" ||
      !extraerRutaStorage(foto.url, user.id)
    ) {
      return { error: "Foto no válida." };
    }
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return { error: "Completa tu perfil antes de añadir trabajos." };
  }

  const { error } = await supabase.from("trabajos").insert({
    profesional_id: perfil.id,
    titulo,
    categoria,
    fotos,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil/trabajos");
  return { success: true };
}

export async function borrarTrabajo(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return;
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return;
  }

  const { data: trabajo } = await supabase
    .from("trabajos")
    .select("id, fotos")
    .eq("id", id)
    .eq("profesional_id", perfil.id)
    .maybeSingle<{ id: string; fotos: FotoTrabajo[] }>();

  if (!trabajo) {
    return;
  }

  await supabase.from("trabajos").delete().eq("id", id);

  const rutas = (trabajo.fotos ?? [])
    .map((foto) => extraerRutaStorage(foto.url, user.id))
    .filter((ruta): ruta is string => ruta !== null);

  if (rutas.length > 0) {
    await supabase.storage.from(FOTOS_BUCKET).remove(rutas);
  }

  revalidatePath("/dashboard/perfil/trabajos");
}
