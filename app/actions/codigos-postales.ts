"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { buscarMunicipioPorCp, type MunicipioPorCp } from "@/lib/codigos-postales";

/**
 * Resuelve un código postal a su municipio/provincia para el autocompletado
 * del formulario de contacto. Se llama directamente desde un componente
 * cliente (no va atado a un <form>), típicamente al completar los 5 dígitos.
 */
export async function buscarCodigoPostal(cp: string): Promise<MunicipioPorCp | null> {
  if (!/^\d{5}$/.test(cp)) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  return buscarMunicipioPorCp(supabase, cp);
}
