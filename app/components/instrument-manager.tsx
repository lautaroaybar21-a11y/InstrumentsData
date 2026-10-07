"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

type InstrumentRecord = {
  id: number;
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
};

const emptyForm = {
  userName: "",
  instrumentName: "",
  partNumber: "",
  serialNumber: "",
};

export function InstrumentManager() {
  const [instruments, setInstruments] = useState<InstrumentRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInstruments = useCallback(async () => {
    try {
      const response = await fetch("/api/instruments");
      const data = await response.json();
      setInstruments(data.instruments ?? []);
    } catch {
      setInstruments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch("/api/instruments", { signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted) {
          setInstruments(data.instruments ?? []);
          setIsLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setInstruments([]);
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => controller.abort();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setPreview(null);
    const input = document.querySelector<HTMLInputElement>('input[name="photo"]');
    if (input) input.value = "";
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("userName", form.userName);
      formData.append("instrumentName", form.instrumentName);
      formData.append("partNumber", form.partNumber);
      formData.append("serialNumber", form.serialNumber);

      const fileInput = document.querySelector<HTMLInputElement>('input[name="photo"]');
      if (fileInput?.files?.[0]) {
        formData.append("photo", fileInput.files[0]);
      }

      const url = editingId ? `/api/instruments/${editingId}` : "/api/instruments";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo guardar.");
      }

      await loadInstruments();
      setMessage(
        editingId ? "Instrumento actualizado correctamente." : "Instrumento guardado correctamente.",
      );
      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await fetch(`/api/instruments/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo eliminar.");
      }

      setMessage("Instrumento eliminado.");
      await loadInstruments();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo eliminar el instrumento.",
      );
    }
  }

  function handleEdit(item: InstrumentRecord) {
    setEditingId(item.id);
    setForm({
      userName: item.user_name,
      instrumentName: item.instrument_name,
      partNumber: item.part_number,
      serialNumber: item.serial_number,
    });
    setPreview(item.photo_url ?? null);
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-[28px] border border-cyan-100 bg-white/80 p-6 shadow-[0_20px_60px_rgba(14,116,144,0.08)] backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-cyan-700">
                AYBAR
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                Control de inventario
              </h1>
            </div>
            <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-800">
              Inventario activo
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.5fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                {editingId ? "Edición" : "Registro"}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {editingId ? "Actualizar instrumento" : "Nuevo instrumento"}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>Usuario</span>
                <input
                  type="text"
                  value={form.userName}
                  onChange={(event) => setForm({ ...form, userName: event.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>Instrumento</span>
                <input
                  type="text"
                  value={form.instrumentName}
                  onChange={(event) =>
                    setForm({ ...form, instrumentName: event.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nro. de parte</span>
                <input
                  type="text"
                  value={form.partNumber}
                  onChange={(event) => setForm({ ...form, partNumber: event.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nro. de serie</span>
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(event) =>
                    setForm({ ...form, serialNumber: event.target.value })
                  }
                  required
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
                <Image src={preview} alt="Vista previa" fill className="object-cover" unoptimized />
              </div>
            ) : null}

            {message ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? editingId
                    ? "Actualizando..."
                    : "Guardando..."
                  : editingId
                    ? "Actualizar"
                    : "Guardar instrumento"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Instrumentos registrados</h2>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700">
                {instruments.length}
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                Cargando instrumentos...
              </div>
            ) : instruments.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                Aún no hay instrumentos registrados.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {instruments.map((instrument) => (
                  <article
                    key={instrument.id}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)]"
                  >
                    <div className="relative h-44 w-full bg-slate-100">
                      {instrument.photo_url ? (
                        <Image
                          src={instrument.photo_url}
                          alt={instrument.instrument_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          Sin foto
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Instrumento</p>
                        <h3 className="text-lg font-bold text-slate-900">
                          {instrument.instrument_name}
                        </h3>
                      </div>

                      <dl className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between gap-3">
                          <dt className="font-medium text-slate-500">Usuario</dt>
                          <dd>{instrument.user_name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="font-medium text-slate-500">Nro. parte</dt>
                          <dd>{instrument.part_number}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="font-medium text-slate-500">Nro. serie</dt>
                          <dd>{instrument.serial_number}</dd>
                        </div>
                      </dl>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(instrument)}
                          className="flex-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(instrument.id)}
                          className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
