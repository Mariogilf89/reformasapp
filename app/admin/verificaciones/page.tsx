import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DOCUMENTOS_IDENTIDAD_BUCKET } from "@/lib/profesionales";
import { aprobarVerificacion, rechazarVerificacion } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfesionalPendiente = {
  id: string;
  nombre: string;
  documento_identidad_url: string;
};

const SEGUNDOS_VALIDEZ_URL_FIRMADA = 60 * 5;

export default async function VerificacionesAdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Esta página es solo para administradores.
        </p>
      </div>
    );
  }

  const { data: pendientes } = await supabase
    .from("profesionales")
    .select("id, nombre, documento_identidad_url")
    .eq("verificado", false)
    .not("documento_identidad_url", "is", null)
    .order("actualizado_en", { ascending: true })
    .returns<ProfesionalPendiente[]>();

  const pendientesConUrl = await Promise.all(
    (pendientes ?? []).map(async (profesional) => {
      const { data } = await supabase.storage
        .from(DOCUMENTOS_IDENTIDAD_BUCKET)
        .createSignedUrl(profesional.documento_identidad_url, SEGUNDOS_VALIDEZ_URL_FIRMADA);
      return { ...profesional, urlFirmada: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Verificaciones pendientes
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Profesionales que han enviado su documento de identidad y esperan revisión.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        {pendientesConUrl.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No hay verificaciones pendientes.
          </p>
        )}

        {pendientesConUrl.map((profesional) => (
          <Card
            key={profesional.id}
            className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              {profesional.urlFirmada ? (
                <a href={profesional.urlFirmada} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profesional.urlFirmada}
                    alt={`Documento de identidad de ${profesional.nombre}`}
                    className="h-32 w-32 rounded-md border border-neutral-200 object-cover transition-opacity hover:opacity-80 dark:border-neutral-800"
                  />
                </a>
              ) : (
                <div className="h-32 w-32 rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800" />
              )}
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {profesional.nombre}
              </p>
            </div>

            <div className="flex gap-2">
              <form action={aprobarVerificacion}>
                <input type="hidden" name="profesional_id" value={profesional.id} />
                <Button type="submit" size="xs">
                  Aprobar
                </Button>
              </form>
              <form action={rechazarVerificacion}>
                <input type="hidden" name="profesional_id" value={profesional.id} />
                <input
                  type="hidden"
                  name="documento_ruta"
                  value={profesional.documento_identidad_url}
                />
                <Button type="submit" variant="danger" size="xs">
                  Rechazar
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
