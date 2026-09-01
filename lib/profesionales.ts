export const CATEGORIAS = [
  { value: "pintura", label: "Pintura" },
  { value: "electricidad", label: "Electricidad" },
  { value: "fontaneria", label: "Fontanería" },
  { value: "carpinteria", label: "Carpintería" },
  { value: "albanileria", label: "Albañilería" },
  { value: "cerrajeria", label: "Cerrajería" },
  { value: "climatizacion", label: "Climatización" },
  { value: "jardineria", label: "Jardinería" },
  { value: "limpieza", label: "Limpieza" },
  { value: "mudanzas", label: "Mudanzas" },
  { value: "decoracion", label: "Decoración" },
  { value: "otros", label: "Otros" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["value"];

export function isCategoria(value: string): value is Categoria {
  return CATEGORIAS.some((categoria) => categoria.value === value);
}

export const FOTOS_BUCKET = "fotos-profesionales";
export const MAX_TAMANO_FOTO_BYTES = 5 * 1024 * 1024;
export const MAX_FOTOS_TRABAJO = 5;

export const DOCUMENTOS_IDENTIDAD_BUCKET = "documentos-identidad";

// Extrae la ruta dentro del bucket (userId/archivo.ext) de una URL pública de
// FOTOS_BUCKET, verificando que la foto pertenece a la carpeta del propio
// usuario. La usan tanto app/actions/profesionales.ts (fotos de perfil) como
// app/actions/trabajos.ts (fotos de trabajos, en userId/trabajos/...).
export function extraerRutaStorage(url: string, userId: string): string | null {
  const marcador = `/storage/v1/object/public/${FOTOS_BUCKET}/${userId}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return `${userId}/${url.slice(indice + marcador.length)}`;
}
