import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { isProvincia } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { VerificadoBadge } from "@/components/ui/verificado-badge";
import { ContactarForm } from "./contactar-form";

type ProfesionalPublico = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  zona: string;
  descripcion: string;
  fotos: string[];
  verificado: boolean;
};

type ValoracionPublica = {
  puntuacion: number;
  comentario: string | null;
  creado_en: string;
};

export default async function ProfesionalDetallePage(
  props: PageProps<"/profesionales/[id]">
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const fechaElegida = typeof searchParams.fecha === "string" ? searchParams.fecha : undefined;
  const horaInicioElegida =
    typeof searchParams.hora_inicio === "string" ? searchParams.hora_inicio : undefined;

  const modoParam = typeof searchParams.modo === "string" ? searchParams.modo : "";
  const modoElegido =
    modoParam === "lo_antes_posible" || modoParam === "indiferente" || modoParam === "dia_hora"
      ? modoParam
      : undefined;
  const provinciaParam = typeof searchParams.provincia === "string" ? searchParams.provincia : "";
  const provinciaElegida = provinciaParam && isProvincia(provinciaParam) ? provinciaParam : undefined;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = user?.user_metadata?.role;

  const { data: profesional } = await supabase
    .from("profesionales_publico")
    .select("id, nombre, categorias, zona, descripcion, fotos, verificado")
    .eq("id", id)
    .maybeSingle<ProfesionalPublico>();

  if (!profesional) {
    notFound();
  }

  const { data: valoraciones } = await supabase
    .from("valoraciones")
    .select("puntuacion, comentario, creado_en")
    .eq("profesional_id", profesional.id)
    .order("creado_en", { ascending: false })
    .returns<ValoracionPublica[]>();

  const listaValoraciones = valoraciones ?? [];
  const media =
    listaValoraciones.length > 0
      ? listaValoraciones.reduce((suma, v) => suma + v.puntuacion, 0) / listaValoraciones.length
      : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">
                {profesional.nombre}
              </h1>
              {profesional.verificado && <VerificadoBadge />}
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              {profesional.zona}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {profesional.categorias.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {CATEGORIAS.find((c) => c.value === cat)?.label ?? cat}
              </span>
            ))}
          </div>

          <p className="text-sm text-neutral-700">
            {profesional.descripcion}
          </p>

          <p className="text-sm text-neutral-600">
            {media !== null
              ? `★ ${media.toFixed(1)} / 5 (${listaValoraciones.length} valoraci${listaValoraciones.length === 1 ? "ón" : "ones"})`
              : "Todavía no tiene valoraciones."}
          </p>

          {profesional.fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {profesional.fotos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`Trabajo de ${profesional.nombre}`}
                  className="aspect-square w-full rounded-lg border border-neutral-200 object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="w-full max-w-2xl">
        {!user ? (
          <Link
            href={`/register?redirect=${encodeURIComponent(`/profesionales/${profesional.id}`)}`}
            className={buttonClassName()}
          >
            Contactar
          </Link>
        ) : rol === "cliente" ? (
          <ContactarForm
            profesionalId={profesional.id}
            categoriasProfesional={profesional.categorias}
            fechaElegida={fechaElegida}
            horaInicioElegida={horaInicioElegida}
            modoElegido={modoElegido}
            provinciaElegida={provinciaElegida}
          />
        ) : (
          <p className="text-sm text-neutral-500">
            Esta vista es para clientes.
          </p>
        )}
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Valoraciones
        </h2>

        {listaValoraciones.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Todavía no hay valoraciones para este profesional.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {listaValoraciones.map((valoracion, index) => (
              <li key={index}>
                <Card className="p-4 text-sm">
                  <p className="font-medium text-neutral-900">
                    {valoracion.puntuacion}{" "}
                    {valoracion.puntuacion === 1 ? "estrella" : "estrellas"}
                  </p>
                  {valoracion.comentario && (
                    <p className="mt-1 text-neutral-600">
                      {valoracion.comentario}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/profesionales"
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        ← Volver al directorio
      </Link>
    </div>
  );
}
