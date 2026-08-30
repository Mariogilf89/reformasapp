"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { agregarFotoProfesional, borrarFotoProfesional } from "@/app/actions/profesionales";
import { FOTOS_BUCKET, MAX_FOTOS_PROFESIONAL, MAX_TAMANO_FOTO_BYTES } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";

export function FotosForm({ userId, fotosIniciales }: { userId: string; fotosIniciales: string[] }) {
  const [fotos, setFotos] = useState(fotosIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const huecosLibres = MAX_FOTOS_PROFESIONAL - fotos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const archivos = Array.from(fileList).slice(0, huecosLibres);
    if (fileList.length > huecosLibres) {
      setError(
        `Solo puedes añadir ${huecosLibres} foto${huecosLibres === 1 ? "" : "s"} más (máximo ${MAX_FOTOS_PROFESIONAL}).`
      );
    }

    setSubiendo(true);
    const supabase = createClient();

    for (const archivo of archivos) {
      if (!archivo.type.startsWith("image/")) {
        setError("Solo se admiten archivos de imagen.");
        continue;
      }
      if (archivo.size > MAX_TAMANO_FOTO_BYTES) {
        setError("Cada foto debe pesar como máximo 5 MB.");
        continue;
      }

      const extension = archivo.name.split(".").pop() ?? "jpg";
      const ruta = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(FOTOS_BUCKET)
        .upload(ruta, archivo, { contentType: archivo.type });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(ruta);

      const resultado = await agregarFotoProfesional(publicUrl);
      if (resultado?.error) {
        setError(resultado.error);
        await supabase.storage.from(FOTOS_BUCKET).remove([ruta]);
        continue;
      }

      setFotos((actuales) => [...actuales, publicUrl]);
    }

    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleBorrar(url: string) {
    setError(null);
    const resultado = await borrarFotoProfesional(url);
    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    setFotos((actuales) => actuales.filter((foto) => foto !== url));
  }

  return (
    <Card className="w-full max-w-lg p-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Fotos</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Añade hasta {MAX_FOTOS_PROFESIONAL} fotos de tus trabajos (máximo 5 MB cada una).
          </p>
        </div>

        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {fotos.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Foto de trabajo del profesional" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleBorrar(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                >
                  Borrar
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {huecosLibres > 0 && (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={subiendo}
              onChange={(e) => handleFiles(e.target.files)}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            />
            {subiendo && (
              <p className="mt-2 text-sm text-neutral-500">Subiendo...</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
