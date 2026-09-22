import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { formatearUbicacion, isProvincia, type Provincia } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { VerificadoBadge } from "@/components/ui/verificado-badge";
import { NivelBadge } from "@/components/ui/nivel-badge";
import { IconUbicacion } from "@/components/ui/icon-ubicacion";
import { IconReloj } from "@/components/ui/icon-reloj";
import type { FotoTrabajo } from "@/app/actions/trabajos";
import { calcularTiempoRespuestaProfesional, contarCitasCompletadasPorProfesionales } from "@/lib/supabase-admin";
import { formatearTiempoRespuesta } from "@/lib/tiempo-respuesta";
import { calcularNivelProfesional } from "@/lib/niveles-profesional";
import { ReportarProblema } from "@/components/reportar-problema";
import { ContactarForm } from "./contactar-form";

type ProfesionalPublico = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  zona: string;
  provincias: Provincia[];
  descripcion: string;
  fotos: string[];
  verificado: boolean;
};

type ValoracionPublica = {
  puntuacion: number;
  puntualidad: number;
  calidad: number;
  precio: number;
  comunicacion: number;
  comentario: string | null;
  creado_en: string;
};

const CRITERIOS_VALORACION = [
  { key: "puntualidad", label: "Puntualidad" },
  { key: "calidad", label: "Calidad" },
  { key: "precio", label: "Precio" },
  { key: "comunicacion", label: "Comunicación" },
] as const;

function promedio(valores: number[]): number {
  return valores.reduce((suma, v) => suma + v, 0) / valores.length;
}

type TrabajoPublico = {
  id: string;
  titulo: string;
  categoria: Categoria;
  fotos: FotoTrabajo[];
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
    .select("id, nombre, categorias, zona, provincias, descripcion, fotos, verificado")
    .eq("id", id)
    .maybeSingle<ProfesionalPublico>();

  if (!profesional) {
    notFound();
  }

  const tiempoRespuesta = await calcularTiempoRespuestaProfesional(profesional.id);

  const { data: valoraciones } = await supabase
    .from("valoraciones")
    .select("puntuacion, puntualidad, calidad, precio, comunicacion, comentario, creado_en")
    .eq("profesional_id", profesional.id)
    .order("creado_en", { ascending: false })
    .returns<ValoracionPublica[]>();

  const { data: trabajos } = await supabase
    .from("trabajos")
    .select("id, titulo, categoria, fotos")
    .eq("profesional_id", profesional.id)
    .order("creado_en", { ascending: false })
    .returns<TrabajoPublico[]>();

  const ubicacion = formatearUbicacion(profesional.zona, profesional.provincias);
  const listaTrabajos = trabajos ?? [];

  const listaValoraciones = valoraciones ?? [];
  const media =
    listaValoraciones.length > 0
      ? listaValoraciones.reduce((suma, v) => suma + v.puntuacion, 0) / listaValoraciones.length
      : null;
  const mediasPorCriterio =
    listaValoraciones.length > 0
      ? CRITERIOS_VALORACION.map((criterio) => ({
          ...criterio,
          valor: promedio(listaValoraciones.map((v) => v[criterio.key])),
        }))
      : null;

  const citasCompletadasPorProfesional = await contarCitasCompletadasPorProfesionales([
    profesional.id,
  ]);
  const nivel = calcularNivelProfesional(
    citasCompletadasPorProfesional.get(profesional.id) ?? 0,
    media
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">
                {profesional.nombre}
              </h1>
              {profesional.verificado && <VerificadoBadge />}
            </div>
            {ubicacion && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                <IconUbicacion className="h-4 w-4 shrink-0 text-neutral-400" />
                {ubicacion}
              </p>
            )}
            {tiempoRespuesta && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                <IconReloj className="h-4 w-4 shrink-0 text-neutral-400" />
                {formatearTiempoRespuesta(tiempoRespuesta.minutosPromedio)}
              </p>
            )}
            {nivel && (
              <div className="mt-2">
                <NivelBadge nivel={nivel} />
              </div>
            )}
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

      {listaTrabajos.length > 0 && (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            Trabajos realizados
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listaTrabajos.map((trabajo) => {
              const portada = trabajo.fotos[0];
              return (
                <div key={trabajo.id} className="flex flex-col gap-1">
                  <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                    {portada && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portada.url}
                        alt={trabajo.titulo}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {trabajo.titulo}
                  </p>
                  {portada?.descripcion && (
                    <p className="line-clamp-2 text-xs text-neutral-600">
                      {portada.descripcion}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        {!user || rol === "cliente" ? (
          <ContactarForm
            profesionalId={profesional.id}
            fechaElegida={fechaElegida}
            horaInicioElegida={horaInicioElegida}
            modoElegido={modoElegido}
            provinciaElegida={provinciaElegida}
            clientePrecargado={
              user
                ? {
                    nombre: (user.user_metadata?.full_name as string | undefined) ?? "",
                    email: user.email ?? "",
                    telefono: (user.user_metadata?.telefono as string | undefined) ?? "",
                  }
                : undefined
            }
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
          <>
            {mediasPorCriterio && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {mediasPorCriterio.map((criterio) => (
                  <div key={criterio.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-neutral-600">
                      <span>{criterio.label}</span>
                      <span className="font-medium text-neutral-900">
                        {criterio.valor.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-primary-600"
                        style={{ width: `${(criterio.valor / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

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
          </>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <ReportarProblema
          profesionalId={profesional.id}
          profesionalNombre={profesional.nombre}
        />
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
