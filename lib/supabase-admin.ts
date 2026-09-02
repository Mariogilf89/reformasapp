import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { TipoNotificacion } from "@/lib/notificaciones";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

function createAdminSupabaseClient() {
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Resuelve el email de un usuario a partir de su user_id usando la
 * service role key. Solo debe llamarse desde server actions, nunca
 * desde código que pueda acabar en el bundle de cliente.
 */
export async function obtenerEmailUsuario(userId: string): Promise<string | null> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    console.error("No se pudo resolver el email del usuario", userId, error);
    return null;
  }

  return data.user.email;
}

export type ContactoTelefonico = { telefono: string | null; verificado: boolean; nombre: string | null };

/**
 * Resuelve el teléfono (y si está verificado por SMS) guardado en
 * user_metadata de un usuario a partir de su user_id usando la service role
 * key. Solo debe llamarse desde server actions o Server Components, nunca
 * desde código que pueda acabar en el bundle de cliente.
 */
export async function obtenerContactoTelefonicoUsuario(userId: string): Promise<ContactoTelefonico> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("No se pudo resolver el teléfono del usuario", userId, error);
    return { telefono: null, verificado: false, nombre: null };
  }

  const metadata = data.user.user_metadata as
    | { telefono?: string; telefono_verificado?: boolean; full_name?: string }
    | null;

  return {
    telefono: metadata?.telefono ?? null,
    verificado: metadata?.telefono_verificado === true,
    nombre: metadata?.full_name ?? null,
  };
}

/**
 * Crea una notificación in-app para un usuario. Usa la service role porque
 * quien dispara el evento (p.ej. un cliente aceptando una cita) casi nunca
 * es el destinatario, y la RLS de "notificaciones" solo deja insertar/leer
 * las propias.
 */
export async function crearNotificacion(
  usuarioId: string,
  tipo: TipoNotificacion,
  titulo: string,
  cuerpo?: string | null,
  url?: string | null
): Promise<void> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { error } = await supabaseAdmin.from("notificaciones").insert({
    usuario_id: usuarioId,
    tipo,
    titulo,
    cuerpo: cuerpo ?? null,
    url: url ?? null,
  });

  if (error) {
    console.error("No se pudo crear la notificación", usuarioId, tipo, error);
  }
}

export type ConexionGoogleCalendar = {
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiraEn: string | null;
  googleCalendarId: string;
  googleEmail: string | null;
};

/**
 * Lee la conexión de Google Calendar de un profesional. Usa la service role
 * porque la tabla "google_calendar_conexiones" no tiene ninguna policy RLS
 * para authenticated/anon a propósito: el refresh_token nunca debe ser
 * legible desde el cliente normal.
 */
export async function obtenerConexionGoogleCalendar(
  profesionalId: string
): Promise<ConexionGoogleCalendar | null> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data } = await supabaseAdmin
    .from("google_calendar_conexiones")
    .select("refresh_token, access_token, access_token_expira_en, google_calendar_id, google_email")
    .eq("profesional_id", profesionalId)
    .maybeSingle<{
      refresh_token: string;
      access_token: string | null;
      access_token_expira_en: string | null;
      google_calendar_id: string;
      google_email: string | null;
    }>();

  if (!data) return null;

  return {
    refreshToken: data.refresh_token,
    accessToken: data.access_token,
    accessTokenExpiraEn: data.access_token_expira_en,
    googleCalendarId: data.google_calendar_id,
    googleEmail: data.google_email,
  };
}

/**
 * ¿Toca ofrecerle a este profesional conectar Google Calendar? Solo si
 * nunca se le ha enseñado ya la pantalla de consentimiento
 * ("calendario_google_ofrecido") y todavía no tiene una conexión guardada.
 * La usan tanto el login (app/auth/callback/route.ts) como el primer
 * guardado de perfil (app/actions/profesionales.ts) para disparar el
 * auto-conectar una única vez en la vida del profesional.
 */
export async function debeOfrecerseConectarGoogleCalendar(profesionalId: string): Promise<boolean> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data } = await supabaseAdmin
    .from("profesionales")
    .select("calendario_google_ofrecido")
    .eq("id", profesionalId)
    .maybeSingle<{ calendario_google_ofrecido: boolean }>();

  if (!data || data.calendario_google_ofrecido) return false;

  const conexion = await obtenerConexionGoogleCalendar(profesionalId);
  return conexion === null;
}

/**
 * Marca que ya se le ha enseñado a este profesional la pantalla de
 * consentimiento de Google Calendar (la haya completado o cancelado), para
 * que el auto-conectar del login/primer perfil no vuelva a insistir.
 */
export async function marcarCalendarioGoogleOfrecido(profesionalId: string): Promise<void> {
  const supabaseAdmin = createAdminSupabaseClient();
  await supabaseAdmin
    .from("profesionales")
    .update({ calendario_google_ofrecido: true })
    .eq("id", profesionalId);
}

