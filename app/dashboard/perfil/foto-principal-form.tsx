"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { guardarFotoPrincipalProfesional } from "@/app/actions/profesionales";
import { FOTOS_BUCKET, MAX_TAMANO_FOTO_BYTES } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { IconUsuario } from "@/components/ui/icon-usuario";

export function FotoPrincipalForm({
  userId,
  fotoInicial,
}: {
  userId: string;
  fotoInicial: string | null;
}) {
  const [foto, setFoto] = useState(fotoInicial);
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
      setError("La foto debe pesar como máximo 5 MB.");
      return;
    }

    setSubiendo(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const ruta = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(FOTOS_BUCKET)
      .upload(ruta, file, { contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setSubiendo(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(ruta);

    const resultado = await guardarFotoPrincipalProfesional(publicUrl);
    if (resultado?.error) {
      setError(resultado.error);
      await supabase.storage.from(FOTOS_BUCKET).remove([ruta]);
      setSubiendo(false);
      return;
    }

    setFoto(publicUrl);
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card className="w-full max-w-lg p-6">
      <div className="flex flex-col items-center gap-3">
        <p className="self-start text-sm font-medium text-neutral-900">Foto principal</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          aria-label={foto ? "Cambiar foto principal" : "Subir foto principal"}
          className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="Foto principal" className="h-full w-full object-cover" />
          ) : (
            <IconUsuario className="h-10 w-10 text-neutral-300" />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={subiendo}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        {subiendo && <p className="text-sm text-neutral-500">Subiendo...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-center text-sm text-neutral-600">
          La foto marcada como principal es la que se muestra como tu foto de perfil en toda la
          plataforma.
        </p>
      </div>
    </Card>
  );
}
