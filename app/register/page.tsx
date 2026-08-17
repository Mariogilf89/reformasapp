"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <form
        action={action}
        className="w-full max-w-sm flex flex-col gap-4 rounded-xl border border-black/10 p-8 dark:border-white/15"
      >
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium mb-1">Tipo de cuenta</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="cliente" defaultChecked />
            Cliente
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="profesional" />
            Profesional
          </label>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
          />
        </div>

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
            minLength={8}
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
          {pending ? "Creando cuenta..." : "Registrarse"}
        </button>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
