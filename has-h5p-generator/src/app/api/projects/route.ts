import { NextRequest, NextResponse } from "next/server";
import {
  listProjectsFromDb,
  saveProjectToDb,
  getOrCreateProfile,
  HasProjectRecord,
} from "@/lib/supabase";
import { getSeedProjectRecords } from "@/lib/reto11-seed";
import {
  generatePh5pPythonScript,
  generateMoodleBookJson,
  HasProjectSpec,
} from "@/lib/h5p-engine";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const email =
      req.nextUrl.searchParams.get("email") || "oswaldo.rodriguez@uao.edu.co";
    const profile = await getOrCreateProfile(email);
    const seeds = getSeedProjectRecords();
    const projects = await listProjectsFromDb(seeds);

    return NextResponse.json({
      profile,
      projects,
    });
  } catch (err: any) {
    console.error("[/api/projects GET Error]", err);
    return NextResponse.json(
      {
        error: "Error consultando proyectos desde Supabase.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      spec,
      userEmail = "oswaldo.rodriguez@uao.edu.co",
      rawMockup = "",
    } = body as {
      spec: HasProjectSpec;
      userEmail?: string;
      rawMockup?: string;
    };

    if (!spec || !spec.id) {
      return NextResponse.json(
        { error: "Se requiere 'spec' con un identificador válido." },
        { status: 400 }
      );
    }

    const profile = await getOrCreateProfile(userEmail);
    const seeds = getSeedProjectRecords();

    const record: HasProjectRecord = {
      id: spec.id,
      user_email: profile.email,
      title: spec.title,
      course_name: spec.courseName,
      module_name: spec.moduleName,
      activity_number: spec.activityNumber || 1,
      template_id: spec.templateId || "plantilla-1",
      raw_mockup: rawMockup,
      project_spec: spec,
      ph5p_script: generatePh5pPythonScript(spec),
      moodle_book: generateMoodleBookJson(spec),
      audit_report: spec.auditReport || [],
      package_url: `/generated/${spec.id}.h5p`,
      slides_count:
        spec.slides.length + (spec.includeNavigationGuide ? 1 : 0),
      interactions_count: spec.slides.filter((s) => Boolean(s.interaction))
        .length,
      status: "ready",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await saveProjectToDb(record, seeds);
    return NextResponse.json({
      success: saved.success,
      project: saved.data,
    });
  } catch (err: any) {
    console.error("[/api/projects POST Error]", err);
    return NextResponse.json(
      {
        error: "Error guardando proyecto en Supabase.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
