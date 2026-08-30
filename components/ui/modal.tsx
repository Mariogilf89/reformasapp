"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-900"
        >
          ×
        </button>
        {children}
      </Card>
    </div>
  );
}
