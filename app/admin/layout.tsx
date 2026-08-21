import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-lg font-semibold text-primary-700 dark:text-primary-400"
          >
            ReformasApp · Admin
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              Volver al panel
            </Link>
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
