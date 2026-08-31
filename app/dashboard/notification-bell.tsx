"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { marcarNotificacionLeida, marcarTodasLeidas } from "@/app/actions/notificaciones";
import type { Notificacion } from "@/lib/notificaciones";

function tiempoRelativo(fechaISO: string) {
  const minutos = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (minutos < 1) return "ahora mismo";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export function NotificationBell({
  notificacionesIniciales,
}: {
  notificacionesIniciales: Notificacion[];
}) {
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [abierto, setAbierto] = useState(false);
  const [, startTransition] = useTransition();

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  function marcarLeida(id: string) {
    setNotificaciones((actuales) => actuales.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    startTransition(() => {
      marcarNotificacionLeida(id);
    });
  }

  function marcarTodas() {
    setNotificaciones((actuales) => actuales.map((n) => ({ ...n, leida: true })));
    startTransition(() => {
      marcarTodasLeidas();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Notificaciones"
        className="relative cursor-pointer rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
      >
        <span aria-hidden="true">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 p-3">
              <p className="text-sm font-medium text-neutral-900">
                Notificaciones
              </p>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="shrink-0 text-xs font-medium text-primary-700 hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notificaciones.length === 0 ? (
              <p className="p-4 text-sm text-neutral-600">
                No tienes notificaciones.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-neutral-200">
                {notificaciones.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.url ?? "/dashboard"}
                      onClick={() => {
                        setAbierto(false);
                        if (!n.leida) marcarLeida(n.id);
                      }}
                      className={
                        "block p-3 text-sm hover:bg-neutral-50 " +
                        (n.leida ? "" : "bg-primary-50/50")
                      }
                    >
                      <p className="font-medium text-neutral-900">{n.titulo}</p>
                      {n.cuerpo && (
                        <p className="mt-0.5 text-neutral-600">{n.cuerpo}</p>
                      )}
                      <p className="mt-1 text-xs text-neutral-500">{tiempoRelativo(n.creado_en)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
