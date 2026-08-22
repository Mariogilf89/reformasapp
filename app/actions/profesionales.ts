"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  DOCUMENTOS_IDENTIDAD_BUCKET,
  FOTOS_BUCKET,
  MAX_FOTOS_PROFESIONAL,
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
  const zona = formData.get("zona")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim();

  if (categorias.length === 0) {
    return { error: "Selecciona al menos una categoría." };
  }
  if (!zona) {
    return { error: "Indica tu zona de cobertura." };
  }
  if (!descripcion) {
    return { error: "Añade una descripción." };
  }

  const nombre = user.user_metadata?.full_name ?? user.email ?? "Profesional";

  const { error } = await supabase.from("profesionales").upsert(
    { user_id: user.id, nombre, categorias, provincias, zona, descripcion },
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

// Extrae la ruta dentro del bucket (userId/archivo.ext) de una URL pública,
// verificando que la foto pertenece a la carpeta del propio usuario.
function extraerRutaStorage(url: string, userId: string): string | null {
  const marcador = `/storage/v1/object/public/${FOTOS_BUCKET}/${userId}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return `${userId}/${url.slice(indice + marcador.length)}`;
}

export async function agregarFotoProfesional(url: string): Promise<PerfilFormState> {
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
    return { error: "Completa tu perfil antes de añadir fotos." };
  }

  const fotosActuales = perfil.fotos ?? [];
  if (fotosActuales.length >= MAX_FOTOS_PROFESIONAL) {
    return { error: `Solo puedes tener un máximo de ${MAX_FOTOS_PROFESIONAL} fotos.` };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ fotos: [...fotosActuales, url] })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

export async function borrarFotoProfesional(url: string): Promise<PerfilFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const ruta = extraerRutaStorage(url, user.id);
  if (!ruta) {
    return { error: "Foto no válida." };
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, fotos")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; fotos: string[] }>();

  if (!perfil) {
    return { error: "No autorizado." };
  }

  const { error } = await supabase
    .from("profesionales")
    .update({ fotos: (perfil.fotos ?? []).filter((foto) => foto !== url) })
    .eq("id", perfil.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.storage.from(FOTOS_BUCKET).remove([ruta]);

  revalidatePath("/dashboard/perfil");
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
}): Promise<ProfesionalBusqueda[]> {
  const { categoria, provincia, modo, fecha, horaInicio } = params;

  if (modo === "dia_hora" && (!fecha || !horaInicio)) {
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
        const libre = Boolean(dia && horasFuturas(dia, hoyISO, ahoraMinutos).includes(horaInicio!));
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
