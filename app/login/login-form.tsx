"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";

export function LoginForm({ justRegistered }: { justRegistered: boolean }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form
      action={action}
      className="w-full max-w-sm flex flex-col gap-4 rounded-xl border border-black/10 p-8 dark:border-white/15"
    >
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      {justRegistered && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Cuenta creada. Revisa tu email si se requiere confirmación, luego
          inicia sesión.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
