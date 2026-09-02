"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isCategoria, type Categoria } from "@/lib/profesionales";
import { isProvincia } from "@/lib/provincias";
import { crearCitaPendiente, obtenerUserIdProfesional } from "@/app/actions/citas";
import { notificarAlertasBusquedaTrabajos } from "@/app/actions/alertas-busqueda";
import {
  crearNotificacion,
  crearOAccederClientePasswordless,
  generarTokenAccesoCliente,
} from "@/lib/supabase-admin";
import { enviarEmail, construirCuerpoEnlaceAccesoHtml } from "@/lib/email";
import { obtenerOrigenPeticion } from "@/lib/rutas";
import { buscarMunicipioPorCp } from "@/lib/codigos-postales";

function esModoTiempoValido(value: string): value is "lo_antes_posible" | "indiferente" | "dia_hora" {
  return value === "lo_antes_posible" || value === "indiferente" || value === "dia_hora";
}

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
  const localidad = formData.get("localidad")?.toString().trim() || null;
  const calle = formData.get("calle")?.toString().trim() || null;

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
    localidad,
    calle,
  });

  if (error) {
    return { error: error.message };
  }

  // Esta solicitud no viene de una búsqueda en /profesionales, así que no
  // hay modo_tiempo/provincia que asociarle (quedan NULL, por defecto).
  await notificarAlertasBusquedaTrabajos({ categoria, zona, provincia: null, modoTiempo: null });

  revalidatePath("/dashboard/solicitudes");
  return { success: true };
}

export type ContactarProfesionalFormState = { error?: string } | undefined;

/**
 * Crea una solicitud desde el perfil público de un profesional y redirige
 * al hilo de esa solicitud con "contactar" ya apuntando a él, reutilizando
 * el flujo de mensaje + cita que ya existe en /dashboard/solicitudes/[id].
 *
 * Ya no exige tener sesión de cliente previa: si no la hay, crea (o
 * recupera, si el email ya existía) una cuenta de cliente passwordless al
 * vuelo e inicia sesión con ella en esta misma respuesta, antes de insertar
 * la solicitud — así la RLS normal ("auth.uid() = cliente_id") se cumple
 * sin tener que saltársela con el cliente de service role. Si ya había
 * sesión de cliente activa (solicitud anterior en este mismo navegador), se
 * reutiliza tal cual, sin volver a pedir nombre/email/teléfono.
 */
