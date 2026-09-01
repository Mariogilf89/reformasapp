"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  DOCUMENTOS_IDENTIDAD_BUCKET,
  FOTOS_BUCKET,
  extraerRutaStorage,
  isCategoria,
  type Categoria,
} from "@/lib/profesionales";
import { isProvincia, type Provincia } from "@/lib/provincias";
import { obtenerHuecosDisponibles, type HuecosDia } from "@/app/actions/citas";
import { fechaISO } from "@/lib/fechas";

export type PerfilFormState = { error?: string; success?: boolean } | undefined;

export async function guardarPerfilProfesional(
  _prevState: PerfilFormState,
  formData: FormData
): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const categorias = formData.getAll("categorias").map(String).filter(isCategoria);
  const provincias = formData.getAll("provincias").map(String).filter(isProvincia);
  const descripcion = formData.get("descripcion")?.toString().trim();
  const nombreForm = formData.get("nombre")?.toString().trim();
  const apellidos = formData.get("apellidos")?.toString().trim() ?? "";
  const fechaNacimiento = formData.get("fecha_nacimiento")?.toString().trim() || null;

  if (categorias.length === 0) {
    return { error: "Selecciona al menos una categoría." };
  }
  if (!descripcion) {
    return { error: "Añade una descripción." };
  }
  if (fechaNacimiento && (Number.isNaN(Date.parse(fechaNacimiento)) || fechaNacimiento > fechaISO(new Date()))) {
    return { error: "Indica una fecha de nacimiento válida." };
  }

  const nombre = nombreForm || user.user_metadata?.full_name || user.email || "Profesional";

  const { error } = await supabase.from("profesionales").upsert(
    {
      user_id: user.id,
      nombre,
      categorias,
      provincias,
      descripcion,
      apellidos,
      fecha_nacimiento: fechaNacimiento,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

export type RangoHorarioFormState = { error?: string } | undefined;

/**
 * Guarda el rango horario que usa el calendario de /dashboard. Se llama
 * directamente (no via useActionState/<form>) desde los <select> de
 * calendario-citas.tsx.
 */
export async function actualizarRangoHorarioCalendario(
  horaInicio: number,
  horaFin: number
): Promise<RangoHorarioFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  if (!Number.isInteger(horaInicio) || !Number.isInteger(horaFin)) {
    return { error: "Rango horario inválido." };
  }
  if (horaInicio < 0 || horaInicio > 23 || horaFin < 1 || horaFin > 24 || horaFin <= horaInicio) {
    return { error: "La hora de fin debe ser posterior a la de inicio." };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ calendario_hora_inicio: horaInicio, calendario_hora_fin: horaFin })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Guarda el rango de días visibles del calendario (numeración ISO: 1=lunes
 * ... 7=domingo). Misma forma de uso que actualizarRangoHorarioCalendario,
 * llamada directamente desde los <select> de "Qué días ver" en
 * calendario-citas.tsx.
 */
export async function actualizarRangoDiasCalendario(
  diaInicio: number,
  diaFin: number
): Promise<RangoHorarioFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  if (!Number.isInteger(diaInicio) || !Number.isInteger(diaFin)) {
    return { error: "Rango de días inválido." };
  }
  if (diaInicio < 1 || diaInicio > 7 || diaFin < 1 || diaFin > 7 || diaFin < diaInicio) {
    return { error: "El día de fin debe ser igual o posterior al de inicio." };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ calendario_dia_inicio: diaInicio, calendario_dia_fin: diaFin })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return undefined;
}

