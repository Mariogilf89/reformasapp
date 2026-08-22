import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  caducarCitasPendientes,
  obtenerCitasCalendario,
  obtenerCitasExternasPendientes,
} from "@/app/actions/citas";
import { fechaISO, inicioSemana, sumarDias } from "@/lib/fechas";
import type { Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { CabeceraProfesional } from "./cabecera-profesional";
import { CalendarioCitas } from "./calendario-citas";

export default async function DashboardPage() {
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
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Hola, {name}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Cuenta de tipo:{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{role}</span>
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
    .select("id, nombre, categorias, zona, verificado, calendario_hora_inicio, calendario_hora_fin")
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      nombre: string;
      categorias: Categoria[];
      zona: string;
      verificado: boolean;
      calendario_hora_inicio: number;
      calendario_hora_fin: number;
    }>();

  if (!perfil) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="flex flex-col items-center gap-3 px-10 py-8">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Completa tu perfil profesional
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
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

  const hoy = new Date();
  const lunes = inicioSemana(hoy);
  const [citasIniciales, citasPendientesIniciales] = await Promise.all([
    obtenerCitasCalendario(fechaISO(lunes), fechaISO(sumarDias(lunes, 6))),
    obtenerCitasExternasPendientes(),
  ]);

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
          anchorInicial={hoy}
          horaInicioInicial={perfil.calendario_hora_inicio}
          horaFinInicial={perfil.calendario_hora_fin}
        />
      </div>
    </div>
  );
}
