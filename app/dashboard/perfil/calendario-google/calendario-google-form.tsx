"use client";

import { useActionState } from "react";
import { desconectarGoogleCalendar } from "@/app/actions/google-calendar";
import { Button, buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconGoogle } from "@/components/ui/icon-google";

export function CalendarioGoogleForm({
  conectado,
  googleEmail,
  errorInicial,
}: {
  conectado: boolean;
  googleEmail: string | null;
  errorInicial: string | null;
}) {
  const [state, action, pending] = useActionState(desconectarGoogleCalendar, undefined);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div className="flex items-center gap-3">
        {conectado ? (
          <Badge status="confirmada">Conectado</Badge>
        ) : (
          <Badge status="cerrada">No conectado</Badge>
        )}
      </div>

      <p className="text-sm text-neutral-600">
        Conecta tu Google Calendar personal para que tus citas confirmadas en Faenia aparezcan
        automáticamente en un calendario dedicado (&ldquo;Faenia&rdquo;) de tu cuenta de Google.
        Solo se exportan citas: nada de tu Google Calendar se importa a Faenia.
      </p>

      {errorInicial && <p className="text-sm text-red-600">{errorInicial}</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {conectado ? (
        <form action={action} className="flex flex-col gap-2">
          {googleEmail && (
            <p className="text-sm text-neutral-600">Conectado como {googleEmail}.</p>
          )}
          <Button type="submit" variant="danger" disabled={pending} className="w-fit">
            {pending ? "Desconectando..." : "Desconectar Google Calendar"}
          </Button>
        </form>
      ) : (
        <a
          href="/api/google-calendar/conectar"
          className={buttonClassName("secondary", "sm", "w-fit gap-2")}
        >
          <IconGoogle className="h-4 w-4 shrink-0" />
          Conectar con Google Calendar
        </a>
      )}
    </div>
  );
}
