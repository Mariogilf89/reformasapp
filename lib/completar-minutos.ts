"use client";

import { useRef, type KeyboardEvent, type FocusEvent } from "react";

/**
 * Para inputs type="time": si el usuario solo teclea la hora y no toca los
 * minutos, el input se queda "incompleto" (su .value es "" hasta que también
 * se rellenan los minutos), obligando a escribirlos a mano cada vez. Este
 * hook detecta ese caso al salir del campo (blur) y completa los minutos a
 * "00".
 *
 * El navegador no expone la hora tecleada mientras el campo está incompleto
 * (input.value devuelve "" mientras falten los minutos), así que hay que
 * llevar la cuenta de los dígitos de la hora nosotros mismos a partir de las
 * pulsaciones, replicando cuándo el propio campo nativo da la hora por
 * completa: con un primer dígito 3-9 (hora de un solo dígito) o con dos
 * dígitos.
 *
 * `aplicar` recibe el valor completado ("HH:00") para inputs controlados
 * (value + onChange); si no se indica, se escribe directamente en el input
 * (uso con defaultValue, sin control de React).
 */
export function useCompletarMinutos(aplicar?: (valor: string) => void) {
  const digitosHora = useRef("");
  const horaCompleta = useRef(false);

  function onFocus() {
    digitosHora.current = "";
    horaCompleta.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" || e.key === "Delete") {
      digitosHora.current = "";
      horaCompleta.current = false;
      return;
    }
    if (!/^[0-9]$/.test(e.key) || e.currentTarget.value !== "") return;

    if (digitosHora.current.length === 0) {
      digitosHora.current = e.key;
      if (Number(e.key) >= 3) horaCompleta.current = true;
    } else if (digitosHora.current.length === 1 && !horaCompleta.current) {
      digitosHora.current += e.key;
      horaCompleta.current = true;
    }
  }

  function onBlur(e: FocusEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (input.value === "" && input.validity.badInput && digitosHora.current) {
      const horaCompletada = `${digitosHora.current.padStart(2, "0")}:00`;
      if (aplicar) {
        aplicar(horaCompletada);
      } else {
        input.value = horaCompletada;
      }
    }
    digitosHora.current = "";
    horaCompleta.current = false;
  }

  return { onFocus, onKeyDown, onBlur };
}
