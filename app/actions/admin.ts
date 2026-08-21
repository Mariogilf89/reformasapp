"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DOCUMENTOS_IDENTIDAD_BUCKET } from "@/lib/profesionales";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    return { supabase, esAdmin: false as const };
  }
  return { supabase, esAdmin: true as const };
}

export async function aprobarVerificacion(formData: FormData) {
  const { supabase, esAdmin } = await requireAdmin();
  if (!esAdmin) return;

  const profesionalId = formData.get("profesional_id")?.toString();
  if (!profesionalId) return;

  await supabase
    .from("profesionales")
    .update({ verificado: true, verificado_en: new Date().toISOString() })
    .eq("id", profesionalId);

  revalidatePath("/admin/verificaciones");
}

export async function rechazarVerificacion(formData: FormData) {
  const { supabase, esAdmin } = await requireAdmin();
  if (!esAdmin) return;

  const profesionalId = formData.get("profesional_id")?.toString();
  const documentoRuta = formData.get("documento_ruta")?.toString();
  if (!profesionalId) return;

  await supabase
    .from("profesionales")
    .update({ documento_identidad_url: null, verificado: false, verificado_en: null })
    .eq("id", profesionalId);

  if (documentoRuta) {
    await supabase.storage.from(DOCUMENTOS_IDENTIDAD_BUCKET).remove([documentoRuta]);
  }

  revalidatePath("/admin/verificaciones");
}
