import { unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { deleteInstrument, getInstrumentById, updateInstrument } from "@/lib/db";

async function savePhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) {
    return null;
  }

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const upload = await put(filename, file, {
      access: "public",
    });
    return upload.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadsDir, filename);
  const fs = await import("fs/promises");
  await fs.mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const existing = await getInstrumentById(Number(id));
    let photoUrl = existing?.photo_url ?? null;

    if (photo && typeof photo !== "string" && photo.size > 0) {
      const nextPhotoUrl = await savePhoto(photo);
      if (nextPhotoUrl) {
        photoUrl = nextPhotoUrl;
      }
    }

    const instrument = await updateInstrument(Number(id), {
      userName,
      instrumentName,
      partNumber,
      serialNumber,
      photoUrl,
    });

    return NextResponse.json({ success: true, instrument });
  } catch (error) {
    console.error("Instrument update failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el instrumento.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const instrument = await getInstrumentById(Number(id));

    if (instrument?.photo_url && instrument.photo_url.startsWith("/uploads/")) {
      const fileName = instrument.photo_url.replace("/uploads/", "");
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      await unlink(filePath).catch(() => undefined);
    }

    await deleteInstrument(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Instrument delete failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el instrumento.",
      },
      { status: 500 },
    );
  }
}
