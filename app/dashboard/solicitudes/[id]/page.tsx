import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { MensajeForm } from "./mensaje-form";
import { ContactoCitaForm } from "./contacto-cita-form";
import { ValoracionForm } from "./valoracion-form";
import { ReservaCitaForm } from "./reserva-cita-form";

type Solicitud = {
  id: string;
  cliente_id: string;
  categoria: Categoria;
  zona: string;
  descripcion: string;
  estado: "abierta" | "cerrada";
  creado_en: string;
};

type Mensaje = {
  id: string;
  remitente_id: string;
  destinatario_id: string | null;
  texto: string;
  creado_en: string;
};

type ProfesionalContacto = { id: string; user_id: string; nombre: string };

type ValoracionDetalle = {
  puntuacion: number;
  comentario: string | null;
  profesionales: { nombre: string } | null;
};

export default async function SolicitudDetallePage(
  props: PageProps<"/dashboard/solicitudes/[id]">
) {
  const { id } = await props.params;
  const { contactar } = await props.searchParams;
  const contactarId = typeof contactar === "string" ? contactar : undefined;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select("id, cliente_id, categoria, zona, descripcion, estado, creado_en")
    .eq("id", id)
    .maybeSingle<Solicitud>();

  if (!solicitud) {
    notFound();
  }

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select("id, remitente_id, destinatario_id, texto, creado_en")
    .eq("solicitud_id", id)
    .order("creado_en", { ascending: true })
    .returns<Mensaje[]>();

  const remitentesProfesionalUserIds = Array.from(
    new Set(
      (mensajes ?? [])
        .map((mensaje) => mensaje.remitente_id)
        .filter((remitenteId) => remitenteId !== solicitud.cliente_id)
    )
  );

  const destinatarioProfesionalIds = Array.from(
    new Set(
      (mensajes ?? [])
        .map((mensaje) => mensaje.destinatario_id)
        .filter((destinatarioId): destinatarioId is string => destinatarioId !== null)
    )
  );

  const { data: profesionalesPorUserId } = remitentesProfesionalUserIds.length
    ? await supabase
        .from("profesionales")
        .select("id, user_id, nombre")
        .in("user_id", remitentesProfesionalUserIds)
        .returns<ProfesionalContacto[]>()
    : { data: [] as ProfesionalContacto[] };

  const { data: profesionalesPorId } = destinatarioProfesionalIds.length
    ? await supabase
        .from("profesionales")
        .select("id, user_id, nombre")
        .in("id", destinatarioProfesionalIds)
        .returns<ProfesionalContacto[]>()
    : { data: [] as ProfesionalContacto[] };

  const profesionalesContactadosPorId = new Map<string, ProfesionalContacto>();
  for (const profesional of profesionalesPorUserId ?? []) {
    profesionalesContactadosPorId.set(profesional.id, profesional);
  }
  for (const profesional of profesionalesPorId ?? []) {
    profesionalesContactadosPorId.set(profesional.id, profesional);
  }
  const profesionalesContactados = Array.from(profesionalesContactadosPorId.values());

  const nombresPorUserId = new Map(
    profesionalesContactados.map((p) => [p.user_id, p.nombre])
  );

  const nombreRemitente = (remitenteId: string) => {
    if (remitenteId === user.id) return "Tú";
    if (remitenteId === solicitud.cliente_id) return "Cliente";
    return nombresPorUserId.get(remitenteId) ?? "Profesional";
  };

  const esClienteDueno = user.id === solicitud.cliente_id;

  const contactarYaEscribio = contactarId
    ? (profesionalesPorUserId ?? []).some((p) => p.id === contactarId)
    : false;

  const { data: contactarProfesional } = contactarId
    ? await supabase
        .from("profesionales")
        .select("nombre")
        .eq("id", contactarId)
        .maybeSingle<{ nombre: string }>()
    : { data: null as { nombre: string } | null };

  const { data: valoracion } =
    esClienteDueno && solicitud.estado === "cerrada"
      ? await supabase
          .from("valoraciones")
          .select("puntuacion, comentario, profesionales(nombre)")
          .eq("solicitud_id", id)
          .maybeSingle<ValoracionDetalle>()
      : { data: null as ValoracionDetalle | null };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border border-black/10 p-6 dark:border-white/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">
              {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.label ??
                solicitud.categoria}
              {" · "}
              {solicitud.zona}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {solicitud.descripcion}
            </p>
          </div>
          <span
            className={
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
              (solicitud.estado === "abierta"
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400")
            }
          >
            {solicitud.estado}
          </span>
        </div>
      </div>

      <div id="mensaje" className="w-full max-w-lg flex flex-col gap-4 scroll-mt-8">
        <h2 className="text-xl font-semibold">Mensajes</h2>

        <div className="flex flex-col gap-3">
          {(mensajes ?? []).length === 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Todavía no hay mensajes en esta solicitud.
            </p>
          )}
          {(mensajes ?? []).map((mensaje) => (
            <div
              key={mensaje.id}
              className="rounded-lg bg-black/[.03] p-3 text-sm dark:bg-white/[.05]"
            >
              <p className="font-medium">{nombreRemitente(mensaje.remitente_id)}</p>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">{mensaje.texto}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {new Date(mensaje.creado_en).toLocaleString("es-ES")}
              </p>
            </div>
          ))}
        </div>

        {esClienteDueno && contactarId && !contactarYaEscribio ? (
          <ContactoCitaForm
            solicitudId={solicitud.id}
            profesionalId={contactarId}
            profesionalNombre={contactarProfesional?.nombre}
          />
        ) : (
          <MensajeForm
            solicitudId={solicitud.id}
            paraProfesional={contactarProfesional?.nombre}
            destinatarioId={contactarId}
          />
        )}
      </div>

      {esClienteDueno && profesionalesContactados.length > 0 && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Reservar cita</h2>
          <ReservaCitaForm
            solicitudId={solicitud.id}
            profesionales={profesionalesContactados.map((p) => ({
              id: p.id,
              nombre: p.nombre,
            }))}
          />
        </div>
      )}

      {esClienteDueno && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold">
            {solicitud.estado === "abierta"
              ? "Marcar como completada y valorar"
              : "Tu valoración"}
          </h2>

          {solicitud.estado === "abierta" ? (
            profesionalesContactados.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Todavía no hay ningún profesional en el hilo para valorar.
              </p>
            ) : (
              <ValoracionForm
                solicitudId={solicitud.id}
                profesionales={profesionalesContactados.map((p) => ({
                  id: p.id,
                  nombre: p.nombre,
                }))}
              />
            )
          ) : valoracion ? (
            <div className="rounded-xl border border-black/10 p-6 dark:border-white/15">
              <p className="font-medium">
                {valoracion.profesionales?.nombre ?? "Profesional"}
                {" · "}
                {valoracion.puntuacion} {valoracion.puntuacion === 1 ? "estrella" : "estrellas"}
              </p>
              {valoracion.comentario && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {valoracion.comentario}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No dejaste ninguna valoración para esta solicitud.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
