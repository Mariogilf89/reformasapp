import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_CITA, type TipoCita } from "@/lib/citas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AceptarCitaForm } from "../aceptar-cita-form";
import { ProponerHorarioForm } from "../proponer-horario-form";
import { AnularCitaProfesionalForm } from "../anular-cita-profesional-form";

type CitaPendienteProfesional = {
  id: string;
  solicitud_id: string;
  fecha: string;
  hora_inicio: string;
  tipo: TipoCita;
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function CitasPendientesPage() {
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

  // Solo las que envía el cliente (propuesto_por="cliente") y no son
  // bloqueos externos: mismo filtro que tenía esta sección antes de moverse
  // aquí, sin cambios de lógica.
  const { data: citasPendientesProfesional } = await supabase
    .from("citas")
    .select("id, solicitud_id, fecha, hora_inicio, tipo")
    .eq("profesional_id", perfilProfesional.id)
    .eq("estado", "pendiente")
    .eq("propuesto_por", "cliente")
    .eq("origen_externo", false)
    .order("creado_en", { ascending: true })
    .returns<CitaPendienteProfesional[]>();

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-neutral-900">
        Citas pendientes de confirmar
      </h2>

      {(citasPendientesProfesional ?? []).length === 0 ? (
        <p className="text-neutral-600">
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
                    <p className="font-medium text-neutral-900">
                      {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Con Cliente · {tipoLabel}
                    </p>
                  </div>
                  <Badge status="pendiente">pendiente</Badge>
                </div>
                <Link
                  href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
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
  );
}
