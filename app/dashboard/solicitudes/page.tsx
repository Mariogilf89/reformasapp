import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { SolicitudForm } from "./solicitud-form";

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
        <p className="text-zinc-600 dark:text-zinc-400">
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
        <h2 className="text-xl font-semibold">Mis solicitudes</h2>

        {(solicitudes ?? []).length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Todavía no has publicado ninguna solicitud.
          </p>
        )}

        {(solicitudes ?? []).map((solicitud) => (
          <div
            key={solicitud.id}
            className="rounded-xl border border-black/10 p-6 dark:border-white/15"
          >
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

            <Link
              href={`/dashboard/solicitudes/${solicitud.id}`}
              className="mt-3 inline-block text-sm font-medium underline"
            >
              Ver detalle y mensajes
            </Link>

            {solicitud.estado === "abierta" && (
              <div className="mt-4 flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
                <p className="text-sm font-medium">Profesionales que coinciden</p>
                {(matchesPorSolicitud.get(solicitud.id) ?? []).length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Todavía no hay profesionales de esta categoría.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {matchesPorSolicitud.get(solicitud.id)!.map((profesional) => (
                      <li
                        key={profesional.id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-black/[.03] p-3 text-sm dark:bg-white/[.05]"
                      >
                        <div>
                          <p className="font-medium">{profesional.nombre}</p>
                          <p className="text-zinc-600 dark:text-zinc-400">{profesional.zona}</p>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            {profesional.descripcion}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/solicitudes/${solicitud.id}?contactar=${profesional.id}#mensaje`}
                          className="shrink-0 font-medium underline"
                        >
                          Contactar
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
