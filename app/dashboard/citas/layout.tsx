import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CitasSidebar } from "./citas-sidebar";

// Los tres sub-apartados (Todas / Pendientes / Canceladas) son un concepto
// exclusivo del profesional (recibe solicitudes de citas, gestiona su
// calendario). El cliente solo tiene su propio listado de citas reservadas,
// que vive igual que antes en /dashboard/citas sin sidebar ni pestañas.
export default async function CitasLayout({ children }: LayoutProps<"/dashboard/citas">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "profesional") {
    return (
      <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Mis citas</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:items-start">
          <CitasSidebar />
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
