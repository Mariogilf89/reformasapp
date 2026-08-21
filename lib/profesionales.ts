export const CATEGORIAS = [
  { value: "pintura", label: "Pintura" },
  { value: "electricidad", label: "Electricidad" },
  { value: "fontaneria", label: "Fontanería" },
  { value: "carpinteria", label: "Carpintería" },
  { value: "otros", label: "Otros" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["value"];

export function isCategoria(value: string): value is Categoria {
  return CATEGORIAS.some((categoria) => categoria.value === value);
}

export const FOTOS_BUCKET = "fotos-profesionales";
export const MAX_FOTOS_PROFESIONAL = 6;
export const MAX_TAMANO_FOTO_BYTES = 5 * 1024 * 1024;

export const DOCUMENTOS_IDENTIDAD_BUCKET = "documentos-identidad";
