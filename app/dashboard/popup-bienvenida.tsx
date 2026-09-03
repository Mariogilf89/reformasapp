"use client";

import { useState } from "react";
import Image from "next/image";
import { marcarPopupBienvenidaVisto } from "@/app/actions/popup-bienvenida";
import { IconCheck } from "@/components/ui/icon-check";
import { CalendarioMockup } from "./calendario-mockup";

const BENEFICIOS_SLIDE_1 = [
  "Sin coste por cada contacto — pagas una cuota fija, no por lead.",
  "Eliges solo las solicitudes que encajan con tu zona y tu horario.",
  "Los clientes también pueden contactarte directamente a ti, no solo a través de solicitudes.",
  "Tu perfil con reseñas reales de trabajos anteriores, para generar confianza desde el primer contacto.",
];

const BENEFICIOS_SLIDE_2 = [
  "Olvídate de las hojas de papel con citas tachadas y cambios a mano.",
  "Un único calendario con las citas que te llegan por Faenia y las que añades tú mismo.",
  "Simple e intuitivo: lo gestionas desde el móvil en segundos.",
  "Sincronízalo con tu Google Calendar si ya usas uno, y recibe recordatorios para que no se te pase ninguna cita.",
];

function ListaBeneficios({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((texto) => (
        <li key={texto} className="flex items-start gap-2.5 text-sm text-neutral-700">
          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          <span>{texto}</span>
        </li>
      ))}
    </ul>
  );
}

function Slide1() {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="order-1 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-neutral-900">
          Recibe trabajos cerca de ti
        </h2>
        <ListaBeneficios items={BENEFICIOS_SLIDE_1} />
      </div>
      <div className="order-2 relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-neutral-200">
        <Image
          src="/images/reformista-taladro.jpg"
          alt="Profesional trabajando en una reforma"
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="order-2 flex items-center justify-center md:order-1">
        <CalendarioMockup />
      </div>
      <div className="order-1 flex flex-col gap-4 md:order-2">
        <h2 className="text-2xl font-semibold text-neutral-900">
          Tu agenda, sin líos
        </h2>
        <ListaBeneficios items={BENEFICIOS_SLIDE_2} />
      </div>
    </div>
  );
}

function Slide3() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-2xl font-semibold text-neutral-900">
        Elige el plan que mejor te encaja
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5">
          <p className="font-semibold text-neutral-900">Gratis</p>
          <p className="text-2xl font-semibold text-neutral-900">0€</p>
          <p className="text-sm text-neutral-600">
            Acceso a la plataforma y recepción de solicitudes.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5">
          <p className="font-semibold text-neutral-900">Simple</p>
          <p className="text-2xl font-semibold text-neutral-900">
            19,90€<span className="text-sm font-normal text-neutral-500">/mes</span>
          </p>
          <p className="text-sm text-neutral-600">Funcionalidades ampliadas.</p>
        </div>

        <div className="relative flex flex-col gap-3 rounded-xl border-2 border-primary-600 bg-primary-50/40 p-5 sm:-translate-y-2 sm:shadow-lg">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
            Recomendado
          </span>
          <p className="font-semibold text-neutral-900">Completo</p>
          <p className="text-2xl font-semibold text-neutral-900">
            49,90€<span className="text-sm font-normal text-neutral-500">/mes</span>
          </p>
          <p className="text-sm text-neutral-600">
            Gestión de calendario completa: agenda, Google Calendar y recordatorios.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        El precio puede variar si se incluye facturación.
      </p>
    </div>
  );
}

const TOTAL_SLIDES = 3;

/**
 * Pop-up de bienvenida (3 diapositivas, carrusel con flechas) que se
 * enseña la primera vez que el profesional entra a /dashboard, antes del
 * tour del calendario. onClose lo llama tanto la X como el clic fuera; el
 * padre (CalendarioCitas) decide qué pasa después (lanzar el tour si
 * también está por ver).
 */
export function PopupBienvenida({ onClose }: { onClose: () => void }) {
  const [indice, setIndice] = useState(0);

  function cerrar() {
    marcarPopupBienvenidaVisto();
    onClose();
  }

  function anterior() {
    setIndice((i) => Math.max(0, i - 1));
  }

  function siguiente() {
    setIndice((i) => Math.min(TOTAL_SLIDES - 1, i + 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={cerrar}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 cursor-pointer text-xl text-neutral-500 hover:text-neutral-900"
        >
          ×
        </button>

        {indice > 0 && (
          <button
            type="button"
            onClick={anterior}
            aria-label="Diapositiva anterior"
            className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-100 sm:-left-4"
          >
            ‹
          </button>
        )}
        {indice < TOTAL_SLIDES - 1 && (
          <button
            type="button"
            onClick={siguiente}
            aria-label="Siguiente diapositiva"
            className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-100 sm:-right-4"
          >
            ›
          </button>
        )}

        <div className="mt-2">
          {indice === 0 && <Slide1 />}
          {indice === 1 && <Slide2 />}
          {indice === 2 && <Slide3 />}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === indice ? "w-5 bg-primary-600" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
