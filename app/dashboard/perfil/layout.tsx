import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { PerfilBreadcrumb } from "./perfil-breadcrumb";
import { PerfilSidebar } from "./perfil-sidebar";

export default async function PerfilLayout({ children }: LayoutProps<"/dashboard/perfil">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "profesional") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <PerfilBreadcrumb />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:items-start">
          <PerfilSidebar />
          <Card className="p-6 sm:p-8">{children}</Card>
        </div>
      </div>
    </div>
  );
}
