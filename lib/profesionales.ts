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
