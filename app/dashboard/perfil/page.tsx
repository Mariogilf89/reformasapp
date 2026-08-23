import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DIAS_SEMANA } from "@/lib/disponibilidad";
import { borrarTramoDisponibilidad, borrarExcepcionDisponibilidad } from "@/app/actions/disponibilidad";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificadoBadge } from "@/components/ui/verificado-badge";
import { DescripcionSection } from "./descripcion-section";
import { CategoriasSection } from "./categorias-section";
import { ProvinciasSection } from "./provincias-section";
import { ZonaGuardarSection } from "./zona-guardar-section";
import { FotosForm } from "./fotos-form";
import { VerificacionForm } from "./verificacion-form";
import { DisponibilidadForm } from "./disponibilidad-form";
import { ExcepcionDisponibilidadForm } from "./excepcion-disponibilidad-form";
import { AvisoCambiosSinGuardar } from "./aviso-cambios-sin-guardar";

type Tramo = {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

type Excepcion = {
  id: string;
  fecha: string;
  todo_el_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
};

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function PerfilProfesionalPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "profesional") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, categorias, zona, descripcion, fotos, documento_identidad_url, verificado, provincias")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: valoraciones } = perfil
    ? await supabase
        .from("valoraciones")
        .select("puntuacion, comentario, creado_en")
        .eq("profesional_id", perfil.id)
        .order("creado_en", { ascending: false })
        .returns<{ puntuacion: number; comentario: string | null; creado_en: string }[]>()
    : { data: [] as { puntuacion: number; comentario: string | null; creado_en: string }[] };

  const media =
    valoraciones && valoraciones.length > 0
      ? valoraciones.reduce((suma, v) => suma + v.puntuacion, 0) / valoraciones.length
      : null;

  const { data: disponibilidad } = perfil
    ? await supabase
        .from("disponibilidad")
        .select("id, dia_semana, hora_inicio, hora_fin")
        .eq("profesional_id", perfil.id)
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .returns<Tramo[]>()
    : { data: [] as Tramo[] };

  const { data: excepciones } = perfil
    ? await supabase
        .from("excepciones_disponibilidad")
        .select("id, fecha, todo_el_dia, hora_inicio, hora_fin")
        .eq("profesional_id", perfil.id)
        .gte("fecha", fechaISO(new Date()))
        .order("fecha", { ascending: true })
        .returns<Excepcion[]>()
    : { data: [] as Excepcion[] };

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      <AvisoCambiosSinGuardar />

      <div className="flex w-full max-w-6xl items-center gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Mi perfil profesional
        </h1>
        {perfil?.verificado && <VerificadoBadge />}
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-8">
          <DescripcionSection descripcionInicial={perfil?.descripcion} />
          {perfil && <FotosForm userId={user.id} fotosIniciales={perfil.fotos ?? []} />}
        </div>

        {/* Columna central */}
        <div className="flex flex-col gap-8">
          {perfil && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Mi disponibilidad
              </h2>

              <div className="flex flex-col gap-4">
                {DIAS_SEMANA.map((dia) => {
                  const tramosDia = (disponibilidad ?? []).filter(
                    (tramo) => tramo.dia_semana === dia.value
                  );
                  if (tramosDia.length === 0) return null;

                  return (
                    <div key={dia.value}>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {dia.label}
                      </p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {tramosDia.map((tramo) => (
                          <li key={tramo.id}>
                            <Card className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {tramo.hora_inicio.slice(0, 5)} – {tramo.hora_fin.slice(0, 5)}
                              </span>
                              <form action={borrarTramoDisponibilidad}>
                                <input type="hidden" name="id" value={tramo.id} />
                                <Button type="submit" variant="danger" size="xs">
                                  Borrar
                                </Button>
                              </form>
                            </Card>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {(disponibilidad ?? []).length === 0 && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Todavía no has añadido ningún tramo de disponibilidad.
                  </p>
                )}
              </div>

              <DisponibilidadForm />
            </div>
          )}

          {perfil && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Días no disponibles
              </h2>

              <div className="flex flex-col gap-2">
                {(excepciones ?? []).length === 0 && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    No tienes ninguna excepción próxima.
                  </p>
                )}
                {(excepciones ?? []).map((excepcion) => (
                  <Card
                    key={excepcion.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {new Date(`${excepcion.fecha}T00:00:00`).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {" · "}
                      {excepcion.todo_el_dia
                        ? "Todo el día"
                        : `${excepcion.hora_inicio?.slice(0, 5)} – ${excepcion.hora_fin?.slice(0, 5)}`}
                    </span>
                    <form action={borrarExcepcionDisponibilidad}>
                      <input type="hidden" name="id" value={excepcion.id} />
                      <Button type="submit" variant="danger" size="xs">
                        Borrar
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>

              <ExcepcionDisponibilidadForm />
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-8">
          <CategoriasSection categoriasIniciales={perfil?.categorias} />
          <ProvinciasSection provinciasIniciales={perfil?.provincias} />
          <ZonaGuardarSection zonaInicial={perfil?.zona} />
        </div>
      </div>

      {perfil && (
        <VerificacionForm
          userId={user.id}
          tieneDocumentoInicial={Boolean(perfil.documento_identidad_url)}
          verificadoInicial={Boolean(perfil.verificado)}
        />
      )}

      {perfil && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Valoraciones {media !== null && `· ${media.toFixed(1)} / 5`}
          </h2>

          {(valoraciones ?? []).length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Todavía no has recibido ninguna valoración.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(valoraciones ?? []).map((valoracion, index) => (
                <li key={index}>
                  <Card className="p-3 text-sm">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {valoracion.puntuacion} {valoracion.puntuacion === 1 ? "estrella" : "estrellas"}
                    </p>
                    {valoracion.comentario && (
                      <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                        {valoracion.comentario}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