export async function crearSolicitudYContactar(
  _prevState: ContactarProfesionalFormState,
  formData: FormData
): Promise<ContactarProfesionalFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: usuarioActual },
  } = await supabase.auth.getUser();

  if (usuarioActual && usuarioActual.user_metadata?.role !== "cliente") {
    return { error: "No autorizado." };
  }

  const profesionalId = formData.get("profesional_id")?.toString();
  const descripcion = formData.get("descripcion")?.toString().trim();
  const codigoPostal = formData.get("codigo_postal")?.toString().trim();

  // Solo llegan si ContactarForm venía de una búsqueda en /profesionales con
  // esos datos (ver modoElegido/provinciaElegida en profesionales/[id]); si
  // no, quedan NULL en la solicitud.
  const modoRaw = formData.get("modo_tiempo")?.toString() || null;
  const provinciaRaw = formData.get("provincia")?.toString() || null;
  const modoTiempo = modoRaw && esModoTiempoValido(modoRaw) ? modoRaw : null;
  let provincia = provinciaRaw && isProvincia(provinciaRaw) ? provinciaRaw : null;

  if (!profesionalId) {
    return { error: "Profesional no válido." };
  }
  if (!descripcion) {
    return { error: "Añade una descripción." };
  }
  if (!codigoPostal || !/^\d{5}$/.test(codigoPostal)) {
    return { error: "Indica un código postal válido." };
  }

  const { data: profesional } = await supabase
    .from("profesionales_publico")
    .select("id, categorias")
    .eq("id", profesionalId)
    .maybeSingle<{ id: string; categorias: Categoria[] }>();

  // Sin selector de categoría en el formulario corto: se usa la primera
  // que ofrece el profesional, igual que ya hacía por defecto el selector.
  const categoria = profesional?.categorias[0];
  if (!profesional || !categoria) {
    return { error: "Ese profesional no está disponible ahora mismo." };
  }

  const resuelto = await buscarMunicipioPorCp(supabase, codigoPostal);
  const zona = resuelto?.municipio ?? codigoPostal;
  if (!provincia && resuelto?.provincia && isProvincia(resuelto.provincia)) {
    provincia = resuelto.provincia;
  }

  let clienteId: string;

  if (usuarioActual) {
    clienteId = usuarioActual.id;
  } else {
    const nombre = formData.get("nombre")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const telefono = formData.get("telefono")?.toString().trim();
    const acceptTerms = formData.get("acceptTerms");

    if (!nombre || !email || !telefono) {
      return { error: "Rellena todos los campos." };
    }
    if (acceptTerms !== "on") {
      return { error: "Debes aceptar los Términos y la Política de Privacidad." };
    }

    const cuenta = await crearOAccederClientePasswordless({ email, nombre, telefono });
    if (!cuenta) {
      return { error: "No se pudo procesar tu solicitud. Inténtalo de nuevo." };
    }

    // "email" (no "magiclink"): generateLink devuelve verification_type
    // "signup" para un email nuevo y "magiclink" para uno ya existente —
    // "email" es el tipo que verifyOtp acepta para ambos casos por igual
    // (comprobado directamente contra la API; usar "magiclink" a secas
    // falla con "Email link is invalid or has expired" en el caso nuevo).
    const { error: errorSesion } = await supabase.auth.verifyOtp({
      token_hash: cuenta.hashedToken,
      type: "email",
    });
    if (errorSesion) {
      return { error: "No se pudo procesar tu solicitud. Inténtalo de nuevo." };
    }

    clienteId = cuenta.userId;

    // El token de arriba ya se ha consumido con verifyOtp (un solo uso):
    // hace falta uno nuevo, sin usar, para el enlace que se manda por
    // email y permite volver desde otro dispositivo/navegador.
    const tokenAcceso = await generarTokenAccesoCliente(email);
    if (tokenAcceso) {
      const origen = await obtenerOrigenPeticion();
      const enlace = `${origen}/auth/entrar-cliente?token_hash=${encodeURIComponent(tokenAcceso)}`;
      try {
        await enviarEmail(
          email,
          "Hemos recibido tu solicitud en Faenia",
          construirCuerpoEnlaceAccesoHtml(enlace)
        );
      } catch (error) {
        console.error("No se pudo enviar el email de acceso al nuevo cliente:", email, error);
      }
    }
  }

  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .insert({
      cliente_id: clienteId,
      categoria,
      zona,
      descripcion,
      codigo_postal: codigoPostal,
      modo_tiempo: modoTiempo,
      provincia,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !solicitud) {
    return { error: error?.message ?? "No se pudo crear la solicitud." };
  }

  await notificarAlertasBusquedaTrabajos({ categoria, zona, provincia, modoTiempo });

  const profesionalUserId = await obtenerUserIdProfesional(supabase, profesionalId);
  if (profesionalUserId) {
    await crearNotificacion(
      profesionalUserId,
      "mensaje_cliente",
      "Nuevo mensaje de un cliente",
      descripcion,
      `/dashboard/solicitudes/${solicitud.id}`
    );
  }

  // Si la búsqueda de profesionales ya traía una fecha/hora elegida (modo
  // "Elegir día y hora"), se propone directamente esa cita además de la
  // solicitud. Es "mejor esfuerzo": si el hueco se ocupó entre la búsqueda
  // y este envío, la solicitud igualmente se ha creado y el cliente puede
  // proponer horario a mano desde el hilo, como siempre.
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();
  if (fecha && horaInicio) {
    await crearCitaPendiente(supabase, {
      solicitudId: solicitud.id,
      profesionalId,
      clienteId,
      tipo: "visita",
      fecha,
      horaInicio,
    });
  }

  revalidatePath("/dashboard/solicitudes");
  redirect(`/dashboard/solicitudes/${solicitud.id}?contactar=${profesionalId}#mensaje`);
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