/** Upsert por profesional_id: se usa tanto al conectar por primera vez como al reconectar. */
export async function guardarConexionGoogleCalendar(
  profesionalId: string,
  datos: {
    refreshToken: string;
    accessToken: string;
    accessTokenExpiraEn: string;
    googleCalendarId: string;
    googleEmail: string | null;
  }
): Promise<void> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { error } = await supabaseAdmin.from("google_calendar_conexiones").upsert(
    {
      profesional_id: profesionalId,
      refresh_token: datos.refreshToken,
      access_token: datos.accessToken,
      access_token_expira_en: datos.accessTokenExpiraEn,
      google_calendar_id: datos.googleCalendarId,
      google_email: datos.googleEmail,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "profesional_id" }
  );

  if (error) {
    console.error("No se pudo guardar la conexión de Google Calendar", profesionalId, error);
  }
}

/** Cachea el access_token de corta duración para no refrescarlo en cada sincronización. */
export async function actualizarAccessTokenGoogleCalendar(
  profesionalId: string,
  accessToken: string,
  expiraEn: string
): Promise<void> {
  const supabaseAdmin = createAdminSupabaseClient();
  await supabaseAdmin
    .from("google_calendar_conexiones")
    .update({
      access_token: accessToken,
      access_token_expira_en: expiraEn,
      actualizado_en: new Date().toISOString(),
    })
    .eq("profesional_id", profesionalId);
}

export async function eliminarConexionGoogleCalendar(profesionalId: string): Promise<void> {
  const supabaseAdmin = createAdminSupabaseClient();
  await supabaseAdmin.from("google_calendar_conexiones").delete().eq("profesional_id", profesionalId);
}

export type AlertaBusquedaCoincidente = { profesionalId: string; userId: string };

/**
 * Alertas guardadas (alertas_busqueda_trabajos) que encajan con una
 * solicitud recién creada, con el user_id del profesional que la guardó ya
 * resuelto para poder avisarle por email. Usa la service role porque la RLS
 * de esa tabla es "solo mis propias alertas": la solicitud la crea un
 * cliente, que no puede ver las alertas de ningún profesional.
 */
export async function buscarAlertasBusquedaCoincidentes(solicitud: {
  categoria: string;
  provincia: string | null;
  modoTiempo: string | null;
}): Promise<AlertaBusquedaCoincidente[]> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin
    .from("alertas_busqueda_trabajos")
    .select("profesional_id, categoria, provincia, modo_tiempo, profesionales(user_id)")
    .returns<
      {
        profesional_id: string;
        categoria: string | null;
        provincia: string | null;
        modo_tiempo: string | null;
        profesionales: { user_id: string } | null;
      }[]
    >();

  if (error || !data) {
    console.error("No se pudieron leer las alertas de búsqueda de trabajos", error);
    return [];
  }

  return data
    .filter(
      (alerta) =>
        alerta.profesionales &&
        (alerta.categoria === null || alerta.categoria === solicitud.categoria) &&
        (alerta.provincia === null || alerta.provincia === solicitud.provincia) &&
        (alerta.modo_tiempo === null || alerta.modo_tiempo === solicitud.modoTiempo)
    )
    .map((alerta) => ({ profesionalId: alerta.profesional_id, userId: alerta.profesionales!.user_id }));
}

/**
 * Crea (o recupera, si el email ya existía) una cuenta de cliente
 * passwordless y devuelve un token de un solo uso para iniciarle sesión al
 * momento. "generateLink" con type "magiclink" crea el usuario si no
 * existe (confirmado en el propio SDK de Supabase), así que sirve tanto
 * para el primer contacto de un email nuevo como para uno que ya tenía
 * cuenta de cliente de una solicitud anterior.
 */
export async function crearOAccederClientePasswordless(datos: {
  email: string;
  nombre: string;
  telefono: string;
}): Promise<{ userId: string; hashedToken: string } | null> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: datos.email,
    options: {
      data: { role: "cliente", full_name: datos.nombre, telefono: datos.telefono },
    },
  });

  if (error || !data.user || !data.properties) {
    console.error("No se pudo crear/recuperar la cuenta de cliente passwordless", datos.email, error);
    return null;
  }

  return { userId: data.user.id, hashedToken: data.properties.hashed_token };
}

/**
 * Genera un token de acceso nuevo para un cliente que ya tiene cuenta,
 * para el email de "vuelve cuando quieras" (justo tras crear la solicitud,
 * o desde "reenviar acceso" en el login). Independiente del token que
 * inicia sesión al momento en crearOAccederClientePasswordless: ese ya se
 * consume ahí mismo con verifyOtp, hace falta uno nuevo sin usar para el
 * enlace que se manda por email.
 */
export async function generarTokenAccesoCliente(email: string): Promise<string | null> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data.properties) {
    console.error("No se pudo generar el enlace de acceso del cliente", email, error);
    return null;
  }

  return data.properties.hashed_token;
}
