import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { obtenerEstadoGoogleCalendar } from "@/app/actions/google-calendar";
import { CalendarioGoogleForm } from "./calendario-google-form";

export default async function CalendarioGooglePage(
  props: PageProps<"/dashboard/perfil/calendario-google">
) {
  const searchParams = await props.searchParams;
  const errorParam = searchParams.error;
  const error = typeof errorParam === "string" ? errorParam : null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estado = await obtenerEstadoGoogleCalendar();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-900">Google Calendar</h2>
      <CalendarioGoogleForm
        conectado={estado.conectado}
        googleEmail={estado.googleEmail}
        errorInicial={error}
      />
    </div>
  );
}
