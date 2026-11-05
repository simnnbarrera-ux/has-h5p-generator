import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parámetro 'id' de proyecto requerido." },
        { status: 400 }
      );
    }

    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `${cleanId}.h5p`;

    // 1. Verificar en public/generated/<cleanId>.h5p
    const localPublicPath = path.join(process.cwd(), "public", "generated", filename);
    if (fs.existsSync(localPublicPath) && fs.statSync(localPublicPath).isFile()) {
      const buffer = fs.readFileSync(localPublicPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 2. Verificar en os.tmpdir()/<cleanId>.h5p
    const tmpCandidate = path.join(os.tmpdir(), filename);
    if (fs.existsSync(tmpCandidate) && fs.statSync(tmpCandidate).isFile()) {
      const buffer = fs.readFileSync(tmpCandidate);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 3. Verificar en Supabase Storage
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://jpwpuesdjrezlmpfjymt.supabase.co";
    const cloudUrl = `${supabaseUrl.replace(
      /\/$/,
      ""
    )}/storage/v1/object/public/has-h5p-store/packages/${filename}`;

    try {
      const cloudRes = await fetch(cloudUrl, { cache: "no-store" });
      if (cloudRes.ok) {
        const cloudBuf = Buffer.from(await cloudRes.arrayBuffer());
        return new NextResponse(cloudBuf, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store, max-age=0",
          },
        });
      }
    } catch {}

    return NextResponse.json(
      {
        error: `Paquete H5P no encontrado para el recurso: ${cleanId}. Por favor compila el paquete previamente.`,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error procesando la descarga del paquete .h5p", details: err?.message },
      { status: 500 }
    );
  }
}
