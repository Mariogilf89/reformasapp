"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isTipoCita } from "@/lib/citas";
import { crearCitaPendiente } from "./citas";

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
  const destinatarioId = formData.get("destinatario_id")?.toString() || null;

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
    destinatario_id: destinatarioId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
  return undefined;
}

/**
 * Combina el primer mensaje a un profesional con una propuesta de cita
 * opcional, para el flujo "Contactar" antes de que el profesional haya
 * respondido. Si el cliente no eligió fecha/hora, solo se envía el
 * mensaje, igual que antes.
 */
export async function enviarMensajeConCita(
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
  const destinatarioId = formData.get("destinatario_id")?.toString();
  const texto = formData.get("texto")?.toString().trim();
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();
  const tipoInput = formData.get("tipo")?.toString() ?? "";
  const tipo = isTipoCita(tipoInput) ? tipoInput : "visita";

  if (!solicitudId) {
    return { error: "Solicitud inválida." };
  }
  if (!destinatarioId) {
    return { error: "Selecciona un profesional." };
  }
  if (!texto) {
    return { error: "Escribe un mensaje." };
  }

  const { error: errorMensaje } = await supabase.from("mensajes").insert({
    solicitud_id: solicitudId,
    remitente_id: user.id,
    texto,
    destinatario_id: destinatarioId,
  });

  if (errorMensaje) {
    return { error: errorMensaje.message };
  }

  if (fecha && horaInicio) {
    const resultadoCita = await crearCitaPendiente(supabase, {
      solicitudId,
      profesionalId: destinatarioId,
      clienteId: user.id,
      tipo,
      fecha,
      horaInicio,
    });

    if (resultadoCita.error) {
      revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
      return {
        error: `El mensaje se envió, pero no se pudo proponer la cita: ${resultadoCita.error}`,
      };
    }

    revalidatePath("/dashboard/citas");
  }

  revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
  return undefined;
}
