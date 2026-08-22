"use client";

import { Modal } from "@/components/ui/modal";
import { CitaExternaCampos } from "./cita-externa-campos";

export function CitaExternaForm({
  onClose,
  onExito,
}: {
  onClose: () => void;
  onExito: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <CitaExternaCampos onExito={onExito} onCancelar={onClose} />
    </Modal>
  );
}
