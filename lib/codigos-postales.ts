import "server-only";
import type { Supabase } from "@/app/actions/citas";

export type MunicipioPorCp = { municipio: string; provincia: string };

/**
 * Resuelve un código postal a su municipio/provincia contra la tabla de
 * referencia codigos_postales (datos del INE). Sin match, devuelve null:
 * el formulario de contacto no bloquea el envío por un CP no encontrado,
 * el dataset puede tener algún hueco puntual.
 */
export async function buscarMunicipioPorCp(
  supabase: Supabase,
  cp: string
): Promise<MunicipioPorCp | null> {
  const { data } = await supabase
    .from("codigos_postales")
    .select("municipio, provincia")
    .eq("cp", cp)
    .maybeSingle<MunicipioPorCp>();

  return data ?? null;
}
