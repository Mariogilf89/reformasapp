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
