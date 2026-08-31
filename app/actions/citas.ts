"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_CITA, type TipoCita, type EstadoCita, type PropuestoPor } from "@/lib/citas";
import {
  obtenerEmailUsuario,
  obtenerContactoTelefonicoUsuario,
  crearNotificacion,
} from "@/lib/supabase-admin";
import { enviarEmail } from "@/lib/email";

export type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

// solape: true solo lo devuelve crearCitaExterna cuando el error es
// justamente un solapamiento con otra cita confirmada, para que el cliente
// pueda distinguirlo de otros errores y ofrecer "continuar de todas formas"
// (reenviando con permitir_solape=1) en vez de solo mostrarlo.
export type CitaAccionFormState = { error?: string; solape?: boolean } | undefined;

function aMinutos(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function aHoraTexto(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function finConFallback(horaInicio: string, horaFin: string | null) {
  return horaFin ? aMinutos(horaFin) : aMinutos(horaInicio) + 60;
}

function seSuperponen(inicioA: number, finA: number, inicioB: number, finB: number) {
  return inicioA < finB && inicioB < finA;
}

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function etiquetaTipo(tipo: string) {
  return TIPOS_CITA.find((t) => t.value === tipo)?.label ?? tipo;
}

function formatearFechaLarga(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearHoraCorta(hora: string | null) {
  return hora ? hora.slice(0, 5) : null;
}

function construirCuerpoCitaHtml(opts: {
  titulo: string;
  mensaje: string;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  tipo: string;
  motivo?: string | null;
}) {
  const { titulo, mensaje, fecha, horaInicio, horaFin, tipo, motivo } = opts;
  const inicio = formatearHoraCorta(horaInicio);
  const fin = formatearHoraCorta(horaFin);
  const horaTexto = fin ? `${inicio} - ${fin}` : `${inicio} (hora de fin por confirmar)`;

  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2>${escapeHtml(titulo)}</h2>
      <p>${escapeHtml(mensaje)}</p>
      <ul>
        <li><strong>Fecha:</strong> ${escapeHtml(formatearFechaLarga(fecha))}</li>
        <li><strong>Hora:</strong> ${escapeHtml(horaTexto)}</li>
        <li><strong>Tipo de cita:</strong> ${escapeHtml(etiquetaTipo(tipo))}</li>
      </ul>
      ${motivo ? `<p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>` : ""}
    </div>
  `;
}

/**
 * Envía la notificación por email sin dejar que un fallo (API caída,
 * usuario sin email resoluble, etc.) interrumpa la acción principal:
 * el cambio en la base de datos ya se ha guardado cuando se llama a esto.
 */
async function notificarCambioCita(destinatario: string | null, asunto: string, cuerpoHtml: string) {
  if (!destinatario) {
    console.error("No se pudo enviar la notificación de cita: destinatario sin email resoluble.");
    return;
  }
  try {
    await enviarEmail(destinatario, asunto, cuerpoHtml);
  } catch (error) {
    console.error("Error al enviar el email de notificación de cita:", error);
  }
}

export async function obtenerUserIdProfesional(supabase: Supabase, profesionalId: string) {
  const { data } = await supabase
    .from("profesionales")
    .select("user_id")
    .eq("id", profesionalId)
    .maybeSingle<{ user_id: string }>();
  return data?.user_id ?? null;
}

type CitaOcupada = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: "pendiente" | "confirmada";
};

/**
 * Usa una función RPC (security definer) porque las políticas RLS de
 * "citas" solo dejan ver a cada usuario sus propias citas: un cliente
 * nuevo no vería las citas que otros clientes ya tienen con el mismo
 * profesional, y el cálculo de huecos libres saldría mal.
 */
async function obtenerCitasOcupadas(
  supabase: Supabase,
  profesionalId: string,
  desde: string,
  hasta: string
) {
  const { data } = await supabase.rpc("citas_ocupacion_profesional", {
    p_profesional_id: profesionalId,
    p_desde: desde,
    p_hasta: hasta,
  });
  return (data ?? []) as CitaOcupada[];
}

/**
 * fechaFin (último parámetro, opcional): fin del rango de días del bloqueo
 * para citas externas de varios días. Sin esto, un bloqueo lunes->viernes
 * solo comprobaba solapes el lunes: cualquier choque en días posteriores
 * del propio rango pasaba desapercibido. Las citas reales (sin concepto de
 * fecha_fin) simplemente no lo pasan y se comprueban solo en "fecha", como
 * antes.
 */
async function haySolapeConConfirmadas(
  supabase: Supabase,
  profesionalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string | null,
  excluirCitaId?: string,
  fechaFin?: string | null
) {
  const ocupadas = await obtenerCitasOcupadas(supabase, profesionalId, fecha, fechaFin || fecha);
  const confirmadas = ocupadas.filter(
    (cita) => cita.estado === "confirmada" && cita.id !== excluirCitaId
  );

  const inicioMinutos = aMinutos(horaInicio);
  const finMinutos = finConFallback(horaInicio, horaFin);

  return confirmadas.some((cita) => {
    const citaInicio = aMinutos(cita.hora_inicio);
    const citaFin = finConFallback(cita.hora_inicio, cita.hora_fin);
    return seSuperponen(inicioMinutos, finMinutos, citaInicio, citaFin);
  });
}

const MENSAJE_CITA_CADUCADA = "Caducada: no se confirmó antes de la fecha";

/**
 * Cancela automáticamente las citas "pendiente" cuya fecha ya pasó, tanto si
 * las propuso el cliente como el profesional. RLS limita el update a las
 * citas donde el usuario de la sesión es cliente o profesional participante,
 * así que basta con filtrar por estado/fecha: cada carga de /dashboard/citas
 * caduca solo las propias del usuario que la visita.
 */
export async function caducarCitasPendientes(supabase: Supabase) {
  const hoy = fechaISO(new Date());

  await supabase
    .from("citas")
    .update({ estado: "cancelada", comentario: MENSAJE_CITA_CADUCADA })
    .eq("estado", "pendiente")
    .lt("fecha", hoy);
}

async function propioProfesionalId(supabase: Supabase, userId: string) {
  const { data } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export type HuecosDia = { fecha: string; horas: string[] };

const INTERVALO_MINUTOS = 30;
const DURACION_PROVISIONAL_MINUTOS = 60;

/**
 * Calcula los huecos disponibles del profesional para un mes concreto
 * (mes en base 1). Si no se indica mes/año, usa el mes actual.
 */
export async function obtenerHuecosDisponibles(
  profesionalId: string,
  anio?: number,
  mes?: number
): Promise<HuecosDia[]> {
  if (!profesionalId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  const { data: tramos } = await supabase
    .from("disponibilidad")
    .select("dia_semana, hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .returns<{ dia_semana: number; hora_inicio: string; hora_fin: string }[]>();

  const hoy = new Date();
  const anioObjetivo = anio ?? hoy.getFullYear();
  const mesObjetivo = mes ?? hoy.getMonth() + 1;
  const primerDiaMes = new Date(anioObjetivo, mesObjetivo - 1, 1);
  const diasEnMes = new Date(anioObjetivo, mesObjetivo, 0).getDate();

  const fechaInicio = fechaISO(primerDiaMes);
  const fechaFin = fechaISO(new Date(anioObjetivo, mesObjetivo - 1, diasEnMes));

  const ocupadas = await obtenerCitasOcupadas(supabase, profesionalId, fechaInicio, fechaFin);

  const ocupadasPorFecha = new Map<string, { inicio: number; fin: number }[]>();
  for (const cita of ocupadas) {
    const lista = ocupadasPorFecha.get(cita.fecha) ?? [];
    lista.push({
      inicio: aMinutos(cita.hora_inicio),
      fin: finConFallback(cita.hora_inicio, cita.hora_fin),
    });
    ocupadasPorFecha.set(cita.fecha, lista);
  }

  const { data: excepciones } = await supabase
    .from("excepciones_disponibilidad")
    .select("fecha, todo_el_dia, hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .gte("fecha", fechaInicio)
    .lte("fecha", fechaFin)
    .returns<
      { fecha: string; todo_el_dia: boolean; hora_inicio: string | null; hora_fin: string | null }[]
    >();

  const excepcionesPorFecha = new Map<
    string,
    { todoElDia: boolean; franjas: { inicio: number; fin: number }[] }
  >();
  for (const excepcion of excepciones ?? []) {
    const entrada = excepcionesPorFecha.get(excepcion.fecha) ?? { todoElDia: false, franjas: [] };
    if (excepcion.todo_el_dia) {
      entrada.todoElDia = true;
    } else if (excepcion.hora_inicio && excepcion.hora_fin) {
      entrada.franjas.push({
        inicio: aMinutos(excepcion.hora_inicio),
        fin: aMinutos(excepcion.hora_fin),
      });
    }
    excepcionesPorFecha.set(excepcion.fecha, entrada);
  }

  const dias: HuecosDia[] = [];

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaObj = new Date(anioObjetivo, mesObjetivo - 1, dia);
    const fecha = fechaISO(fechaObj);
    const excepcionDia = excepcionesPorFecha.get(fecha);

    if (excepcionDia?.todoElDia) {
      dias.push({ fecha, horas: [] });
      continue;
    }

    const diaSemana = fechaObj.getDay();
    const tramosDia = (tramos ?? []).filter((tramo) => tramo.dia_semana === diaSemana);
    const ocupadasDia = ocupadasPorFecha.get(fecha) ?? [];
    const franjasBloqueadas = excepcionDia?.franjas ?? [];

    const horas: string[] = [];
    for (const tramo of tramosDia) {
      const inicioTramo = aMinutos(tramo.hora_inicio);
      const finTramo = aMinutos(tramo.hora_fin);
      for (let minutos = inicioTramo; minutos < finTramo; minutos += INTERVALO_MINUTOS) {
        const finCandidato = minutos + DURACION_PROVISIONAL_MINUTOS;
        const seSolapa = ocupadasDia.some((ocupada) =>
          seSuperponen(minutos, finCandidato, ocupada.inicio, ocupada.fin)
        );
        const dentroDeExcepcion = franjasBloqueadas.some(
          (franja) => minutos >= franja.inicio && minutos < franja.fin
        );
        if (!seSolapa && !dentroDeExcepcion) {
          horas.push(aHoraTexto(minutos));
        }
      }
    }

    dias.push({ fecha, horas });
  }

  return dias;
}

/**
 * Valida disponibilidad y solapes, y crea una cita "pendiente" propuesta
 * por el cliente. Se usa tanto desde el formulario dedicado de reserva
 * como desde el mensaje combinado del flujo "Contactar".
 */
export async function crearCitaPendiente(
  supabase: Supabase,
  params: {
    solicitudId: string;
    profesionalId: string;
    clienteId: string;
    tipo: TipoCita;
    fecha: string;
    horaInicio: string;
  }
): Promise<{ error?: string }> {
  const { solicitudId, profesionalId, clienteId, tipo, fecha, horaInicio } = params;
  const inicioMinutos = aMinutos(horaInicio);

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay();

  const { data: tramos } = await supabase
    .from("disponibilidad")
    .select("hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .eq("dia_semana", diaSemana)
    .returns<{ hora_inicio: string; hora_fin: string }[]>();

  const dentroDeDisponibilidad = (tramos ?? []).some(
    (tramo) => inicioMinutos >= aMinutos(tramo.hora_inicio) && inicioMinutos < aMinutos(tramo.hora_fin)
  );

  if (!dentroDeDisponibilidad) {
    return { error: "El profesional no tiene disponibilidad declarada en ese horario." };
  }

  const seSolapa = await haySolapeConConfirmadas(supabase, profesionalId, fecha, horaInicio, null);

  if (seSolapa) {
    return { error: "El profesional ya tiene otra cita confirmada en ese horario." };
  }

  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select("localidad, calle")
    .eq("id", solicitudId)
    .maybeSingle<{ localidad: string | null; calle: string | null }>();

  const { data: citaCreada, error } = await supabase
    .from("citas")
    .insert({
      solicitud_id: solicitudId,
      profesional_id: profesionalId,
      cliente_id: clienteId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: null,
      tipo,
      estado: "pendiente",
      propuesto_por: "cliente",
      localidad: solicitud?.localidad ?? null,
      calle: solicitud?.calle ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return { error: error.message };
  }

  const profesionalUserId = await obtenerUserIdProfesional(supabase, profesionalId);
  if (profesionalUserId) {
    await crearNotificacion(
      profesionalUserId,
      "cita_propuesta",
      "Nueva cita propuesta",
      `${formatearFechaLarga(fecha)} · ${aHoraTexto(inicioMinutos)}`,
      `/dashboard?citaId=${citaCreada.id}`
    );
  }

  return {};
}

export async function aceptarCitaProfesional(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!horaFin) {
    return { error: "Indica la hora de fin." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, cliente_id, fecha, hora_inicio, tipo, estado")
    .eq("id", citaId)
    .maybeSingle<{
      id: string;
      profesional_id: string;
      cliente_id: string;
      fecha: string;
      hora_inicio: string;
      tipo: string;
      estado: string;
    }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (cita.estado !== "pendiente") {
    return { error: "Esta cita ya no está pendiente." };
  }
  if (aMinutos(horaFin) <= aMinutos(cita.hora_inicio)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }

  const seSolapa = await haySolapeConConfirmadas(
    supabase,
    profesionalId,
    cita.fecha,
    cita.hora_inicio,
    horaFin,
    cita.id
  );

  if (seSolapa) {
    return { error: "Ya tienes otra cita confirmada que se solapa con este horario." };
  }

  const { error } = await supabase
    .from("citas")
    .update({ hora_fin: horaFin, estado: "confirmada" })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  const emailCliente = await obtenerEmailUsuario(cita.cliente_id);
  const cuerpo = construirCuerpoCitaHtml({
    titulo: "Cita confirmada",
    mensaje: "El profesional ha confirmado tu cita.",
    fecha: cita.fecha,
    horaInicio: cita.hora_inicio,
    horaFin,
    tipo: cita.tipo,
  });
  await notificarCambioCita(emailCliente, "Cita confirmada", cuerpo);

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return undefined;
}

export async function proponerOtroHorario(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();
  const comentario = formData.get("comentario")?.toString().trim();

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!fecha) {
    return { error: "Indica una fecha." };
  }
  if (!horaInicio || !horaFin) {
    return { error: "Indica la hora de inicio y de fin." };
  }
  if (aMinutos(horaFin) <= aMinutos(horaInicio)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }
  if (!comentario) {
    return { error: "Explica el motivo del nuevo horario propuesto." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, cliente_id, tipo, estado")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; cliente_id: string; tipo: string; estado: string }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (cita.estado !== "pendiente") {
    return { error: "Esta cita ya no está pendiente." };
  }

  const seSolapa = await haySolapeConConfirmadas(
    supabase,
    profesionalId,
    fecha,
    horaInicio,
    horaFin,
    cita.id
  );

  if (seSolapa) {
    return { error: "Ya tienes otra cita confirmada que se solapa con ese horario." };
  }

  const { error } = await supabase
    .from("citas")
    .update({
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      comentario,
      propuesto_por: "profesional",
    })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  const emailCliente = await obtenerEmailUsuario(cita.cliente_id);
  const cuerpo = construirCuerpoCitaHtml({
    titulo: "Nuevo horario propuesto",
    mensaje: "El profesional ha propuesto un nuevo horario para tu cita.",
    fecha,
    horaInicio,
    horaFin,
    tipo: cita.tipo,
    motivo: comentario,
  });
  await notificarCambioCita(emailCliente, "Nuevo horario propuesto para tu cita", cuerpo);

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return undefined;
}

export async function anularCitaProfesional(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const comentario = formData.get("comentario")?.toString().trim();

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!comentario) {
    return { error: "Explica el motivo de la anulación." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, cliente_id, fecha, hora_inicio, hora_fin, tipo, estado")
    .eq("id", citaId)
    .maybeSingle<{
      id: string;
      profesional_id: string;
      cliente_id: string;
      fecha: string;
      hora_inicio: string;
      hora_fin: string | null;
      tipo: string;
      estado: string;
    }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (cita.estado !== "pendiente") {
    return { error: "Esta cita ya no está pendiente." };
  }

  const { error } = await supabase
    .from("citas")
    .update({ estado: "cancelada", comentario })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  const emailCliente = await obtenerEmailUsuario(cita.cliente_id);
  const cuerpo = construirCuerpoCitaHtml({
    titulo: "Cita cancelada",
    mensaje: "El profesional ha cancelado la cita.",
    fecha: cita.fecha,
    horaInicio: cita.hora_inicio,
    horaFin: cita.hora_fin,
    tipo: cita.tipo,
    motivo: comentario,
  });
  await notificarCambioCita(emailCliente, "Cita cancelada", cuerpo);

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return undefined;
}

export async function aceptarCitaCliente(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const citaId = formData.get("id")?.toString();
  if (!citaId) {
    return;
  }

  const { data: cita } = await supabase
    .from("citas")
    .update({ estado: "confirmada" })
    .eq("id", citaId)
    .eq("cliente_id", user.id)
    .eq("estado", "pendiente")
    .eq("propuesto_por", "profesional")
    .select("id, profesional_id, fecha, hora_inicio, hora_fin, tipo")
    .maybeSingle<{
      id: string;
      profesional_id: string;
      fecha: string;
      hora_inicio: string;
      hora_fin: string | null;
      tipo: string;
    }>();

  revalidatePath("/dashboard/citas");

  if (!cita) {
    return;
  }

  const profesionalUserId = await obtenerUserIdProfesional(supabase, cita.profesional_id);
  if (profesionalUserId) {
    const emailProfesional = await obtenerEmailUsuario(profesionalUserId);
    const cuerpo = construirCuerpoCitaHtml({
      titulo: "Cita confirmada",
      mensaje: "El cliente ha aceptado el nuevo horario y la cita queda confirmada.",
      fecha: cita.fecha,
      horaInicio: cita.hora_inicio,
      horaFin: cita.hora_fin,
      tipo: cita.tipo,
    });
    await notificarCambioCita(emailProfesional, "Cita confirmada", cuerpo);
    await crearNotificacion(
      profesionalUserId,
      "cita_confirmada",
      "Cita confirmada",
      `${formatearFechaLarga(cita.fecha)} · ${formatearHoraCorta(cita.hora_inicio)}`,
      `/dashboard?citaId=${cita.id}`
    );
  }
}

export async function anularCitaCliente(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const comentario = formData.get("comentario")?.toString().trim() || null;

  if (!citaId) {
    return { error: "Cita inválida." };
  }

  const { data: cita, error } = await supabase
    .from("citas")
    .update({ estado: "cancelada", comentario })
    .eq("id", citaId)
    .eq("cliente_id", user.id)
    .eq("estado", "pendiente")
    .select("id, profesional_id, fecha, hora_inicio, hora_fin, tipo")
    .maybeSingle<{
      id: string;
      profesional_id: string;
      fecha: string;
      hora_inicio: string;
      hora_fin: string | null;
      tipo: string;
    }>();

  if (error) {
    return { error: error.message };
  }

  if (cita) {
    const profesionalUserId = await obtenerUserIdProfesional(supabase, cita.profesional_id);
    if (profesionalUserId) {
      const emailProfesional = await obtenerEmailUsuario(profesionalUserId);
      const cuerpo = construirCuerpoCitaHtml({
        titulo: "Cita cancelada",
        mensaje: "El cliente ha cancelado la cita.",
        fecha: cita.fecha,
        horaInicio: cita.hora_inicio,
        horaFin: cita.hora_fin,
        tipo: cita.tipo,
        motivo: comentario,
      });
      await notificarCambioCita(emailProfesional, "Cita cancelada", cuerpo);
      await crearNotificacion(
        profesionalUserId,
        "cita_cancelada",
        "Cita cancelada",
        comentario ?? `${formatearFechaLarga(cita.fecha)} · ${formatearHoraCorta(cita.hora_inicio)}`,
        `/dashboard?citaId=${cita.id}`
      );
    }
  }

  revalidatePath("/dashboard/citas");
  return undefined;
}

export type CitaCalendario = {
  id: string;
  // NULL solo en citas externas "pendientes de agendar" (sin hueco todavía).
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  tipo: TipoCita | null;
  estado: EstadoCita;
  propuesto_por: PropuestoPor;
  comentario: string | null;
  cliente_id: string | null;
  origen_externo: boolean;
  titulo_externo: string | null;
  // En citas reales viene copiada de la solicitud al crear la cita; en
  // citas externas se edita libremente.
  localidad: string | null;
  calle: string | null;
  // Solo aplica a citas externas: código hex opcional para el fondo del
  // bloque en el calendario. NULL = gris fijo por defecto.
  color: string | null;
  // Solo aplica a citas externas: fin del rango de días del bloqueo. NULL =
  // un solo día (el de "fecha").
  fecha_fin: string | null;
  // Solo aplica a citas externas: datos de contacto opcionales del bloqueo.
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  // Solo se rellenan para estado="confirmada" && !origen_externo, reutilizando
  // la misma revelación de contacto que ya usa /dashboard/citas.
  telefonoCliente: string | null;
  nombreCliente: string | null;
};

/**
 * Citas propias del profesional autenticado en un rango de fechas, para el
 * calendario de /dashboard. A diferencia de obtenerCitasOcupadas (que usa la
 * RPC para ocultar datos de otros clientes), el profesional ya tiene acceso
 * RLS completo a sus propias filas, así que se consulta "citas" directamente.
 * Las canceladas quedan fuera: no se muestran en el calendario (ya tienen su
 * propio listado en /dashboard/citas).
 */
export async function obtenerCitasCalendario(desde: string, hasta: string): Promise<CitaCalendario[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return [];
  }

  // Una cita externa de varios días ocupa [fecha, fecha_fin]; para que siga
  // apareciendo en semanas/meses posteriores al de su fecha de inicio, hay
  // que traer cualquier cita cuyo rango se solape con [desde, hasta], no
  // solo las que empiezan dentro de esa ventana (fecha_fin es NULL en las
  // citas de un solo día, que se comparan por su propia "fecha").
  const { data } = await supabase
    .from("citas")
    .select(
      "id, fecha, hora_inicio, hora_fin, tipo, estado, propuesto_por, comentario, cliente_id, origen_externo, titulo_externo, localidad, calle, color, fecha_fin, contacto_nombre, contacto_telefono"
    )
    .eq("profesional_id", profesionalId)
    .neq("estado", "cancelada")
    .lte("fecha", hasta)
    .or(`fecha_fin.gte.${desde},and(fecha_fin.is.null,fecha.gte.${desde})`)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .returns<Omit<CitaCalendario, "telefonoCliente" | "nombreCliente">[]>();

  const citas = data ?? [];

  const contactosPorCliente = new Map<string, { telefono: string | null; nombre: string | null }>();
  for (const cita of citas) {
    if (cita.estado === "confirmada" && !cita.origen_externo && cita.cliente_id) {
      if (!contactosPorCliente.has(cita.cliente_id)) {
        const contacto = await obtenerContactoTelefonicoUsuario(cita.cliente_id);
        contactosPorCliente.set(cita.cliente_id, { telefono: contacto.telefono, nombre: contacto.nombre });
      }
    }
  }

  return citas.map((cita) => ({
    ...cita,
    telefonoCliente: (cita.cliente_id && contactosPorCliente.get(cita.cliente_id)?.telefono) ?? null,
    nombreCliente: (cita.cliente_id && contactosPorCliente.get(cita.cliente_id)?.nombre) ?? null,
  }));
}

/**
 * Citas externas del profesional sin fecha asignada todavía ("pendientes de
 * agendar"), para el panel lateral de /dashboard. No se pueden obtener con
 * obtenerCitasCalendario porque ese filtra por rango de fechas y estas no
 * tienen ninguna.
 */
export async function obtenerCitasExternasPendientes(): Promise<CitaCalendario[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return [];
  }

  const { data } = await supabase
    .from("citas")
    .select(
      "id, fecha, hora_inicio, hora_fin, tipo, estado, propuesto_por, comentario, cliente_id, origen_externo, titulo_externo, localidad, calle, color, fecha_fin, contacto_nombre, contacto_telefono"
    )
    .eq("profesional_id", profesionalId)
    .eq("origen_externo", true)
    .is("fecha", null)
    .neq("estado", "cancelada")
    .order("creado_en", { ascending: true })
    .returns<Omit<CitaCalendario, "telefonoCliente" | "nombreCliente">[]>();

  return (data ?? []).map((cita) => ({ ...cita, telefonoCliente: null, nombreCliente: null }));
}

/**
 * Una cita concreta del profesional autenticado, sin el filtro "no
 * cancelada" de obtenerCitasCalendario: la usa el enlace de las
 * notificaciones (?citaId=...) para poder abrir el modal de detalle aunque
 * la cita ya no aparezca en la vista normal del calendario (p.ej. si se
 * canceló entre que se generó la notificación y se pulsó).
 */
export async function obtenerCitaPorId(citaId: string): Promise<CitaCalendario | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return null;
  }

  const { data: cita } = await supabase
    .from("citas")
    .select(
      "id, fecha, hora_inicio, hora_fin, tipo, estado, propuesto_por, comentario, cliente_id, origen_externo, titulo_externo, localidad, calle, color, fecha_fin, contacto_nombre, contacto_telefono"
    )
    .eq("id", citaId)
    .eq("profesional_id", profesionalId)
    .maybeSingle<Omit<CitaCalendario, "telefonoCliente" | "nombreCliente">>();

  if (!cita) {
    return null;
  }

  let telefonoCliente: string | null = null;
  let nombreCliente: string | null = null;
  if (cita.estado === "confirmada" && !cita.origen_externo && cita.cliente_id) {
    const contacto = await obtenerContactoTelefonicoUsuario(cita.cliente_id);
    telefonoCliente = contacto.telefono;
    nombreCliente = contacto.nombre;
  }

  return { ...cita, telefonoCliente, nombreCliente };
}

/**
 * Crea un bloqueo manual del profesional en su propio calendario (p.ej.
 * "Comida", "Cita personal"). No pasa por negociación: se inserta ya
 * "confirmada" y sin cliente/solicitud asociados. Si se dejan fecha/horas en
 * blanco, se guarda como "pendiente de agendar" (aparece en el panel lateral
 * en vez de en el calendario) hasta que se arrastre a un hueco.
 */
/**
 * Las citas externas admiten fecha/horas completas (agendada) o las tres en
 * blanco (pendiente de agendar); cualquier combinación mixta es un error.
 * Lo comparten crearCitaExterna y editarCitaExterna.
 */
function estadoFechaHoraCitaExterna(
  fecha: string | null,
  horaInicio: string | null,
  horaFin: string | null
): "vacio" | "completo" | "mixto" {
  const todosVacios = !fecha && !horaInicio && !horaFin;
  const todosCompletos = Boolean(fecha && horaInicio && horaFin);
  if (todosVacios) return "vacio";
  if (todosCompletos) return "completo";
  return "mixto";
}

export async function crearCitaExterna(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const fecha = formData.get("fecha")?.toString() || null;
  const horaInicio = formData.get("hora_inicio")?.toString() || null;
  const horaFin = formData.get("hora_fin")?.toString() || null;
  const fechaFin = formData.get("fecha_fin")?.toString() || null;
  const titulo = formData.get("titulo")?.toString().trim();
  const localidad = formData.get("localidad")?.toString().trim() || null;
  const calle = formData.get("calle")?.toString().trim() || null;
  const contactoNombre = formData.get("contacto_nombre")?.toString().trim() || null;
  const contactoTelefono = formData.get("contacto_telefono")?.toString().trim() || null;

  if (!titulo) {
    return { error: "Indica un título para la cita." };
  }

  const estadoFechaHora = estadoFechaHoraCitaExterna(fecha, horaInicio, horaFin);
  if (estadoFechaHora === "mixto") {
    return {
      error:
        "Indica fecha y horas completas, o déjalas todas vacías para guardarla como pendiente de agendar.",
    };
  }
  if (estadoFechaHora === "completo" && fechaFin && fechaFin < fecha!) {
    return { error: "La fecha de fin no puede ser anterior a la fecha de inicio." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  if (estadoFechaHora === "vacio") {
    const { error } = await supabase.from("citas").insert({
      profesional_id: profesionalId,
      cliente_id: null,
      solicitud_id: null,
      tipo: null,
      fecha: null,
      hora_inicio: null,
      hora_fin: null,
      fecha_fin: null,
      estado: "pendiente",
      origen_externo: true,
      titulo_externo: titulo,
      localidad,
      calle,
      contacto_nombre: contactoNombre,
      contacto_telefono: contactoTelefono,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard");
    return undefined;
  }

  if (aMinutos(horaFin!) <= aMinutos(horaInicio!)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }

  // Un bloqueo de varios días (fecha_fin) debe comprobarse en todo su rango,
  // no solo en "fecha": si no, un choque en un día posterior del propio
  // rango pasaba desapercibido.
  const fechaFinEfectiva = fechaFin && fechaFin > fecha! ? fechaFin : null;

  // El solapamiento ya no bloquea la creación: se avisa (solape: true) para
  // que el formulario muestre una confirmación, y solo se salta esta
  // comprobación si el profesional ya confirmó que quiere seguir adelante.
  const permitirSolape = formData.get("permitir_solape") === "1";
  if (!permitirSolape) {
    const seSolapa = await haySolapeConConfirmadas(
      supabase,
      profesionalId,
      fecha!,
      horaInicio!,
      horaFin!,
      undefined,
      fechaFinEfectiva
    );
    if (seSolapa) {
      return {
        error: "Ya tienes otra cita confirmada que se solapa con ese horario.",
        solape: true,
      };
    }
  }

  const { error } = await supabase.from("citas").insert({
    profesional_id: profesionalId,
    cliente_id: null,
    solicitud_id: null,
    tipo: null,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    fecha_fin: fechaFinEfectiva,
    estado: "confirmada",
    origen_externo: true,
    titulo_externo: titulo,
    localidad,
    calle,
    contacto_nombre: contactoNombre,
    contacto_telefono: contactoTelefono,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Edita un bloqueo externo propio: título, fecha/horas (con la misma regla
 * "todo o nada" que crearCitaExterna — vaciarlas lo devuelve al panel de
 * pendientes) y localidad/calle.
 */
export async function editarCitaExterna(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const fecha = formData.get("fecha")?.toString() || null;
  const horaInicio = formData.get("hora_inicio")?.toString() || null;
  const horaFin = formData.get("hora_fin")?.toString() || null;
  const fechaFin = formData.get("fecha_fin")?.toString() || null;
  const titulo = formData.get("titulo")?.toString().trim();
  const localidad = formData.get("localidad")?.toString().trim() || null;
  const calle = formData.get("calle")?.toString().trim() || null;
  const contactoNombre = formData.get("contacto_nombre")?.toString().trim() || null;
  const contactoTelefono = formData.get("contacto_telefono")?.toString().trim() || null;
  // Solo se toca si el formulario lo incluye explícitamente: el formulario de
  // edición completo (CitaExternaCampos) no manda este campo y no debe borrar
  // el color al guardar título/fecha/ubicación; el selector de color del modal
  // de detalle sí lo manda siempre (con "" para volver a "sin color").
  const colorProvisto = formData.has("color");
  const color = formData.get("color")?.toString().trim() || null;

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!titulo) {
    return { error: "Indica un título para la cita." };
  }

  const estadoFechaHora = estadoFechaHoraCitaExterna(fecha, horaInicio, horaFin);
  if (estadoFechaHora === "mixto") {
    return {
      error:
        "Indica fecha y horas completas, o déjalas todas vacías para guardarla como pendiente de agendar.",
    };
  }
  if (estadoFechaHora === "completo" && fechaFin && fechaFin < fecha!) {
    return { error: "La fecha de fin no puede ser anterior a la fecha de inicio." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, origen_externo")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; origen_externo: boolean }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (!cita.origen_externo) {
    return { error: "Esta cita no es un bloqueo externo." };
  }

  if (estadoFechaHora === "vacio") {
    const { error } = await supabase
      .from("citas")
      .update({
        titulo_externo: titulo,
        fecha: null,
        hora_inicio: null,
        hora_fin: null,
        fecha_fin: null,
        estado: "pendiente",
        localidad,
        calle,
        contacto_nombre: contactoNombre,
        contacto_telefono: contactoTelefono,
        ...(colorProvisto ? { color } : {}),
      })
      .eq("id", citaId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard");
    return undefined;
  }

  if (aMinutos(horaFin!) <= aMinutos(horaInicio!)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }

  const fechaFinEfectiva = fechaFin && fechaFin > fecha! ? fechaFin : null;

  const seSolapa = await haySolapeConConfirmadas(
    supabase,
    profesionalId,
    fecha!,
    horaInicio!,
    horaFin!,
    citaId,
    fechaFinEfectiva
  );
  if (seSolapa) {
    return { error: "Ya tienes otra cita confirmada que se solapa con ese horario." };
  }

  const { error } = await supabase
    .from("citas")
    .update({
      titulo_externo: titulo,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      fecha_fin: fechaFinEfectiva,
      estado: "confirmada",
      localidad,
      calle,
      contacto_nombre: contactoNombre,
      contacto_telefono: contactoTelefono,
      ...(colorProvisto ? { color } : {}),
    })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Mueve (o agenda por primera vez) un bloqueo externo propio a una nueva
 * fecha/hora, típicamente desde el arrastre en la vista semanal. Si venía
 * sin fecha ("pendiente de agendar"), al recibir una queda "confirmada" y
 * desaparece del panel de pendientes.
 */
export async function moverCitaExterna(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();
  // Solo la envía el arrastre de un bloqueo de varios días, para desplazar
  // fecha_fin el mismo número de días que fecha y conservar la duración del
  // rango; el resto de llamadas (redimensionar horas, agendar desde el panel
  // de pendientes) no la mandan y fecha_fin se queda como estaba.
  const fechaFinProvista = formData.has("fecha_fin");
  const fechaFin = formData.get("fecha_fin")?.toString() || null;

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!fecha || !horaInicio || !horaFin) {
    return { error: "Indica fecha, hora de inicio y hora de fin." };
  }
  if (aMinutos(horaFin) <= aMinutos(horaInicio)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, origen_externo")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; origen_externo: boolean }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (!cita.origen_externo) {
    return { error: "Esta cita no es un bloqueo externo." };
  }

  const seSolapa = await haySolapeConConfirmadas(
    supabase,
    profesionalId,
    fecha,
    horaInicio,
    horaFin,
    cita.id,
    fechaFin
  );
  if (seSolapa) {
    return { error: "Ya tienes otra cita confirmada que se solapa con ese horario." };
  }

  const { error } = await supabase
    .from("citas")
    .update({
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: "confirmada",
      ...(fechaFinProvista ? { fecha_fin: fechaFin } : {}),
    })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Reprograma una cita ya confirmada (típicamente arrastrándola a otro
 * hueco): vuelve a "pendiente" propuesta por el profesional, igual que
 * proponerOtroHorario, hasta que el cliente la acepte. No se usa para
 * bloqueos externos (esos van por moverCitaExterna).
 */
export async function proponerCambioCitaConfirmada(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();

  if (!citaId) {
    return { error: "Cita inválida." };
  }
  if (!fecha || !horaInicio || !horaFin) {
    return { error: "Indica fecha, hora de inicio y hora de fin." };
  }
  if (aMinutos(horaFin) <= aMinutos(horaInicio)) {
    return { error: "La hora de fin debe ser posterior a la hora de inicio." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, cliente_id, tipo, estado, origen_externo")
    .eq("id", citaId)
    .maybeSingle<{
      id: string;
      profesional_id: string;
      cliente_id: string;
      tipo: string;
      estado: string;
      origen_externo: boolean;
    }>();

  if (!cita || cita.profesional_id !== profesionalId || cita.origen_externo) {
    return { error: "No autorizado." };
  }
  if (cita.estado !== "confirmada") {
    return { error: "Esta cita no está confirmada." };
  }

  const seSolapa = await haySolapeConConfirmadas(
    supabase,
    profesionalId,
    fecha,
    horaInicio,
    horaFin,
    cita.id
  );
  if (seSolapa) {
    return { error: "Ya tienes otra cita confirmada que se solapa con ese horario." };
  }

  const comentario = "El profesional propone un nuevo horario para esta cita ya confirmada.";

  const { error } = await supabase
    .from("citas")
    .update({
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: "pendiente",
      propuesto_por: "profesional",
      comentario,
    })
    .eq("id", citaId);

  if (error) {
    return { error: error.message };
  }

  const emailCliente = await obtenerEmailUsuario(cita.cliente_id);
  const cuerpo = construirCuerpoCitaHtml({
    titulo: "Nuevo horario propuesto",
    mensaje: "El profesional ha propuesto un nuevo horario para tu cita ya confirmada.",
    fecha,
    horaInicio,
    horaFin,
    tipo: cita.tipo,
    motivo: comentario,
  });
  await notificarCambioCita(emailCliente, "Nuevo horario propuesto para tu cita", cuerpo);

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Cancela un bloqueo externo propio. Deliberadamente NO sirve para cancelar
 * citas confirmadas normales cliente-profesional: ese flujo no existe hoy
 * (anularCitaProfesional/anularCitaCliente solo actúan sobre "pendiente") y
 * añadirlo es una decisión de producto fuera del alcance de esta feature.
 */
export async function cancelarCitaExterna(
  _prevState: CitaAccionFormState,
  formData: FormData
): Promise<CitaAccionFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const citaId = formData.get("id")?.toString();
  if (!citaId) {
    return { error: "Cita inválida." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const { data: cita } = await supabase
    .from("citas")
    .select("id, profesional_id, origen_externo, estado")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; origen_externo: boolean; estado: string }>();

  if (!cita || cita.profesional_id !== profesionalId) {
    return { error: "No autorizado." };
  }
  if (!cita.origen_externo) {
    return { error: "Esta cita no es un bloqueo externo." };
  }
  if (cita.estado === "cancelada") {
    return undefined;
  }

  const { error } = await supabase.from("citas").update({ estado: "cancelada" }).eq("id", citaId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}
