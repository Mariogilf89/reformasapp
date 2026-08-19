"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";

export type DisponibilidadFormState = { error?: string } | undefined;

export async function crearTramoDisponibilidad(
  _prevState: DisponibilidadFormState,
  formData: FormData
): Promise<DisponibilidadFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const diaSemana = Number(formData.get("dia_semana"));
  const horaInicio = formData.get("hora_inicio")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();

  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    return { error: "Selecciona un día válido." };
  }
  if (!horaInicio || !horaFin) {
    return { error: "Indica la hora de inicio y de fin." };
  }
  if (horaFin <= horaInicio) {
    return { error: "La hora de fin debe ser posterior a la de inicio." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return { error: "Completa tu perfil antes de añadir disponibilidad." };
  }

  const { error } = await supabase.from("disponibilidad").insert({
    profesional_id: perfil.id,
    dia_semana: diaSemana,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return undefined;
}

export async function borrarTramoDisponibilidad(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return;
  }

  await supabase.from("disponibilidad").delete().eq("id", id);

  revalidatePath("/dashboard/perfil");
}

const DIAS_EXCEPCION_MAXIMO = 60;

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function crearExcepcionDisponibilidad(
  _prevState: DisponibilidadFormState,
  formData: FormData
): Promise<DisponibilidadFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const fecha = formData.get("fecha")?.toString();
  const todoElDia = formData.get("todo_el_dia")?.toString() !== "false";
  const horaInicio = formData.get("hora_inicio")?.toString();
  const horaFin = formData.get("hora_fin")?.toString();

  if (!fecha) {
    return { error: "Selecciona una fecha." };
  }

  const hoy = new Date();
  const fechaMinima = fechaISO(hoy);
  const fechaMaxima = fechaISO(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + DIAS_EXCEPCION_MAXIMO)
  );

  if (fecha < fechaMinima || fecha > fechaMaxima) {
    return { error: "Selecciona una fecha dentro de los próximos 60 días." };
  }

  if (!todoElDia) {
    if (!horaInicio || !horaFin) {
      return { error: "Indica la hora de inicio y de fin de la franja." };
    }
    if (horaFin <= horaInicio) {
      return { error: "La hora de fin debe ser posterior a la de inicio." };
    }
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return { error: "Completa tu perfil antes de añadir excepciones." };
  }

  const { error } = await supabase.from("excepciones_disponibilidad").insert({
    profesional_id: perfil.id,
    fecha,
    todo_el_dia: todoElDia,
    hora_inicio: todoElDia ? null : horaInicio,
    hora_fin: todoElDia ? null : horaFin,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return undefined;
}

export async function borrarExcepcionDisponibilidad(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return;
  }

  await supabase.from("excepciones_disponibilidad").delete().eq("id", id);

  revalidatePath("/dashboard/perfil");
}
