import "server-only";
import {
  refrescarAccessToken,
  crearEventoGoogle,
  actualizarEventoGoogle,
  eliminarEventoGoogle,
  type EventoGoogleInput,
} from "@/lib/google-calendar";
import {
  obtenerConexionGoogleCalendar,
  actualizarAccessTokenGoogleCalendar,
} from "@/lib/supabase-admin";
import { TIPOS_CITA, type TipoCita } from "@/lib/citas";
import type { Supabase } from "@/app/actions/citas";

export type CitaGoogleSyncInput = {
  id: string;
  profesionalId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  origenExterno: boolean;
  tituloExterno: string | null;
  tipo: TipoCita | null;
  localidad: string | null;
  calle: string | null;
  nombreCliente: string | null; // solo citas reales
  contactoNombre: string | null; // solo citas externas
  contactoTelefono: string | null; // solo citas externas
  comentario: string | null; // solo citas reales
  googleEventId: string | null; // evento ya existente, si lo había
};

/** Con margen de 1 minuto para no usar un access_token a punto de caducar. */
async function obtenerConexionActiva(
  profesionalId: string
): Promise<{ accessToken: string; googleCalendarId: string } | null> {
  const conexion = await obtenerConexionGoogleCalendar(profesionalId);
  if (!conexion) return null;

  const expiraEnMs = conexion.accessTokenExpiraEn ? new Date(conexion.accessTokenExpiraEn).getTime() : 0;
  if (conexion.accessToken && expiraEnMs - Date.now() > 60_000) {
    return { accessToken: conexion.accessToken, googleCalendarId: conexion.googleCalendarId };
  }

  const { accessToken, expiraEn } = await refrescarAccessToken(conexion.refreshToken);
  await actualizarAccessTokenGoogleCalendar(profesionalId, accessToken, expiraEn.toISOString());
  return { accessToken, googleCalendarId: conexion.googleCalendarId };
}

function etiquetaTipo(tipo: TipoCita | null) {
  return TIPOS_CITA.find((t) => t.value === tipo)?.label ?? "Cita";
}

function mapearCitaAEventoGoogle(cita: CitaGoogleSyncInput): EventoGoogleInput {
  const summary = cita.origenExterno
    ? cita.tituloExterno ?? "Bloqueo"
    : `Cita con ${cita.nombreCliente ?? "cliente"} (${etiquetaTipo(cita.tipo)})`;

  const location = [cita.calle, cita.localidad].filter(Boolean).join(", ") || undefined;

  const description = cita.origenExterno
    ? [
        cita.contactoNombre ? `Contacto: ${cita.contactoNombre}` : null,
        cita.contactoTelefono ? `Teléfono: ${cita.contactoTelefono}` : null,
      ]
        .filter(Boolean)
        .join("\n") || undefined
    : cita.comentario ?? undefined;

  return {
    summary,
    location,
    description,
    fecha: cita.fecha,
    horaInicio: cita.horaInicio,
    horaFin: cita.horaFin,
  };
}

/**
 * Crea o actualiza el evento de Google Calendar de una cita confirmada.
 * Atrapa sus propios errores (token revocado, API caída, etc.) para que la
 * server action que ya guardó en BD nunca se vea afectada — mismo contrato
 * que notificarCambioCita en app/actions/citas.ts.
 */
export async function sincronizarCitaGoogleCalendar(
  supabase: Supabase,
  cita: CitaGoogleSyncInput
): Promise<void> {
  try {
    const conexion = await obtenerConexionActiva(cita.profesionalId);
    if (!conexion) return; // el profesional no tiene Google Calendar conectado

    const evento = mapearCitaAEventoGoogle(cita);

    if (cita.googleEventId) {
      await actualizarEventoGoogle(conexion.accessToken, conexion.googleCalendarId, cita.googleEventId, evento);
      return;
    }

    const eventId = await crearEventoGoogle(conexion.accessToken, conexion.googleCalendarId, evento);
    await supabase.from("citas").update({ google_event_id: eventId }).eq("id", cita.id);
  } catch (error) {
    console.error("Error al sincronizar la cita con Google Calendar:", cita.id, error);
  }
}

/**
 * Borra el evento de Google Calendar de una cita que deja de estar
 * confirmada (o se cancela). No hace nada si la cita nunca tuvo evento.
 */
export async function eliminarEventoGoogleDeCita(
  supabase: Supabase,
  profesionalId: string,
  citaId: string,
  googleEventId: string | null
): Promise<void> {
  if (!googleEventId) return;
  try {
    const conexion = await obtenerConexionActiva(profesionalId);
    if (conexion) {
      await eliminarEventoGoogle(conexion.accessToken, conexion.googleCalendarId, googleEventId);
    }
    await supabase.from("citas").update({ google_event_id: null }).eq("id", citaId);
  } catch (error) {
    console.error("Error al borrar el evento de Google Calendar:", citaId, error);
  }
}
