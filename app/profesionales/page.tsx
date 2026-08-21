import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, isCategoria, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VerificadoBadge } from "@/components/ui/verificado-badge";

type ProfesionalPublico = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  zona: string;
  descripcion: string;
  fotos: string[];
  verificado: boolean;
};

type ValoracionResumen = { profesional_id: string; puntuacion: number };

export default async function ProfesionalesPage(props: PageProps<"/profesionales">) {
  const searchParams = await props.searchParams;
  const categoriaParam =
    typeof searchParams.categoria === "string" ? searchParams.categoria : undefined;
  const categoria = categoriaParam && isCategoria(categoriaParam) ? categoriaParam : undefined;
  const zonaParam = typeof searchParams.zona === "string" ? searchParams.zona.trim() : "";

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("profesionales_publico")
    .select("id, nombre, categorias, zona, descripcion, fotos, verificado")
    .order("creado_en", { ascending: false });

  if (categoria) {
    query = query.contains("categorias", [categoria]);
  }
  if (zonaParam) {
    query = query.ilike("zona", `%${zonaParam}%`);
  }

  const { data: profesionales } = await query.returns<ProfesionalPublico[]>();

  const ids = (profesionales ?? []).map((profesional) => profesional.id);
  const { data: valoraciones } = ids.length
    ? await supabase
        .from("valoraciones")
        .select("profesional_id, puntuacion")
        .in("profesional_id", ids)
        .returns<ValoracionResumen[]>()
    : { data: [] as ValoracionResumen[] };

  const resumenPorProfesional = new Map<string, { media: number; total: number }>();
  for (const id of ids) {
    const puntuaciones = (valoraciones ?? [])
      .filter((valoracion) => valoracion.profesional_id === id)
      .map((valoracion) => valoracion.puntuacion);
    if (puntuaciones.length > 0) {
      const media = puntuaciones.reduce((suma, p) => suma + p, 0) / puntuaciones.length;
      resumenPorProfesional.set(id, { media, total: puntuaciones.length });
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Encuentra un profesional
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Explora los profesionales registrados en ReformasApp.
        </p>
      </div>

      <Card className="w-full max-w-5xl p-6">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="categoria"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Categoría
            </label>
            <Select id="categoria" name="categoria" defaultValue={categoria ?? ""}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="zona"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Zona
            </label>
            <Input
              id="zona"
              name="zona"
              type="text"
              placeholder="Ej. Vigo"
              defaultValue={zonaParam}
            />
          </div>

          <Button type="submit">Filtrar</Button>
        </form>
      </Card>

      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(profesionales ?? []).length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:col-span-2 lg:col-span-3">
            No hay profesionales que coincidan con tu búsqueda.
          </p>
        )}

        {(profesionales ?? []).map((profesional) => {
          const resumen = resumenPorProfesional.get(profesional.id);
          return (
            <Link key={profesional.id} href={`/profesionales/${profesional.id}`}>
              <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary-300">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {profesional.fotos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profesional.fotos[0]}
                      alt={profesional.nombre}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {profesional.nombre}
                  </p>
                  {profesional.verificado && <VerificadoBadge />}
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {profesional.categorias
                    .map((cat) => CATEGORIAS.find((c) => c.value === cat)?.label ?? cat)
                    .join(", ")}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{profesional.zona}</p>

                <p className="mt-auto text-sm text-neutral-500 dark:text-neutral-500">
                  {resumen
                    ? `★ ${resumen.media.toFixed(1)} (${resumen.total})`
                    : "Sin valoraciones todavía"}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
