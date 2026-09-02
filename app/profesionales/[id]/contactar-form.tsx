"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { crearSolicitudYContactar } from "@/app/actions/solicitudes";
import { buscarCodigoPostal } from "@/app/actions/codigos-postales";
import { PROVINCIAS } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Datos ya conocidos si quien contacta ya tiene sesión de cliente activa
 * (de una solicitud anterior): en ese caso no se le vuelven a pedir. */
export type ClientePrecargado = { nombre: string; email: string; telefono: string };

export function ContactarForm({
  profesionalId,
  fechaElegida,
  horaInicioElegida,
  modoElegido,
  provinciaElegida,
  clientePrecargado,
}: {
  profesionalId: string;
  fechaElegida?: string;
  horaInicioElegida?: string;
  // Vienen de la búsqueda en /profesionales (provincia/modo del filtro), si
  // el cliente llegó desde ahí; si no, quedan sin definir.
  modoElegido?: string;
  provinciaElegida?: string;
  clientePrecargado?: ClientePrecargado;
}) {
  const proponeCita = Boolean(fechaElegida && horaInicioElegida);
  const [mostrar, setMostrar] = useState(proponeCita);
  const [state, action, pending] = useActionState(crearSolicitudYContactar, undefined);

  const [cp, setCp] = useState("");
  // Último CP ya resuelto (con su resultado, o null si no hubo match) —
  // "buscando"/"ciudad encontrada" se derivan comparando con el cp actual
  // en vez de guardarse aparte, para no tener que hacer setState síncrono
  // al arrancar el efecto (dispara el lint react-hooks/set-state-in-effect).
  const [resultadoCp, setResultadoCp] = useState<{
    cp: string;
    datos: { municipio: string; provincia: string } | null;
  } | null>(null);

  useEffect(() => {
    if (!/^\d{5}$/.test(cp)) {
      return;
    }
    let cancelado = false;
    const timeout = setTimeout(async () => {
      const datos = await buscarCodigoPostal(cp);
      if (!cancelado) {
        setResultadoCp({ cp, datos });
      }
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [cp]);

  const buscandoCp = cp.length === 5 && resultadoCp?.cp !== cp;
  const ciudadCp = resultadoCp?.cp === cp ? resultadoCp.datos : null;

  if (!mostrar) {
    return (
      <Button type="button" onClick={() => setMostrar(true)}>
        Contactar
      </Button>
    );
  }

  return (
    <Card className="w-full p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="profesional_id" value={profesionalId} />
        {modoElegido && <input type="hidden" name="modo_tiempo" value={modoElegido} />}
        {provinciaElegida && <input type="hidden" name="provincia" value={provinciaElegida} />}

        <h2 className="text-lg font-semibold text-neutral-900">
          Cuéntale al profesional lo que necesitas
        </h2>

        {proponeCita && (
          <>
            <input type="hidden" name="fecha" value={fechaElegida} />
            <input type="hidden" name="hora_inicio" value={horaInicioElegida} />
            <p className="text-sm text-neutral-600">
              Además de tu solicitud, le vas a proponer una cita:{" "}
              <span className="font-medium text-neutral-900">
                {formatearFecha(fechaElegida!)} a las {horaInicioElegida}
              </span>
              .
            </p>
          </>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="descripcion">¿Qué necesitas?</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            required
            rows={3}
            placeholder="Cuéntale al profesional qué necesitas"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="codigo_postal">Código postal</Label>
          <Input
            id="codigo_postal"
            name="codigo_postal"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            required
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Ej. 28001"
          />
          {cp.length === 5 && buscandoCp && (
            <p className="text-xs text-neutral-500">Buscando...</p>
          )}
          {cp.length === 5 && !buscandoCp && ciudadCp && (
            <p className="text-xs text-neutral-600">
              {ciudadCp.municipio},{" "}
              {PROVINCIAS.find((p) => p.value === ciudadCp.provincia)?.label ?? ciudadCp.provincia}
            </p>
          )}
          {cp.length === 5 && !buscandoCp && !ciudadCp && (
            <p className="text-xs text-neutral-500">
              No hemos encontrado esa ciudad, pero puedes continuar igualmente.
            </p>
          )}
        </div>

        {clientePrecargado ? (
          <>
            <input type="hidden" name="nombre" value={clientePrecargado.nombre} />
            <input type="hidden" name="email" value={clientePrecargado.email} />
            <input type="hidden" name="telefono" value={clientePrecargado.telefono} />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" type="text" required />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" required />
            </div>

            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="acceptTerms"
                required
                className="mt-0.5 accent-primary-600"
              />
              <span>
                Al enviar, aceptas los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Términos
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Política de Privacidad
                </Link>
                .
              </span>
            </label>
          </>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar solicitud"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setMostrar(false)} disabled={pending}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
