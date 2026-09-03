"use client";

import { useEffect, useRef } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./calendario-tour.css";
import { marcarCalendarioTourVisto } from "@/app/actions/calendario-tour";

const POPOVER_CLASS = "faenia-tour-popover";

/**
 * Tour guiado del calendario del profesional (driver.js). Dos de los pasos
 * (crear cita externa y su checkbox "¿Se repite?") abren de verdad el
 * formulario real en vez de señalar un elemento inventado: se apoyan en
 * `waitForElement` (sondea el DOM hasta que aparece) para esperar a que
 * React monte el modal tras cambiar el estado. El resto de acciones del
 * calendario que piden señalar (arrastrar, duplicar, editar "solo esta
 * cita"/"toda la serie") no tienen ningún elemento real que mostrar la
 * primera vez que se ve el tour -el calendario está vacío-, así que ese
 * paso es una tarjeta centrada sin spotlight en vez de inventarse una cita
 * de mentira.
 */
export function useCalendarioTour({
  tourVistoInicial,
  onAbrirFormExterna,
  onCerrarFormExterna,
}: {
  tourVistoInicial: boolean;
  onAbrirFormExterna: () => void;
  onCerrarFormExterna: () => void;
}) {
  const driverRef = useRef<Driver | null>(null);

  function lanzarTour() {
    driverRef.current?.destroy();

    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Entendido",
      popoverClass: POPOVER_CLASS,
      waitForElement: 2000,
      // Cierra/salta se tratan igual (sin distinguir "completado" de
      // "saltado"): en cualquier caso se marca visto y se cierra el
      // formulario de cita externa si el tour lo dejó abierto.
      onDestroyStarted: () => {
        onCerrarFormExterna();
        marcarCalendarioTourVisto();
        driverObj.destroy();
      },
      steps: [
        {
          element: '[data-tour="calendario-grid"]',
          popover: {
            title: "Tu agenda",
            description:
              "Aquí verás tus citas confirmadas con clientes y tus propios bloqueos (citas externas).",
          },
        },
        {
          element: '[data-tour="selector-vista"]',
          popover: {
            title: "Día, semana o mes",
            description:
              "Cambia entre vista de día, semana o mes según lo que necesites planificar.",
          },
        },
        {
          element: '[data-tour="anadir-cita-externa"]',
          popover: {
            title: "Crea una cita externa",
            description:
              'Bloquea un hueco en tu calendario para un trabajo ya acordado fuera de la app. Pulsa "Siguiente" para ver el formulario.',
            onNextClick: (_element, _step, opts) => {
              onAbrirFormExterna();
              opts.driver.moveNext();
            },
          },
        },
        {
          element: '[data-tour="repetir-checkbox"]',
          popover: {
            title: "¿Se repite?",
            description:
              "Márcala para crear la misma cita en varios días de la semana, hasta la fecha que elijas.",
            onPrevClick: (_element, _step, opts) => {
              onCerrarFormExterna();
              opts.driver.movePrevious();
            },
            onNextClick: (_element, _step, opts) => {
              onCerrarFormExterna();
              opts.driver.moveNext();
            },
          },
        },
        {
          popover: {
            title: "Mover, duplicar y repetir",
            description:
              "Arrastra una cita para cambiarla de día u hora, o pulsa sobre ella para duplicarla. Si es una cita repetida, puedes editar o eliminar solo esa fecha o toda la serie.",
            onPrevClick: (_element, _step, opts) => {
              onAbrirFormExterna();
              opts.driver.movePrevious();
            },
          },
        },
        {
          element: '[data-tour="conectar-google-calendar"]',
          popover: {
            title: "Conecta Google Calendar",
            description: "Sincroniza tus citas confirmadas con tu Google Calendar personal.",
          },
        },
        {
          element: '[data-tour="como-funciona"]',
          popover: {
            title: "¿Necesitas verlo otra vez?",
            description: "Vuelve a lanzar este tour cuando quieras desde aquí.",
          },
        },
      ],
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }

  useEffect(() => {
    if (!tourVistoInicial) {
      lanzarTour();
    }
    return () => {
      driverRef.current?.destroy();
    };
    // Solo debe autolanzarse una vez, en el primer montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { lanzarTour };
}
