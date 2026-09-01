"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { crearTrabajo, type FotoTrabajo } from "@/app/actions/trabajos";
import { CATEGORIAS, FOTOS_BUCKET, MAX_FOTOS_TRABAJO, MAX_TAMANO_FOTO_BYTES } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TrabajoForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(crearTrabajo, undefined);
  const [fotos, setFotos] = useState<FotoTrabajo[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tras un guardado con éxito, vacía las fotos pendientes: se ajusta en el
  // propio render (no en un efecto) siguiendo el patrón de React para
  // derivar estado a partir de un cambio de prop/estado externo.
  const [ultimoState, setUltimoState] = useState(state);
  if (state !== ultimoState) {
    setUltimoState(state);
    if (state?.success) {
      setFotos([]);
    }
  }

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const huecosLibres = MAX_FOTOS_TRABAJO - fotos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const archivos = Array.from(fileList).slice(0, huecosLibres);
    if (fileList.length > huecosLibres) {
      setError(
        `Solo puedes añadir ${huecosLibres} foto${huecosLibres === 1 ? "" : "s"} más (máximo ${MAX_FOTOS_TRABAJO}).`
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
      const ruta = `${userId}/trabajos/${crypto.randomUUID()}.${extension}`;

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

      setFotos((actuales) => [...actuales, { url: publicUrl, descripcion: "" }]);
    }

    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDescripcion(url: string, descripcion: string) {
    setFotos((actuales) => actuales.map((foto) => (foto.url === url ? { ...foto, descripcion } : foto)));
  }

  function handleQuitar(url: string) {
    setFotos((actuales) => actuales.filter((foto) => foto.url !== url));
  }

  return (
    <Card className="w-full max-w-lg p-8">
      <form ref={formRef} action={action} className="flex flex-col gap-4">
        <input type="hidden" name="fotos" value={JSON.stringify(fotos)} readOnly />

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Añadir trabajo</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Sube hasta {MAX_FOTOS_TRABAJO} fotos de un trabajo que hayas realizado, cada una con
            su propia descripción.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" type="text" required placeholder="Ej. Reforma de baño en Chamberí" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="categoria">Categoría</Label>
          <Select id="categoria" name="categoria" required defaultValue="">
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </Select>
        </div>

        {fotos.length > 0 && (
          <div className="flex flex-col gap-3">
            {fotos.map((foto) => (
              <div key={foto.url} className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.url} alt="Foto del trabajo" className="h-full w-full object-cover" />
                </div>
                <Input
                  type="text"
                  value={foto.descripcion}
                  onChange={(e) => handleDescripcion(foto.url, e.target.value)}
                  placeholder="Descripción de la foto"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleQuitar(foto.url)}
                  className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
            {subiendo && <p className="mt-2 text-sm text-neutral-500">Subiendo...</p>}
          </div>
        )}

        <Button type="submit" disabled={pending || subiendo || fotos.length === 0} className="w-full">
          {pending ? "Guardando..." : "Guardar trabajo"}
        </Button>
      </form>
    </Card>
  );
}
