"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";

export type MensajeFormState = { error?: string } | undefined;

export async function enviarMensaje(
  _prevState: MensajeFormState,
  formData: FormData
): Promise<MensajeFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const solicitudId = formData.get("solicitud_id")?.toString();
  const texto = formData.get("texto")?.toString().trim();

  if (!solicitudId) {
    return { error: "Solicitud inválida." };
  }
  if (!texto) {
    return { error: "Escribe un mensaje." };
  }

  const { error } = await supabase.from("mensajes").insert({
    solicitud_id: solicitudId,
    remitente_id: user.id,
    texto,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
  return undefined;
}
