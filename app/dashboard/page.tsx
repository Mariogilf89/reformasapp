import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";

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
