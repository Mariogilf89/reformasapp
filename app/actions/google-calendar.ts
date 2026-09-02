"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propioProfesionalId } from "@/app/actions/citas";
import { obtenerConexionGoogleCalendar, eliminarConexionGoogleCalendar } from "@/lib/supabase-admin";
import { refrescarAccessToken, eliminarCalendarioGoogle } from "@/lib/google-calendar";

export type EstadoGoogleCalendar = { conectado: boolean; googleEmail: string | null };

/** Llamable directamente desde un Server Component, no es una form action. */
export async function obtenerEstadoGoogleCalendar(): Promise<EstadoGoogleCalendar> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { conectado: false, googleEmail: null };

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) return { conectado: false, googleEmail: null };

  const conexion = await obtenerConexionGoogleCalendar(profesionalId);
  return { conectado: Boolean(conexion), googleEmail: conexion?.googleEmail ?? null };
}

export type DesconectarGoogleCalendarState = { error?: string } | undefined;

export async function desconectarGoogleCalendar(
  _prevState: DesconectarGoogleCalendarState,
  _formData: FormData
): Promise<DesconectarGoogleCalendarState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) return { error: "No autorizado." };

  const conexion = await obtenerConexionGoogleCalendar(profesionalId);
  if (!conexion) return undefined; // ya estaba desconectado

  // Best-effort: borrar el calendario "Faenia" en Google. Un fallo aquí
  // (token revocado, calendario ya borrado a mano...) no debe impedir
  // desconectar en Faenia.
  try {
    const { accessToken } = await refrescarAccessToken(conexion.refreshToken);
    await eliminarCalendarioGoogle(accessToken, conexion.googleCalendarId);
  } catch (error) {
    console.error("No se pudo borrar el calendario Faenia en Google:", error);
  }

  await eliminarConexionGoogleCalendar(profesionalId);

  await supabase
    .from("citas")
    .update({ google_event_id: null })
    .eq("profesional_id", profesionalId)
    .not("google_event_id", "is", null);

  revalidatePath("/dashboard/perfil/calendario-google");
  return undefined;
}
