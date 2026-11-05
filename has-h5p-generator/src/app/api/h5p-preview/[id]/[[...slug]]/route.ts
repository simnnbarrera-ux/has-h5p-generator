import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

async function ensureTmpUnpackedFromCloud(
  projectId: string,
  tmpProjectDir: string,
  forceRefresh = false
): Promise<boolean> {
  try {
    const h5pJsonFile = path.join(tmpProjectDir, "h5p.json");
    if (!forceRefresh && fs.existsSync(h5pJsonFile)) {
      return true;
    }
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://jpwpuesdjrezlmpfjymt.supabase.co";
    const pkgUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/has-h5p-store/packages/${projectId}.h5p?t=${Date.now()}`;
    const res = await fetch(pkgUrl, { cache: "no-store" });
    if (!res.ok) return fs.existsSync(h5pJsonFile);

    const buf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);

    for (const [entryPath, zipObj] of Object.entries(zip.files)) {
      if (zipObj.dir) continue;
      if (entryPath === "h5p.json" || entryPath.startsWith("content/")) {
        const destFile = path.join(tmpProjectDir, entryPath);
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        const contentBuf = await zipObj.async("nodebuffer");
        fs.writeFileSync(destFile, contentBuf);
      }
    }
    return fs.existsSync(h5pJsonFile);
  } catch {
    return fs.existsSync(path.join(tmpProjectDir, "h5p.json"));
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; slug?: string[] }> }
) {
  try {
    const { id, slug } = await context.params;
    const relSegments = slug && slug.length > 0 ? slug : ["h5p.json"];
    const safeRelPath = relSegments
      .map((s) => s.replace(/\.\./g, ""))
      .join("/");

    const tmpProjectDir = path.join(os.tmpdir(), "preview-h5p", id);
    const tmpCandidate = path.join(tmpProjectDir, safeRelPath);

    // Si se pide h5p.json y la caché en /tmp tiene más de 8 segundos, refrescar desde Supabase Storage
    let shouldRefreshCloud = false;
    if (safeRelPath === "h5p.json") {
      try {
        if (fs.existsSync(tmpCandidate)) {
          const ageMs = Date.now() - fs.statSync(tmpCandidate).mtimeMs;
          if (ageMs > 8000) shouldRefreshCloud = true;
        }
      } catch {}
    }

    if (shouldRefreshCloud) {
      await ensureTmpUnpackedFromCloud(id, tmpProjectDir, true);
    }

    // 1. Verificar si ya existe en /tmp/preview-h5p/<id>
    if (fs.existsSync(tmpCandidate) && fs.statSync(tmpCandidate).isFile()) {
      const data = fs.readFileSync(tmpCandidate);
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": getMimeType(tmpCandidate),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 2. Intentar desempaquetar desde Supabase Storage hacia /tmp/preview-h5p/<id>
    const unpacked = await ensureTmpUnpackedFromCloud(id, tmpProjectDir, false);
    if (unpacked && fs.existsSync(tmpCandidate) && fs.statSync(tmpCandidate).isFile()) {
      const data = fs.readFileSync(tmpCandidate);
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": getMimeType(tmpCandidate),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 3. Fallback a public/preview-h5p/<id> (o alias reto11-act1 / reto11-act0)
    const aliasMap: Record<string, string> = {
      "matematicas-discretas-act1": "reto11-act1",
      "matematicas-discretas-act0": "reto11-act0",
    };
    const publicDirsToCheck = [
      path.join(process.cwd(), "public", "preview-h5p", id),
      ...(aliasMap[id]
        ? [path.join(process.cwd(), "public", "preview-h5p", aliasMap[id])]
        : []),
    ];

    for (const baseDir of publicDirsToCheck) {
      const candidate = path.join(baseDir, safeRelPath);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const data = fs.readFileSync(candidate);
        return new NextResponse(data, {
          status: 200,
          headers: {
            "Content-Type": getMimeType(candidate),
            "Cache-Control": "no-store, max-age=0",
          },
        });
      }
    }

    return NextResponse.json(
      { error: `Recurso H5P no encontrado: ${id}/${safeRelPath}` },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error sirviendo vista previa H5P", details: err?.message },
      { status: 500 }
    );
  }
}
