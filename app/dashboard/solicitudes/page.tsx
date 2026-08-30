import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolicitudForm } from "./solicitud-form";
import { BorrarSolicitudForm } from "./borrar-solicitud-form";

type Solicitud = {
  id: string;
  categoria: Categoria;
  zona: string;
  descripcion: string;
  estado: "abierta" | "cerrada";
  creado_en: string;
};

type ProfesionalMatch = {
  id: string;
  nombre: string;
  zona: string;
  descripcion: string;
};

export default async function SolicitudesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "cliente") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600">
          Esta página es solo para cuentas de tipo cliente.
        </p>
      </div>
    );
  }

  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select("id, categoria, zona, descripcion, estado, creado_en")
    .eq("cliente_id", user.id)
    .order("creado_en", { ascending: false })
    .returns<Solicitud[]>();

  const abiertas = (solicitudes ?? []).filter((s) => s.estado === "abierta");

  const solicitudIds = (solicitudes ?? []).map((s) => s.id);

  const { data: mensajesDeSolicitudes } = solicitudIds.length
    ? await supabase
        .from("mensajes")
        .select("solicitud_id")
        .in("solicitud_id", solicitudIds)
        .returns<{ solicitud_id: string }[]>()
    : { data: [] as { solicitud_id: string }[] };

  const { data: citasDeSolicitudes } = solicitudIds.length
    ? await supabase
        .from("citas")
        .select("solicitud_id")
        .in("solicitud_id", solicitudIds)
        .returns<{ solicitud_id: string }[]>()
    : { data: [] as { solicitud_id: string }[] };

  const solicitudesConDatosAsociados = new Set<string>([
    ...(mensajesDeSolicitudes ?? []).map((m) => m.solicitud_id),
    ...(citasDeSolicitudes ?? []).map((c) => c.solicitud_id),
  ]);

  const matchesPorSolicitud = new Map<string, ProfesionalMatch[]>();

  await Promise.all(
    abiertas.map(async (solicitud) => {
      const { data: profesionales } = await supabase
        .from("profesionales")
        .select("id, nombre, zona, descripcion")
        .contains("categorias", [solicitud.categoria])
        .returns<ProfesionalMatch[]>();

      matchesPorSolicitud.set(solicitud.id, profesionales ?? []);
    })
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      <SolicitudForm />

      <div className="w-full max-w-lg flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Mis solicitudes
        </h2>

        {(solicitudes ?? []).length === 0 && (
          <p className="text-neutral-600">
            Todavía no has publicado ninguna solicitud.
          </p>
        )}

        {(solicitudes ?? []).map((solicitud) => (
          <Card key={solicitud.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutral-900">
                  {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.label ??
                    solicitud.categoria}
                  {" · "}
                  {solicitud.zona}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {solicitud.descripcion}
                </p>
              </div>
              <Badge status={solicitud.estado}>{solicitud.estado}</Badge>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <Link
                href={`/dashboard/solicitudes/${solicitud.id}`}
                className="text-sm font-medium text-primary-700 hover:underline"
              >
                Ver detalle y mensajes
              </Link>
              <BorrarSolicitudForm
                solicitudId={solicitud.id}
                tieneDatosAsociados={solicitudesConDatosAsociados.has(solicitud.id)}
              />
            </div>

            {solicitud.estado === "abierta" && (
              <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
                <p className="text-sm font-medium text-neutral-900">
                  Profesionales que coinciden
                </p>
                {(matchesPorSolicitud.get(solicitud.id) ?? []).length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    Todavía no hay profesionales de esta categoría.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {matchesPorSolicitud.get(solicitud.id)!.map((profesional) => (
                      <li key={profesional.id}>
                        <div className="flex items-start justify-between gap-3 rounded-lg bg-neutral-50 p-3 text-sm">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {profesional.nombre}
                            </p>
                            <p className="text-neutral-600">
                              {profesional.zona}
                            </p>
                            <p className="text-neutral-600">
                              {profesional.descripcion}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/solicitudes/${solicitud.id}?contactar=${profesional.id}#mensaje`}
                            className="shrink-0 font-medium text-primary-700 hover:underline"
                          >
                            Contactar
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
