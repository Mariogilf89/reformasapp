"use client";

import { useActionState, useRef, useEffect } from "react";
import { enviarMensaje } from "@/app/actions/mensajes";

export function MensajeForm({
  solicitudId,
  paraProfesional,
  destinatarioId,
}: {
  solicitudId: string;
  paraProfesional?: string;
  destinatarioId?: string;
}) {
  const [state, action, pending] = useActionState(enviarMensaje, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  useEffect(() => {
    if (paraProfesional) {
      textareaRef.current?.focus();
    }
  }, [paraProfesional]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <input type="hidden" name="solicitud_id" value={solicitudId} />
      {destinatarioId && (
        <input type="hidden" name="destinatario_id" value={destinatarioId} />
      )}

      {paraProfesional && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Escribiendo a <span className="font-medium text-foreground">{paraProfesional}</span>
        </p>
      )}

      <label htmlFor="texto" className="text-sm font-medium">
        Enviar un mensaje
      </label>
      <textarea
        ref={textareaRef}
        id="texto"
        name="texto"
        required
        rows={3}
        className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
      />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
