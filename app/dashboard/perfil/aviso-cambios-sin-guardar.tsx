"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilProfesional } from "@/app/actions/profesionales";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PERFIL_FORM_ID } from "./constants";

// El formulario del perfil es uno solo (form="perfil-form"), pero sus campos
// viven repartidos en varias tarjetas/componentes que no comparten árbol DOM
// (ver constants.ts). new FormData(form) sí los recoge a todos porque el
// navegador asocia los campos por el atributo `form`, no por posición en el
// DOM, así que comparar dos snapshots serializados basta para saber si hay
// cambios reales.
function serializarFormulario(form: HTMLFormElement): string {
  const datos = new FormData(form);
  const entradas: [string, string][] = [];
  for (const [clave, valor] of datos.entries()) {
    if (typeof valor === "string") entradas.push([clave, valor]);
  }
  return JSON.stringify(entradas);
}

export function AvisoCambiosSinGuardar() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const valorInicialRef = useRef<string | null>(null);
  const destinoPendienteRef = useRef<string | null>(null);

  const [hayCambios, setHayCambios] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const recalcular = useCallback(() => {
    const form = formRef.current;
    if (!form || valorInicialRef.current === null) return;
    setHayCambios(serializarFormulario(form) !== valorInicialRef.current);
  }, []);

  // Detecta cambios en cualquier campo del formulario (descripción,
  // categorías, provincias, zona), aunque vivan en tarjetas separadas. Los
  // inputs/textarea nativos disparan "input"; las chips de categorías y
  // provincias se añaden/quitan como nodos del DOM (hidden inputs), así que
  // hace falta un MutationObserver para detectarlas.
  useEffect(() => {
    const form = document.getElementById(PERFIL_FORM_ID) as HTMLFormElement | null;
    if (!form) return;
    formRef.current = form;
    valorInicialRef.current = serializarFormulario(form);

    const observer = new MutationObserver(recalcular);
    observer.observe(form, { childList: true, subtree: true });
    form.addEventListener("input", recalcular);
    form.addEventListener("change", recalcular);

    return () => {
      observer.disconnect();
      form.removeEventListener("input", recalcular);
      form.removeEventListener("change", recalcular);
    };
  }, [recalcular]);

  // Aviso nativo al cerrar la pestaña, recargar o escribir otra URL. El
  // navegador no permite personalizar este texto.
  useEffect(() => {
    if (!hayCambios) return;

    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hayCambios]);

  // Intercepta clics en enlaces internos (menú del dashboard u otro enlace
  // cualquiera) mientras haya cambios sin guardar, en fase de captura para
  // adelantarnos al propio manejador de click de next/link.
  useEffect(() => {
    if (!hayCambios) return;

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let destino: URL;
      try {
        destino = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (destino.origin !== window.location.origin) return;
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      destinoPendienteRef.current = destino.pathname + destino.search + destino.hash;
      setErrorGuardar(null);
      setModalAbierto(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hayCambios]);

  function cerrarModal() {
    setModalAbierto(false);
    setErrorGuardar(null);
    destinoPendienteRef.current = null;
  }

  function descartarYNavegar() {
    const destino = destinoPendienteRef.current;
    setModalAbierto(false);
    setHayCambios(false);
    if (destino) router.push(destino);
  }

  async function guardarYNavegar() {
    const form = formRef.current;
    if (!form) return;

    if (!form.reportValidity()) {
      setErrorGuardar("Revisa los campos obligatorios antes de guardar.");
      return;
    }

    setGuardando(true);
    setErrorGuardar(null);

    try {
      const resultado = await guardarPerfilProfesional(undefined, new FormData(form));
      if (resultado?.error) {
        setErrorGuardar(resultado.error);
        setGuardando(false);
        return;
      }
    } catch {
      setErrorGuardar("No se pudo guardar. Inténtalo de nuevo.");
      setGuardando(false);
      return;
    }

    valorInicialRef.current = serializarFormulario(form);
    setHayCambios(false);
    setGuardando(false);
    setModalAbierto(false);

    const destino = destinoPendienteRef.current;
    if (destino) router.push(destino);
  }

  if (!modalAbierto) return null;

  return (
    <Modal onClose={cerrarModal}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Vas a salir de aquí sin haber guardado los cambios del perfil.
        </p>

        {errorGuardar && <p className="text-sm text-red-600 dark:text-red-400">{errorGuardar}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={guardarYNavegar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button type="button" variant="danger" onClick={descartarYNavegar} disabled={guardando}>
            Descartar cambios
          </Button>
          <Button type="button" variant="secondary" onClick={cerrarModal} disabled={guardando}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
