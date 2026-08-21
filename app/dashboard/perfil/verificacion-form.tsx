"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { subirDocumentoIdentidad } from "@/app/actions/profesionales";
import { DOCUMENTOS_IDENTIDAD_BUCKET, MAX_TAMANO_FOTO_BYTES } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VerificacionForm({
  userId,
  tieneDocumentoInicial,
  verificadoInicial,
}: {
  userId: string;
  tieneDocumentoInicial: boolean;
  verificadoInicial: boolean;
}) {
  const [tieneDocumento, setTieneDocumento] = useState(tieneDocumentoInicial);
  const [verificado, setVerificado] = useState(verificadoInicial);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Solo se admiten archivos de imagen.");
      return;
    }
    if (file.size > MAX_TAMANO_FOTO_BYTES) {
      setError("El archivo debe pesar como máximo 5 MB.");
      return;
    }

    setSubiendo(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const ruta = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTOS_IDENTIDAD_BUCKET)
      .upload(ruta, file, { contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setSubiendo(false);
      return;
    }

    const resultado = await subirDocumentoIdentidad(ruta);
    if (resultado?.error) {
      setError(resultado.error);
      await supabase.storage.from(DOCUMENTOS_IDENTIDAD_BUCKET).remove([ruta]);
    } else {
      setTieneDocumento(true);
      setVerificado(false);
    }

    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card className="w-full max-w-lg p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Verificación de identidad
          </h2>
          {verificado ? (
            <Badge status="confirmada">Verificado</Badge>
          ) : tieneDocumento ? (
            <Badge status="pendiente">Pendiente de revisión</Badge>
          ) : (
            <Badge status="cerrada">Sin enviar</Badge>
          )}
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Sube una foto o escaneado de tu DNI/NIF/CIF para verificar tu identidad. Un
          administrador revisará el documento manualmente. Solo tú y el equipo de ReformasApp
          podéis verlo.
        </p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-neutral-400 dark:file:bg-primary-900/30 dark:file:text-primary-300"
          />
          {subiendo && (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">Subiendo...</p>
          )}
          {tieneDocumento && !subiendo && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
              {verificado
                ? "Si subes un nuevo documento, tu verificación volverá a quedar pendiente de revisión."
                : "Ya tienes un documento enviado. Si subes otro, sustituirá al anterior."}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
