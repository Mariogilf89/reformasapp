"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isTipoCita, type TipoCita } from "@/lib/citas";

export type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type ReservaCitaFormState = { error?: string; success?: boolean } | undefined;
export type CitaAccionFormState = { error?: string } | undefined;

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

async function haySolapeConConfirmadas(
  supabase: Supabase,
  profesionalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string | null,
  excluirCitaId?: string
) {
  const ocupadas = await obtenerCitasOcupadas(supabase, profesionalId, fecha, fecha);
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

async function propioProfesionalId(supabase: Supabase, userId: string) {
  const { data } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export type HuecosDia = { fecha: string; horas: string[] };

const DIAS_A_CALCULAR = 14;
const INTERVALO_MINUTOS = 30;
const DURACION_PROVISIONAL_MINUTOS = 60;

export async function obtenerHuecosDisponibles(profesionalId: string): Promise<HuecosDia[]> {
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
  const fechaInicio = fechaISO(hoy);
  const fechaFin = fechaISO(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + DIAS_A_CALCULAR - 1)
  );

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

  for (let i = 0; i < DIAS_A_CALCULAR; i++) {
    const fechaObj = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
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

  const { error } = await supabase.from("citas").insert({
    solicitud_id: solicitudId,
    profesional_id: profesionalId,
    cliente_id: clienteId,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: null,
    tipo,
    estado: "pendiente",
    propuesto_por: "cliente",
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function reservarCita(
  _prevState: ReservaCitaFormState,
  formData: FormData
): Promise<ReservaCitaFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const solicitudId = formData.get("solicitud_id")?.toString();
  const profesionalId = formData.get("profesional_id")?.toString();
  const tipo = formData.get("tipo")?.toString() ?? "";
  const fecha = formData.get("fecha")?.toString();
  const horaInicio = formData.get("hora_inicio")?.toString();

  if (!solicitudId || !profesionalId) {
    return { error: "Selecciona un profesional." };
  }
  if (!isTipoCita(tipo)) {
    return { error: "Selecciona un tipo de cita válido." };
  }
  if (!fecha) {
    return { error: "Indica una fecha." };
  }
  if (!horaInicio) {
    return { error: "Indica la hora de inicio." };
  }

  const resultado = await crearCitaPendiente(supabase, {
    solicitudId,
    profesionalId,
    clienteId: user.id,
    tipo,
    fecha,
    horaInicio,
  });

  if (resultado.error) {
    return { error: resultado.error };
  }

  revalidatePath(`/dashboard/solicitudes/${solicitudId}`);
  revalidatePath("/dashboard/citas");
  return { success: true };
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
    .select("id, profesional_id, fecha, hora_inicio, estado")
    .eq("id", citaId)
    .maybeSingle<{
      id: string;
      profesional_id: string;
      fecha: string;
      hora_inicio: string;
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

  revalidatePath("/dashboard/citas");
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
    .select("id, profesional_id, estado")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; estado: string }>();

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

  revalidatePath("/dashboard/citas");
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
    .select("id, profesional_id, estado")
    .eq("id", citaId)
    .maybeSingle<{ id: string; profesional_id: string; estado: string }>();

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

  revalidatePath("/dashboard/citas");
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

  await supabase
    .from("citas")
    .update({ estado: "confirmada" })
    .eq("id", citaId)
    .eq("cliente_id", user.id)
    .eq("estado", "pendiente")
    .eq("propuesto_por", "profesional");

  revalidatePath("/dashboard/citas");
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

  const { error } = await supabase
    .from("citas")
    .update({ estado: "cancelada", comentario })
    .eq("id", citaId)
    .eq("cliente_id", user.id)
    .eq("estado", "pendiente");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/citas");
  return undefined;
}
