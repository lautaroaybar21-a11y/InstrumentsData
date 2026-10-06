"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

export function InstrumentForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/instruments", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo guardar el instrumento.");
      }

      setMessage("Instrumento registrado correctamente.");
      event.currentTarget.reset();
      setPreview(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          Registro
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Nuevo instrumento</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Usuario</span>
          <input
            name="userName"
            type="text"
            required
            placeholder="Nombre del responsable"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Instrumento</span>
          <input
            name="instrumentName"
            type="text"
            required
            placeholder="Ej. Multímetro, calibrador, osciloscopio"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Nro. de parte</span>
          <input
            name="partNumber"
            type="text"
            required
            placeholder="P-1001"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Nro. de serie</span>
          <input
            name="serialNumber"
            type="text"
            required
            placeholder="SN-2024-0001"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Foto</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-cyan-700"
        />
      </label>

      {preview ? (
        <div className="relative h-52 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <Image
            src={preview}
            alt="Vista previa"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Guardando..." : "Guardar instrumento"}
      </button>
    </form>
  );
}
