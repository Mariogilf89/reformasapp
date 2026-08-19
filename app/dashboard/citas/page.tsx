import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_CITA, type TipoCita, type EstadoCita, type PropuestoPor } from "@/lib/citas";
import { aceptarCitaCliente } from "@/app/actions/citas";
import { AceptarCitaForm } from "./aceptar-cita-form";
import { ProponerHorarioForm } from "./proponer-horario-form";
import { AnularCitaProfesionalForm } from "./anular-cita-profesional-form";
import { AnularCitaClienteForm } from "./anular-cita-cliente-form";

type CitaPendienteProfesional = {
  id: string;
  solicitud_id: string;
  fecha: string;
  hora_inicio: string;
  tipo: TipoCita;
};

type CitaCliente = {
  id: string;
  solicitud_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita;
  estado: EstadoCita;
  propuesto_por: PropuestoPor;
  comentario: string | null;
  profesionales: { nombre: string } | null;
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function CitasPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfilProfesional } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  const { data: citasPendientesProfesional } = perfilProfesional
    ? await supabase
        .from("citas")
        .select("id, solicitud_id, fecha, hora_inicio, tipo")
        .eq("profesional_id", perfilProfesional.id)
        .eq("estado", "pendiente")
        .eq("propuesto_por", "cliente")
        .order("creado_en", { ascending: true })
        .returns<CitaPendienteProfesional[]>()
    : { data: [] as CitaPendienteProfesional[] };

  const { data: citasCliente } = await supabase
    .from("citas")
    .select(
      "id, solicitud_id, fecha, hora_inicio, hora_fin, tipo, estado, propuesto_por, comentario, profesionales(nombre)"
    )
    .eq("cliente_id", user.id)
    .order("creado_en", { ascending: false })
    .returns<CitaCliente[]>();

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      {perfilProfesional && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Citas por confirmar</h1>

          {(citasPendientesProfesional ?? []).length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              No tienes ninguna solicitud de cita pendiente.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {(citasPendientesProfesional ?? []).map((cita) => {
                const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
                return (
                  <div
                    key={cita.id}
                    className="rounded-xl border border-black/10 p-6 dark:border-white/15"
                  >
                    <p className="font-medium">
                      {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Con Cliente · {tipoLabel}
                    </p>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-2 inline-block text-sm font-medium underline"
                    >
                      Ver solicitud
                    </Link>

                    <div className="mt-4 flex flex-col gap-3">
                      <AceptarCitaForm citaId={cita.id} />
                      <ProponerHorarioForm citaId={cita.id} />
                      <AnularCitaProfesionalForm citaId={cita.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-lg flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Mis citas</h1>

        {(citasCliente ?? []).length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Todavía no has reservado ninguna cita.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {(citasCliente ?? []).map((cita) => {
              const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
              const nombreProfesional = cita.profesionales?.nombre ?? "Profesional";

              return (
                <div
                  key={cita.id}
                  className="rounded-xl border border-black/10 p-6 dark:border-white/15"
                >
                  <p className="font-medium">
                    Con {nombreProfesional} · {tipoLabel}
                  </p>
                  <Link
                    href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                    className="mt-1 inline-block text-sm font-medium underline"
                  >
                    Ver solicitud
                  </Link>

                  <div className="mt-3 text-sm">
                    {cita.estado === "pendiente" && cita.propuesto_por === "cliente" && (
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Esperando confirmación del profesional.
                      </p>
                    )}

                    {cita.estado === "pendiente" && cita.propuesto_por === "profesional" && (
                      <div className="flex flex-col gap-2">
                        <p className="text-zinc-600 dark:text-zinc-400">
                          El profesional propone: {formatearFecha(cita.fecha)}
                          {" · "}
                          {cita.hora_inicio.slice(0, 5)}
                          {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                        </p>
                        {cita.comentario && (
                          <p className="text-zinc-600 dark:text-zinc-400">
                            &quot;{cita.comentario}&quot;
                          </p>
                        )}
                        <div className="flex items-start gap-3">
                          <form action={aceptarCitaCliente}>
                            <input type="hidden" name="id" value={cita.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background"
                            >
                              Aceptar
                            </button>
                          </form>
                          <AnularCitaClienteForm citaId={cita.id} />
                        </div>
                      </div>
                    )}

                    {cita.estado === "confirmada" && (
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                        {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                      </p>
                    )}

                    {cita.estado === "cancelada" && (
                      <div>
                        <p className="text-zinc-600 dark:text-zinc-400">Cita anulada.</p>
                        {cita.comentario && (
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            &quot;{cita.comentario}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
