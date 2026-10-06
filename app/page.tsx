import Image from "next/image";

import { InstrumentForm } from "@/app/components/instrument-form";
import { getInstruments } from "@/lib/db";

export default async function Home() {
  const instruments = await getInstruments();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">
            AYBAR Instruments
          </p>
          <h1 className="text-4xl font-black text-slate-900">Control de inventario</h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.5fr]">
          <InstrumentForm />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Instrumentos registrados</h2>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700">
                {instruments.length}
              </span>
            </div>

            {instruments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
                Aún no hay instrumentos registrados.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {instruments.map((instrument) => (
                  <article
                    key={instrument.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
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
