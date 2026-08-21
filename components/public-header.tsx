import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-primary-700 dark:text-primary-400">
          ReformasApp
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
          >
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonClassName()}>
            Registrarse
          </Link>
        </div>
      </div>
    </header>
  );
}
