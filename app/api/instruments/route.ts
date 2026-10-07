import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { createInstrument, getInstruments } from "@/lib/db";

async function savePhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) {
    return null;
  }

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const upload = await put(filename, file, {
        access: "public",
      });
      return upload.url;
    }
  } catch (error) {
    console.warn("Blob upload failed. Falling back to local storage only in development.", error);
  }

  const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

  if (isVercelRuntime) {
    throw new Error(
      "No hay un storage público configurado para Vercel. Creá un Blob público y definí BLOB_READ_WRITE_TOKEN.",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}

export async function GET() {
  const instruments = await getInstruments();
  return NextResponse.json({ instruments });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userName = String(formData.get("userName") ?? "").trim();
    const instrumentName = String(formData.get("instrumentName") ?? "").trim();
    const partNumber = String(formData.get("partNumber") ?? "").trim();
    const serialNumber = String(formData.get("serialNumber") ?? "").trim();
    const photo = formData.get("photo");

    if (!userName || !instrumentName || !partNumber || !serialNumber) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 },
      );
    }

    let photoUrl: string | null = null;

    if (photo && typeof photo !== "string") {
      photoUrl = await savePhoto(photo);
    }

    const instrument = await createInstrument({
      userName,
      instrumentName,
      partNumber,
      serialNumber,
      photoUrl,
    });

    return NextResponse.json({ success: true, instrument }, { status: 201 });
  } catch (error) {
    console.error("Instrument insert failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el instrumento.",
      },
      { status: 500 },
    );
  }
}
