import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, isCategoria } from "@/lib/profesionales";
import { isProvincia } from "@/lib/provincias";
import {
  obtenerProfesionalesDisponibles,
  type ModoBusquedaDisponibilidad,
} from "@/app/actions/profesionales";
import { Card } from "@/components/ui/card";
import { VerificadoBadge } from "@/components/ui/verificado-badge";
import { ListaEsperaForm } from "@/components/lista-espera-form";
import { FiltroBusqueda } from "./filtro-busqueda";

type ValoracionResumen = { profesional_id: string; puntuacion: number };

function esModoValido(value: string): value is ModoBusquedaDisponibilidad {
  return value === "indiferente" || value === "lo_antes_posible" || value === "dia_hora";
}

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
}

export default async function ProfesionalesPage(props: PageProps<"/profesionales">) {
  const searchParams = await props.searchParams;

  const categoriaParam =
    typeof searchParams.categoria === "string" ? searchParams.categoria : "";
  const categoria = categoriaParam && isCategoria(categoriaParam) ? categoriaParam : undefined;

  const provinciaParam =
    typeof searchParams.provincia === "string" ? searchParams.provincia : "";
  const provincia = provinciaParam && isProvincia(provinciaParam) ? provinciaParam : undefined;

  const zonaParam = typeof searchParams.zona === "string" ? searchParams.zona.trim() : "";

  const modoParam = typeof searchParams.modo === "string" ? searchParams.modo : "indiferente";
  const modo = esModoValido(modoParam) ? modoParam : "indiferente";

  const fechaParam = typeof searchParams.fecha === "string" ? searchParams.fecha : "";
  const horaParam = typeof searchParams.hora_inicio === "string" ? searchParams.hora_inicio : "";
  const horaFinParam = typeof searchParams.hora_fin === "string" ? searchParams.hora_fin : "";

  const resultados = await obtenerProfesionalesDisponibles({
    categoria,
    provincia,
    modo,
    fecha: modo === "dia_hora" ? fechaParam : undefined,
    horaInicio: modo === "dia_hora" ? horaParam : undefined,
    horaFin: modo === "dia_hora" ? horaFinParam : undefined,
  });

  const profesionales = zonaParam
    ? resultados.filter((p) => p.zona.toLowerCase().includes(zonaParam.toLowerCase()))
    : resultados;

  const supabase = await createServerSupabaseClient();
  const ids = profesionales.map((profesional) => profesional.id);
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
          Explora los profesionales registrados en Faenia.
        </p>
      </div>

      <FiltroBusqueda
        categoriaInicial={categoria ?? ""}
        provinciaInicial={provincia ?? ""}
        zonaInicial={zonaParam}
        modoInicial={modo}
        fechaInicial={fechaParam}
        horaInicioInicial={horaParam}
        horaFinInicial={horaFinParam}
      />

      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profesionales.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 p-6 text-center dark:border-neutral-800 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No hay profesionales que coincidan con tu búsqueda todavía. Avísanos cuando
              lleguemos a tu zona.
            </p>
            <ListaEsperaForm
              categoria={categoria}
              provinciaInicial={provincia}
              className="flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-start"
            />
          </div>
        )}

        {profesionales.map((profesional) => {
          const resumen = resumenPorProfesional.get(profesional.id);
          // Se pasa el modo/provincia de esta búsqueda al perfil del
          // profesional para que, si el cliente contacta desde ahí, la
          // solicitud creada quede con ese mismo modo_tiempo/provincia.
          const paramsDetalle = new URLSearchParams();
          paramsDetalle.set("modo", modo);
          if (provincia) paramsDetalle.set("provincia", provincia);
          if (modo === "dia_hora" && fechaParam && horaParam) {
            paramsDetalle.set("fecha", fechaParam);
            paramsDetalle.set("hora_inicio", horaParam);
          }
          const href = `/profesionales/${profesional.id}?${paramsDetalle.toString()}`;

          return (
            <Link key={profesional.id} href={href}>
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

                {profesional.primerHueco && (
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                    Libre {modo === "dia_hora" ? "el" : "a partir del"}{" "}
                    {formatearFecha(profesional.primerHueco.fecha)} a las{" "}
                    {profesional.primerHueco.hora}
                  </p>
                )}

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
