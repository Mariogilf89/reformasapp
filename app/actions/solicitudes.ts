"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isCategoria } from "@/lib/profesionales";

export type SolicitudFormState = { error?: string; success?: boolean } | undefined;

export async function crearSolicitud(
  _prevState: SolicitudFormState,
  formData: FormData
): Promise<SolicitudFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "cliente") {
    return { error: "No autorizado." };
  }

  const categoria = formData.get("categoria")?.toString() ?? "";
  const zona = formData.get("zona")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim();

  if (!isCategoria(categoria)) {
    return { error: "Selecciona una categoría válida." };
  }
  if (!zona) {
    return { error: "Indica la zona." };
  }
  if (!descripcion) {
    return { error: "Añade una descripción." };
  }

  const { error } = await supabase.from("solicitudes").insert({
    cliente_id: user.id,
    categoria,
    zona,
    descripcion,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/solicitudes");
  return { success: true };
}

export type BorrarSolicitudFormState = { error?: string } | undefined;

/**
 * La RLS de "solicitudes" ("solicitudes_delete_own") ya restringe el
 * borrado al cliente dueño; si la fila no es suya, la sentencia no
 * borra nada y `data` vuelve vacío, en vez de dar un error de permisos.
 */
export async function borrarSolicitud(
  _prevState: BorrarSolicitudFormState,
  formData: FormData
): Promise<BorrarSolicitudFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return { error: "Solicitud inválida." };
  }

  const { data, error } = await supabase
    .from("solicitudes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "No se pudo borrar la solicitud." };
  }

  revalidatePath("/dashboard/solicitudes");
  return undefined;
}
