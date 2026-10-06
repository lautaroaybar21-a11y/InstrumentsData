import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { createInstrument } from "@/lib/db";

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

    if (photo && typeof photo !== "string" && photo.size > 0) {
      const filename = `${Date.now()}-${photo.name.replace(/\s+/g, "-")}`;
      const upload = await put(filename, photo, {
        access: "public",
      });
      photoUrl = upload.url;
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
