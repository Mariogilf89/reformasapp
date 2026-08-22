import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role ?? "cliente";

  const navLinks = [
    { href: "/dashboard", label: "Panel" },
    ...(role === "profesional"
      ? [{ href: "/dashboard/perfil", label: "Perfil" }]
      : []),
    ...(role === "cliente"
      ? [{ href: "/dashboard/solicitudes", label: "Mis solicitudes" }]
      : []),
    { href: "/dashboard/citas", label: "Mis citas" },
    {
      href: "/dashboard/verificar-telefono",
      label: role === "profesional" ? "Verificar teléfono" : "Añade tu teléfono",
    },
    ...(role === "profesional"
      ? [{ href: "/dashboard/solicitudes-disponibles", label: "Solicitudes disponibles" }]
      : []),
    ...(role === "admin"
      ? [{ href: "/admin/verificaciones", label: "Verificaciones" }]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-lg font-semibold text-primary-700 dark:text-primary-400"
          >
            ReformasApp
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action={signOut}>
            <Button type="submit" variant="secondary">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
