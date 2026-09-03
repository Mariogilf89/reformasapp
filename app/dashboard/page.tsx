import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  caducarCitasPendientes,
  obtenerCitasCalendario,
  obtenerCitasExternasPendientes,
  obtenerCitaPorId,
} from "@/app/actions/citas";
import { fechaISO, fechaLocal, inicioSemana, sumarDias } from "@/lib/fechas";
import type { Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { CabeceraProfesional } from "./cabecera-profesional";
import { CalendarioCitas } from "./calendario-citas";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const citaIdParam = typeof searchParams.citaId === "string" ? searchParams.citaId : undefined;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role ?? "cliente";
  const name = user.user_metadata?.full_name ?? user.email;

  if (role !== "profesional") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="flex flex-col items-center gap-2 px-10 py-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Hola, {name}
          </h1>
          <p className="text-neutral-600">
            Cuenta de tipo:{" "}
            <span className="font-medium text-neutral-900">{role}</span>
          </p>
          {role === "admin" && (
            <Link href="/admin/verificaciones" className={buttonClassName()}>
              Ir a verificaciones pendientes
            </Link>
          )}
        </Card>
      </div>
    );
  }

  await caducarCitasPendientes(supabase);

  const { data: perfil } = await supabase
    .from("profesionales")
    .select(
      "id, nombre, categorias, zona, verificado, calendario_hora_inicio, calendario_hora_fin, calendario_dia_inicio, calendario_dia_fin, calendario_tour_visto"
    )
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      nombre: string;
      categorias: Categoria[];
      zona: string;
      verificado: boolean;
      calendario_hora_inicio: number;
      calendario_hora_fin: number;
      calendario_dia_inicio: number;
      calendario_dia_fin: number;
      calendario_tour_visto: boolean;
    }>();

  if (!perfil) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="flex flex-col items-center gap-3 px-10 py-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Completa tu perfil profesional
          </h1>
          <p className="text-neutral-600">
            Necesitas rellenar tu perfil antes de ver tu panel y calendario.
          </p>
          <Link href="/dashboard/perfil" className={buttonClassName()}>
            Ir a mi perfil
          </Link>
        </Card>
      </div>
    );
  }

  const telefono = (user.user_metadata?.telefono as string | undefined) ?? null;
  const telefonoVerificado = user.user_metadata?.telefono_verificado === true;

  // Si venimos del enlace de una notificación (?citaId=...), el ancla del
  // calendario pasa a ser la semana de esa cita en vez de la semana actual,
  // para que el profesional no tenga que buscarla a mano. Se pide sin el
  // filtro "no cancelada" de obtenerCitasCalendario porque la notificación
  // puede apuntar a una cita ya cancelada.
  const citaDestacada = citaIdParam ? await obtenerCitaPorId(citaIdParam) : null;
  const hoy = new Date();
  const anchorInicial = citaDestacada?.fecha ? fechaLocal(citaDestacada.fecha) : hoy;
  const lunes = inicioSemana(anchorInicial);

  const [citasSemana, citasPendientesIniciales] = await Promise.all([
    obtenerCitasCalendario(fechaISO(lunes), fechaISO(sumarDias(lunes, 6))),
    obtenerCitasExternasPendientes(),
  ]);

  const citasIniciales =
    citaDestacada && !citasSemana.some((c) => c.id === citaDestacada.id)
      ? [...citasSemana, citaDestacada]
      : citasSemana;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <CabeceraProfesional
          nombre={perfil.nombre}
          categorias={perfil.categorias}
          zona={perfil.zona}
          verificado={perfil.verificado}
          telefono={telefono}
          telefonoVerificado={telefonoVerificado}
        />

        <CalendarioCitas
          citasIniciales={citasIniciales}
          citasPendientesIniciales={citasPendientesIniciales}
          anchorInicial={anchorInicial}
          citaIdInicial={citaDestacada?.id ?? null}
          horaInicioInicial={perfil.calendario_hora_inicio}
          horaFinInicial={perfil.calendario_hora_fin}
          diaInicioInicial={perfil.calendario_dia_inicio}
          diaFinInicial={perfil.calendario_dia_fin}
          tourVistoInicial={perfil.calendario_tour_visto}
        />
      </div>
    </div>
  );
}
