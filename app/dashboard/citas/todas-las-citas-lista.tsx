"use client";

import { useState } from "react";
import Link from "next/link";
import { TIPOS_CITA, type TipoCita } from "@/lib/citas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type CitaTodas = {
  id: string;
  solicitud_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tipo: TipoCita | null;
  origen_externo: boolean;
  titulo_externo: string | null;
  contacto_nombre: string | null;
  nombreCliente: string | null;
  telefonoCliente: string | null;
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function nombreContacto(cita: CitaTodas) {
  if (cita.origen_externo) {
    return cita.contacto_nombre || cita.titulo_externo || "Bloqueo externo";
  }
  return cita.nombreCliente || "Cliente";
}

type Orden = "fecha" | "contacto";
type FiltroTipo = "todas" | "faenia" | "externa";

export function TodasLasCitasLista({ citas }: { citas: CitaTodas[] }) {
  const [orden, setOrden] = useState<Orden>("fecha");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todas");

  const filtradas = citas.filter((cita) => {
    if (filtroTipo === "faenia") return !cita.origen_externo;
    if (filtroTipo === "externa") return cita.origen_externo;
    return true;
  });

  const ordenadas = [...filtradas].sort((a, b) => {
    if (orden === "contacto") {
      return nombreContacto(a).localeCompare(nombreContacto(b), "es");
    }
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    return a.hora_inicio < b.hora_inicio ? -1 : a.hora_inicio > b.hora_inicio ? 1 : 0;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="orden-citas">Ordenar por</Label>
          <Select
            id="orden-citas"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
          >
            <option value="fecha">Fecha</option>
            <option value="contacto">Contacto</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-tipo-citas">Tipo</Label>
          <Select
            id="filtro-tipo-citas"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
          >
            <option value="todas">Todas</option>
            <option value="faenia">FAENIA</option>
            <option value="externa">Externa</option>
          </Select>
        </div>
      </div>

      {ordenadas.length === 0 ? (
        <p className="text-neutral-600">
          Aquí verás tus citas confirmadas y las que crees manualmente. Empieza{" "}
          <Link href="/dashboard" className="font-medium text-primary-700 hover:underline">
            creando una cita externa
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {ordenadas.map((cita) => {
            const tipoLabel = cita.origen_externo
              ? "Bloqueo externo"
              : TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? cita.tipo;

            return (
              <Card key={cita.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                      {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {cita.origen_externo ? cita.titulo_externo : `Con ${cita.nombreCliente ?? "Cliente"}`}
                      {" · "}
                      {tipoLabel}
                    </p>
                  </div>
                  <Badge status="confirmada">confirmada</Badge>
                </div>

                {cita.origen_externo ? (
                  cita.contacto_nombre && (
                    <p className="mt-3 text-sm text-neutral-600">
                      Contacto: {cita.contacto_nombre}
                    </p>
                  )
                ) : (
                  <>
                    <Link
                      href={`/dashboard/solicitudes/${cita.solicitud_id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
                    >
                      Ver solicitud
                    </Link>
                    <p className="mt-3 text-sm text-neutral-600">
                      {cita.telefonoCliente
                        ? `Teléfono de contacto: ${cita.telefonoCliente}`
                        : "El cliente no ha añadido un teléfono de contacto todavía."}
                    </p>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
