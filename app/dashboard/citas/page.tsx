import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { obtenerContactoTelefonicoUsuario, type ContactoTelefonico } from "@/lib/supabase-admin";
import { TIPOS_CITA, type TipoCita, type EstadoCita, type PropuestoPor } from "@/lib/citas";
import { aceptarCitaCliente, caducarCitasPendientes } from "@/app/actions/citas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type CitaConfirmadaProfesional = {
  id: string;
  solicitud_id: string;
  cliente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita;
};

type CitaCanceladaProfesional = {
  id: string;
  solicitud_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita;
  comentario: string | null;
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
  profesionales: { nombre: string; user_id: string } | null;
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * El profesional ve el teléfono del cliente en cuanto este lo ha guardado:
 * los clientes no pasan por verificación SMS, así que no hay nada que
 * exigirles más allá de haberlo añadido.
 */
function TelefonoDeContacto({
  telefono,
  mensajeAusente,
}: {
  telefono: string | null;
  mensajeAusente: string;
}) {
  return (
    <p className="text-neutral-600 dark:text-neutral-400">
      {telefono ? `Teléfono de contacto: ${telefono}` : mensajeAusente}
    </p>
  );
}

/**
 * El cliente solo ve el teléfono del profesional si este lo ha verificado
 * por SMS. No es una acción que el cliente pueda realizar por él, así que
 * el aviso es informativo, sin enlace.
 */
function TelefonoProfesionalParaCliente({
  verificado,
  telefono,
}: {
  verificado: boolean;
  telefono: string | null;
}) {
  if (!verificado) {
    return (
      <p className="text-neutral-600 dark:text-neutral-400">
        El profesional todavía no ha verificado su teléfono.
      </p>
    );
  }

  return (
    <p className="text-neutral-600 dark:text-neutral-400">
      Teléfono de contacto: {telefono ?? "todavía no disponible"}
    </p>
  );
}

function AvisoAnadirTelefonoPropio({ tieneTelefono }: { tieneTelefono: boolean }) {
  if (tieneTelefono) {
    return null;
  }

  return (
    <p className="text-neutral-600 dark:text-neutral-400">
      <Link
        href="/dashboard/verificar-telefono"
        className="font-medium text-primary-700 hover:underline dark:text-primary-400"
      >
        Añade tu teléfono de contacto
      </Link>{" "}
      para que el profesional pueda localizarte.
    </p>
  );
}

export default async function CitasPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await caducarCitasPendientes(supabase);

  const telefonoPropio = (user.user_metadata?.telefono as string | undefined) ?? null;

  const { data: perfilProfesional } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  // Esta vista de lista es solicitud-céntrica (cada tarjeta enlaza a "Ver
  // solicitud" y muestra al cliente/su teléfono): las citas externas
  // (origen_externo = true, sin cliente_id/solicitud_id/tipo) se crean,
  // editan y cancelan por completo desde el calendario nuevo en
  // /dashboard, así que aquí se excluyen para no reventar esos supuestos.
  const { data: citasPendientesProfesional } = perfilProfesional
    ? await supabase
        .from("citas")
        .select("id, solicitud_id, fecha, hora_inicio, tipo")
        .eq("profesional_id", perfilProfesional.id)
        .eq("estado", "pendiente")
        .eq("propuesto_por", "cliente")
        .eq("origen_externo", false)
        .order("creado_en", { ascending: true })
        .returns<CitaPendienteProfesional[]>()
    : { data: [] as CitaPendienteProfesional[] };

  const { data: citasConfirmadasProfesional } = perfilProfesional
    ? await supabase
        .from("citas")
        .select("id, solicitud_id, cliente_id, fecha, hora_inicio, hora_fin, tipo")
        .eq("profesional_id", perfilProfesional.id)
        .eq("estado", "confirmada")
        .eq("origen_externo", false)
        .order("fecha", { ascending: true })
        .returns<CitaConfirmadaProfesional[]>()
    : { data: [] as CitaConfirmadaProfesional[] };

  const { data: citasCanceladasProfesional } = perfilProfesional
    ? await supabase
        .from("citas")
        .select("id, solicitud_id, fecha, hora_inicio, hora_fin, tipo, comentario")
        .eq("profesional_id", perfilProfesional.id)
        .eq("estado", "cancelada")
        .eq("origen_externo", false)
        .order("fecha", { ascending: false })
        .returns<CitaCanceladaProfesional[]>()
    : { data: [] as CitaCanceladaProfesional[] };

  const telefonosClientes = new Map<string, string | null>();
  for (const cita of citasConfirmadasProfesional ?? []) {
    if (!telefonosClientes.has(cita.cliente_id)) {
      const contacto = await obtenerContactoTelefonicoUsuario(cita.cliente_id);
      telefonosClientes.set(cita.cliente_id, contacto.telefono);
    }
  }

  const { data: citasCliente } = await supabase
    .from("citas")
    .select(
      "id, solicitud_id, fecha, hora_inicio, hora_fin, tipo, estado, propuesto_por, comentario, profesionales(nombre, user_id)"
    )
    .eq("cliente_id", user.id)
    .order("creado_en", { ascending: false })
    .returns<CitaCliente[]>();

  const telefonosProfesionales = new Map<string, ContactoTelefonico>();
  for (const cita of citasCliente ?? []) {
    const profesionalUserId = cita.profesionales?.user_id;
    if (cita.estado === "confirmada" && profesionalUserId && !telefonosProfesionales.has(profesionalUserId)) {
      telefonosProfesionales.set(profesionalUserId, await obtenerContactoTelefonicoUsuario(profesionalUserId));
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      {perfilProfesional && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Citas por confirmar
          </h1>

          {(citasPendientesProfesional ?? []).length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">
              No tienes ninguna solicitud de cita pendiente.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {(citasPendientesProfesional ?? []).map((cita) => {
                const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
                return (
                  <Card key={cita.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          Con Cliente · {tipoLabel}
                        </p>
                      </div>
                      <Badge status="pendiente">pendiente</Badge>
                    </div>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      Ver solicitud
                    </Link>

                    <div className="mt-4 flex flex-col gap-3">
                      <AceptarCitaForm citaId={cita.id} />
                      <ProponerHorarioForm citaId={cita.id} />
                      <AnularCitaProfesionalForm citaId={cita.id} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {perfilProfesional && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Mis citas confirmadas
          </h1>

          {(citasConfirmadasProfesional ?? []).length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">
              No tienes ninguna cita confirmada todavía.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {(citasConfirmadasProfesional ?? []).map((cita) => {
                const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
                return (
                  <Card key={cita.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                          {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          Con Cliente · {tipoLabel}
                        </p>
                      </div>
                      <Badge status="confirmada">confirmada</Badge>
                    </div>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      Ver solicitud
                    </Link>

                    <div className="mt-3 text-sm">
                      <TelefonoDeContacto
                        telefono={telefonosClientes.get(cita.cliente_id) ?? null}
                        mensajeAusente="El cliente no ha añadido un teléfono de contacto todavía."
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {perfilProfesional && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Citas canceladas
          </h1>

          {(citasCanceladasProfesional ?? []).length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">
              No tienes ninguna cita cancelada.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {(citasCanceladasProfesional ?? []).map((cita) => {
                const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
                return (
                  <Card key={cita.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                          {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          Con Cliente · {tipoLabel}
                        </p>
                      </div>
                      <Badge status="cancelada">cancelada</Badge>
                    </div>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      Ver solicitud
                    </Link>

                    {cita.comentario && (
                      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                        &quot;{cita.comentario}&quot;
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-lg flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Mis citas
        </h1>

        {(citasCliente ?? []).length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            Todavía no has reservado ninguna cita.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {(citasCliente ?? []).map((cita) => {
              const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
              const nombreProfesional = cita.profesionales?.nombre ?? "Profesional";
              const contactoProfesional = cita.profesionales?.user_id
                ? telefonosProfesionales.get(cita.profesionales.user_id)
                : undefined;

              return (
                <Card key={cita.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        Con {nombreProfesional} · {tipoLabel}
                      </p>
                      <Link
                        href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                        className="mt-1 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
                      >
                        Ver solicitud
                      </Link>
                    </div>
                    <Badge status={cita.estado}>{cita.estado}</Badge>
                  </div>

                  <div className="mt-3 text-sm">
                    {cita.estado === "pendiente" && cita.propuesto_por === "cliente" && (
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Esperando confirmación del profesional.
                      </p>
                    )}

                    {cita.estado === "pendiente" && cita.propuesto_por === "profesional" && (
                      <div className="flex flex-col gap-2">
                        <p className="text-neutral-600 dark:text-neutral-400">
                          El profesional propone: {formatearFecha(cita.fecha)}
                          {" · "}
                          {cita.hora_inicio.slice(0, 5)}
                          {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                        </p>
                        {cita.comentario && (
                          <p className="text-neutral-600 dark:text-neutral-400">
                            &quot;{cita.comentario}&quot;
                          </p>
                        )}
                        <div className="flex items-start gap-3">
                          <form action={aceptarCitaCliente}>
                            <input type="hidden" name="id" value={cita.id} />
                            <Button type="submit" size="xs">
                              Aceptar
                            </Button>
                          </form>
                          <AnularCitaClienteForm citaId={cita.id} />
                        </div>
                      </div>
                    )}

                    {cita.estado === "confirmada" && (
                      <div className="flex flex-col gap-2">
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                          {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                        </p>
                        <TelefonoProfesionalParaCliente
                          verificado={contactoProfesional?.verificado ?? false}
                          telefono={contactoProfesional?.telefono ?? null}
                        />
                        <AvisoAnadirTelefonoPropio tieneTelefono={Boolean(telefonoPropio)} />
                      </div>
                    )}

                    {cita.estado === "cancelada" && (
                      <div>
                        <p className="text-neutral-600 dark:text-neutral-400">Cita anulada.</p>
                        {cita.comentario && (
                          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                            &quot;{cita.comentario}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
