import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_CITA, type TipoCita } from "@/lib/citas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CitaCanceladaProfesional = {
  id: string;
  solicitud_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita;
  comentario: string | null;
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function CitasCanceladasPage() {
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

  if (!perfilProfesional) {
    redirect("/dashboard/citas");
  }

  const { data: citasCanceladasProfesional } = await supabase
    .from("citas")
    .select("id, solicitud_id, fecha, hora_inicio, hora_fin, tipo, comentario")
    .eq("profesional_id", perfilProfesional.id)
    .eq("estado", "cancelada")
    .eq("origen_externo", false)
    .order("fecha", { ascending: false })
    .returns<CitaCanceladaProfesional[]>();

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-neutral-900">Citas canceladas</h2>

      {(citasCanceladasProfesional ?? []).length === 0 ? (
        <p className="text-neutral-600">No tienes ninguna cita cancelada.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {(citasCanceladasProfesional ?? []).map((cita) => {
            const tipoLabel = TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;
            return (
              <Card key={cita.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                      {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Con Cliente · {tipoLabel}
                    </p>
                  </div>
                  <Badge status="cancelada">cancelada</Badge>
                </div>
                <Link
                  href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
                >
                  Ver solicitud
                </Link>

                {cita.comentario && (
                  <p className="mt-3 text-sm text-neutral-600">
                    &quot;{cita.comentario}&quot;
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
