"use client";

import { useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";

interface UploadResponse {
  ok: boolean;
  data?: { url: string; nombre: string };
  error?: { code: string; message: string };
}

export function MaterialFileUpload({
  archivoUrl,
  archivoNombre,
  onChange,
}: {
  archivoUrl?: string | null;
  archivoNombre?: string | null;
  onChange: (url: string | null, nombre: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const json: UploadResponse = await res.json();
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "No se pudo subir el archivo");
        return;
      }
      onChange(json.data.url, json.data.nombre);
    } catch {
      setError("No se pudo subir el archivo");
    } finally {
      setLoading(false);
    }
  }

  if (archivoUrl) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm">
        <FileText size={16} className="shrink-0 text-brand-600" />
        <a href={archivoUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-brand-700 hover:underline">
          {archivoNombre ?? "Archivo adjunto"}
        </a>
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="shrink-0 rounded-md p-1 text-ink-soft hover:bg-red-50 hover:text-red-500"
          title="Quitar archivo"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-ink-soft hover:border-brand-300 hover:text-brand-700">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {loading ? "Subiendo..." : "Adjuntar archivo (PDF, Word, ODT o TXT — máx. 15MB)"}
        <input
          type="file"
          accept=".pdf,.doc,.docx,.odt,.txt"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
