"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { isProvincia, type Provincia } from "@/lib/provincias";
import { isCategoria, type Categoria } from "@/lib/profesionales";

export type ListaEsperaResultado = { error?: string };

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Apunta un email a la lista de espera de una zona/categoría sin
 * profesionales todavía. La tabla lista_espera_zona ya existe con RLS de
 * INSERT abierta a anon/authenticated, así que no requiere sesión.
 */
export async function apuntarseListaEspera(
  email: string,
  provincia?: string,
  categoria?: string
): Promise<ListaEsperaResultado> {
  const emailLimpio = email.trim();
  if (!emailLimpio || !emailValido(emailLimpio)) {
    return { error: "Indica un email válido." };
  }

  const provinciaValida: Provincia | null =
    provincia && isProvincia(provincia) ? provincia : null;
  const categoriaValida: Categoria | null =
    categoria && isCategoria(categoria) ? categoria : null;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("lista_espera_zona").insert({
    email: emailLimpio,
    provincia: provinciaValida,
    categoria: categoriaValida,
  });

  if (error) {
    return { error: "No se pudo guardar tu email. Inténtalo de nuevo." };
  }

  return {};
}