// El perfil solo tiene una foto (la principal, usada como avatar en toda la
// plataforma: menú del dashboard, listado público...), así que guardarla
// sustituye el array `fotos` entero en vez de añadir a una galería, y borra
// del storage la foto anterior si había una.
export async function guardarFotoPrincipalProfesional(url: string): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  if (!extraerRutaStorage(url, user.id)) {
    return { error: "Foto no válida." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, fotos")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; fotos: string[] }>();

  if (!perfil) {
    return { error: "Completa tu perfil antes de añadir una foto." };
  }

  const anterior = perfil.fotos?.[0] ?? null;

  const { error } = await supabase
    .from("profesionales")
    .update({ fotos: [url] })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  if (anterior && anterior !== url) {
    const rutaAnterior = extraerRutaStorage(anterior, user.id);
    if (rutaAnterior) {
      await supabase.storage.from(FOTOS_BUCKET).remove([rutaAnterior]);
    }
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export type ModoBusquedaDisponibilidad = "indiferente" | "lo_antes_posible" | "dia_hora";

export type ProfesionalBusqueda = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  zona: string;
  descripcion: string;
  fotos: string[];
  verificado: boolean;
  primerHueco: { fecha: string; hora: string } | null;
};

const MESES_BUSQUEDA_LO_ANTES_POSIBLE = 3;

// Misma rejilla de 30 minutos que usa obtenerHuecosDisponibles (app/actions/citas.ts)
// para generar dia.horas.
const INTERVALO_MINUTOS_HUECOS = 30;

function minutosDesdeHoraCorta(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Horas de un día de obtenerHuecosDisponibles que aún no han pasado. */
function horasFuturas(dia: HuecosDia, hoyISO: string, ahoraMinutos: number): string[] {
  if (dia.fecha < hoyISO) return [];
  if (dia.fecha > hoyISO) return dia.horas;
  return dia.horas.filter((hora) => minutosDesdeHoraCorta(hora) > ahoraMinutos);
}

/**
 * ¿Está el profesional libre durante todo el rango [horaInicio, horaFin)?
 * Comprueba, igual que se hacía para un único instante, que cada franja de
 * 30 minutos de la rejilla de huecos que solapa con el rango solicitado
 * está presente entre las horas libres del día.
 */
function libreEnRango(horasLibres: string[], horaInicio: string, horaFin: string): boolean {
  const inicioMinutos = minutosDesdeHoraCorta(horaInicio);
  const finMinutos = minutosDesdeHoraCorta(horaFin);
  if (finMinutos <= inicioMinutos) return false;

  const disponibles = new Set(horasLibres.map(minutosDesdeHoraCorta));
  const inicioRejilla = Math.floor(inicioMinutos / INTERVALO_MINUTOS_HUECOS) * INTERVALO_MINUTOS_HUECOS;
  for (let minutos = inicioRejilla; minutos < finMinutos; minutos += INTERVALO_MINUTOS_HUECOS) {
    if (!disponibles.has(minutos)) return false;
  }
  return true;
}

/**
 * Busca profesionales por categoría/provincia y, según el modo, por
 * disponibilidad real. Reutiliza obtenerHuecosDisponibles (app/actions/citas.ts)
 * como única fuente de verdad de disponibilidad: no se reimplementa el
 * cruce de disponibilidad/excepciones/citas ocupadas.
 */
export async function obtenerProfesionalesDisponibles(params: {
  categoria?: Categoria;
  provincia?: Provincia;
  modo: ModoBusquedaDisponibilidad;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
}): Promise<ProfesionalBusqueda[]> {
  const { categoria, provincia, modo, fecha, horaInicio, horaFin } = params;

  if (modo === "dia_hora" && (!fecha || !horaInicio || !horaFin)) {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("profesionales_publico")
    .select("id, nombre, categorias, zona, descripcion, fotos, verificado")
    .order("creado_en", { ascending: false });

  if (categoria) {
    query = query.contains("categorias", [categoria]);
  }
  if (provincia) {
    query = query.contains("provincias", [provincia]);
  }

  const { data, error } = await query.returns<Omit<ProfesionalBusqueda, "primerHueco">[]>();
  if (error) {
    console.error("obtenerProfesionalesDisponibles: error al buscar profesionales", error);
  }
  const candidatos = data ?? [];

  if (modo === "indiferente") {
    return candidatos.map((candidato) => ({ ...candidato, primerHueco: null }));
  }

  const hoy = new Date();
  const hoyISO = fechaISO(hoy);
  const ahoraMinutos = hoy.getHours() * 60 + hoy.getMinutes();

  if (modo === "dia_hora") {
    if (fecha! < hoyISO) {
      return [];
    }
    const [anio, mes] = fecha!.split("-").map(Number);

    const resultados = await Promise.all(
      candidatos.map(async (candidato): Promise<ProfesionalBusqueda | null> => {
        const dias = await obtenerHuecosDisponibles(candidato.id, anio, mes);
        const dia = dias.find((d) => d.fecha === fecha);
        const libre = Boolean(
          dia && libreEnRango(horasFuturas(dia, hoyISO, ahoraMinutos), horaInicio!, horaFin!)
        );
        return libre
          ? { ...candidato, primerHueco: { fecha: fecha!, hora: horaInicio! } }
          : null;
      })
    );

    return resultados.filter((r): r is ProfesionalBusqueda => r !== null);
  }

  // modo === "lo_antes_posible"
  const resultados = await Promise.all(
    candidatos.map(async (candidato): Promise<ProfesionalBusqueda | null> => {
      let anio = hoy.getFullYear();
      let mes = hoy.getMonth() + 1;

      for (let intento = 0; intento < MESES_BUSQUEDA_LO_ANTES_POSIBLE; intento++) {
        const dias = await obtenerHuecosDisponibles(candidato.id, anio, mes);

        for (const dia of dias) {
          const horas = horasFuturas(dia, hoyISO, ahoraMinutos);
          if (horas.length > 0) {
            return { ...candidato, primerHueco: { fecha: dia.fecha, hora: horas[0] } };
          }
        }

        mes += 1;
        if (mes > 12) {
          mes = 1;
          anio += 1;
        }
      }

      return null;
    })
  );

  return resultados
    .filter((r): r is ProfesionalBusqueda => r !== null)
    .sort((a, b) => {
      const claveA = `${a.primerHueco!.fecha} ${a.primerHueco!.hora}`;
      const claveB = `${b.primerHueco!.fecha} ${b.primerHueco!.hora}`;
      return claveA < claveB ? -1 : claveA > claveB ? 1 : 0;
    });
}

export async function subirDocumentoIdentidad(ruta: string): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  if (!ruta.startsWith(`${user.id}/`)) {
    return { error: "Documento no válido." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, documento_identidad_url")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; documento_identidad_url: string | null }>();

  if (!perfil) {
    return { error: "Completa tu perfil antes de subir tu documento." };
  }

  const rutaAnterior = perfil.documento_identidad_url;

  const { error } = await supabase
    .from("profesionales")
    .update({ documento_identidad_url: ruta, verificado: false, verificado_en: null })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  if (rutaAnterior && rutaAnterior !== ruta) {
    await supabase.storage.from(DOCUMENTOS_IDENTIDAD_BUCKET).remove([rutaAnterior]);
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}
