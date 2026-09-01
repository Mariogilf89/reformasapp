import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { obtenerContactoTelefonicoUsuario, type ContactoTelefonico } from "@/lib/supabase-admin";
import { TIPOS_CITA, type TipoCita, type EstadoCita, type PropuestoPor } from "@/lib/citas";
import { aceptarCitaCliente, caducarCitasPendientes } from "@/app/actions/citas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnularCitaClienteForm } from "./anular-cita-cliente-form";
import { TodasLasCitasLista, type CitaTodas } from "./todas-las-citas-lista";

type CitaTodasRaw = {
  id: string;
  solicitud_id: string | null;
  cliente_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita | null;
  origen_externo: boolean;
  titulo_externo: string | null;
  contacto_nombre: string | null;
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
      <p className="text-neutral-600">
        El profesional todavía no ha verificado su teléfono.
      </p>
    );
  }

  return (
    <p className="text-neutral-600">
      Teléfono de contacto: {telefono ?? "todavía no disponible"}
    </p>
  );
}

function AvisoAnadirTelefonoPropio({ tieneTelefono }: { tieneTelefono: boolean }) {
  if (tieneTelefono) {
    return null;
  }

  return (
    <p className="text-neutral-600">
      <Link
        href="/dashboard/verificar-telefono"
        className="font-medium text-primary-700 hover:underline"
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

  const { data: perfilProfesional } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (perfilProfesional) {
    // "Todas las citas": lo mismo que aparece en el calendario de
    // /dashboard — confirmadas, tanto reales (con cliente) como bloqueos
    // externos. No hay filtro por origen_externo: ambos tipos comparten
    // estado="confirmada" en cuanto tienen fecha asignada.
    const { data: citas } = await supabase
      .from("citas")
      .select(
        "id, solicitud_id, cliente_id, fecha, hora_inicio, hora_fin, tipo, origen_externo, titulo_externo, contacto_nombre"
      )
      .eq("profesional_id", perfilProfesional.id)
      .eq("estado", "confirmada")
      .order("fecha", { ascending: true })
      .returns<CitaTodasRaw[]>();

    const contactosPorCliente = new Map<string, ContactoTelefonico>();
    for (const cita of citas ?? []) {
      if (!cita.origen_externo && cita.cliente_id && !contactosPorCliente.has(cita.cliente_id)) {
        contactosPorCliente.set(cita.cliente_id, await obtenerContactoTelefonicoUsuario(cita.cliente_id));
      }
    }

    const citasEnriquecidas: CitaTodas[] = (citas ?? []).map((cita) => ({
      ...cita,
      nombreCliente: cita.cliente_id ? contactosPorCliente.get(cita.cliente_id)?.nombre ?? null : null,
      telefonoCliente: cita.cliente_id ? contactosPorCliente.get(cita.cliente_id)?.telefono ?? null : null,
    }));

    return (
      <div className="w-full max-w-lg flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neutral-900">Todas las citas</h2>
        <TodasLasCitasLista citas={citasEnriquecidas} />
      </div>
    );
  }

  // Cliente: listado propio sin cambios (no tiene sub-apartados, cada
  // tarjeta ya distingue su propio estado pendiente/confirmada/cancelada).
  const telefonoPropio = (user.user_metadata?.telefono as string | undefined) ?? null;

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
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Mis citas
      </h1>

      {(citasCliente ?? []).length === 0 ? (
        <p className="text-neutral-600">
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
                    <p className="font-medium text-neutral-900">
                      Con {nombreProfesional} · {tipoLabel}
                    </p>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-1 inline-block text-sm font-medium text-primary-700 hover:underline"
                    >
                      Ver solicitud
                    </Link>
                  </div>
                  <Badge status={cita.estado}>{cita.estado}</Badge>
                </div>

                <div className="mt-3 text-sm">
                  {cita.estado === "pendiente" && cita.propuesto_por === "cliente" && (
                    <p className="text-neutral-600">
                      Esperando confirmación del profesional.
                    </p>
                  )}

                  {cita.estado === "pendiente" && cita.propuesto_por === "profesional" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-neutral-600">
                        El profesional propone: {formatearFecha(cita.fecha)}
                        {" · "}
                        {cita.hora_inicio.slice(0, 5)}
                        {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                      </p>
                      {cita.comentario && (
                        <p className="text-neutral-600">
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
                      <p className="text-neutral-600">
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
                      <p className="text-neutral-600">Cita anulada.</p>
                      {cita.comentario && (
                        <p className="mt-1 text-neutral-600">
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
  );
}
