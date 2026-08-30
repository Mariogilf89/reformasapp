"use client";

import { useActionState, useRef, useEffect } from "react";
import { enviarMensaje } from "@/app/actions/mensajes";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
    <Card className="p-6">
      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="solicitud_id" value={solicitudId} />
        {destinatarioId && (
          <input type="hidden" name="destinatario_id" value={destinatarioId} />
        )}

        {paraProfesional && (
          <p className="text-sm text-neutral-600">
            Escribiendo a{" "}
            <span className="font-medium text-neutral-900">
              {paraProfesional}
            </span>
          </p>
        )}

        <Label htmlFor="texto">Enviar un mensaje</Label>
        <Textarea ref={textareaRef} id="texto" name="texto" required rows={3} />

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </Card>
  );
}
