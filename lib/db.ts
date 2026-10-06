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

export async function ensureSchema() {
  if (!process.env.POSTGRES_URL) {
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

export async function getInstruments(): Promise<InstrumentRecord[]> {
  if (!process.env.POSTGRES_URL) {
    return [];
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
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  await ensureSchema();

  const { rows } = await sql<InstrumentRecord>`
    INSERT INTO instruments (user_name, instrument_name, part_number, serial_number, photo_url)
    VALUES (${input.userName}, ${input.instrumentName}, ${input.partNumber}, ${input.serialNumber}, ${input.photoUrl ?? null})
    RETURNING *
  `;

  return rows[0];
}
