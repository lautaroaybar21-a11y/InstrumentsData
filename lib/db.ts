import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { sql } from "@vercel/postgres";

export type InstrumentRecord = {
  id: number;
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
};

function getDatabaseUrl() {
  return process.env.POSTGRES_URL ?? process.env.POSTGREST_URL;
}

function getLocalDataFilePath() {
  return path.join(process.cwd(), "data", "instruments.json");
}

async function ensureLocalDataFile() {
  const filePath = getLocalDataFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

async function readLocalRecords(): Promise<InstrumentRecord[]> {
  await ensureLocalDataFile();
  const filePath = getLocalDataFilePath();
  const content = await readFile(filePath, "utf8");

  try {
    return JSON.parse(content) as InstrumentRecord[];
  } catch {
    return [];
  }
}

async function writeLocalRecords(records: InstrumentRecord[]) {
  const filePath = getLocalDataFilePath();
  await writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function ensureSchema() {
  if (!getDatabaseUrl()) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS instruments (
      id SERIAL PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      instrument_name VARCHAR(255) NOT NULL,
      part_number VARCHAR(255) NOT NULL,
      serial_number VARCHAR(255) NOT NULL,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function getInstrumentById(id: number): Promise<InstrumentRecord | null> {
  if (!getDatabaseUrl()) {
    const records = await readLocalRecords();
    return records.find((record) => record.id === id) ?? null;
  }

  await ensureSchema();
  const { rows } = await sql<InstrumentRecord>`
    SELECT * FROM instruments WHERE id = ${id}
  `;

  return rows[0] ?? null;
}

export async function getInstruments(): Promise<InstrumentRecord[]> {
  if (!getDatabaseUrl()) {
    return readLocalRecords();
  }

  await ensureSchema();

  const { rows } = await sql<InstrumentRecord>`
    SELECT * FROM instruments ORDER BY created_at DESC
  `;

  return rows;
}

export async function createInstrument(input: {
  userName: string;
  instrumentName: string;
  partNumber: string;
  serialNumber: string;
  photoUrl?: string | null;
}) {
  if (!getDatabaseUrl()) {
    const records = await readLocalRecords();

    const newRecord: InstrumentRecord = {
      id: Date.now(),
      user_name: input.userName,
      instrument_name: input.instrumentName,
      part_number: input.partNumber,
      serial_number: input.serialNumber,
      photo_url: input.photoUrl ?? null,
      created_at: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...records];
    await writeLocalRecords(updatedRecords);
    return newRecord;
  }

  await ensureSchema();

  const { rows } = await sql<InstrumentRecord>`
    INSERT INTO instruments (user_name, instrument_name, part_number, serial_number, photo_url)
    VALUES (${input.userName}, ${input.instrumentName}, ${input.partNumber}, ${input.serialNumber}, ${input.photoUrl ?? null})
    RETURNING *
  `;

  return rows[0];
}

export async function updateInstrument(
  id: number,
  input: {
    userName: string;
    instrumentName: string;
    partNumber: string;
    serialNumber: string;
    photoUrl?: string | null;
  },
) {
  if (!getDatabaseUrl()) {
    const records = await readLocalRecords();
    const updatedRecords = records.map((record) =>
      record.id === id
        ? {
            ...record,
            user_name: input.userName,
            instrument_name: input.instrumentName,
            part_number: input.partNumber,
            serial_number: input.serialNumber,
            photo_url: input.photoUrl ?? record.photo_url ?? null,
            created_at: record.created_at,
          }
        : record,
    );

    await writeLocalRecords(updatedRecords);
    const item = updatedRecords.find((record) => record.id === id);
    if (!item) {
      throw new Error("Instrument not found");
    }
    return item;
  }

  await ensureSchema();

  const { rows } = await sql<InstrumentRecord>`
    UPDATE instruments
    SET user_name = ${input.userName},
        instrument_name = ${input.instrumentName},
        part_number = ${input.partNumber},
        serial_number = ${input.serialNumber},
        photo_url = ${input.photoUrl ?? null}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows[0]) {
    throw new Error("Instrument not found");
  }

  return rows[0];
}

export async function deleteInstrument(id: number) {
  if (!getDatabaseUrl()) {
    const records = await readLocalRecords();
    const remaining = records.filter((record) => record.id !== id);
    await writeLocalRecords(remaining);
    return;
  }

  await ensureSchema();
  await sql`DELETE FROM instruments WHERE id = ${id}`;
}
