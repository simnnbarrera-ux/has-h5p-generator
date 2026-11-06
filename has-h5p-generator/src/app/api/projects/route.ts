import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import {
  getOrCreateProfile,
  listProjectsForUser,
  saveProjectToDb,
} from "@/lib/supabase-server";
import { generateMoodleBookJson, generatePh5pPythonScript } from "@/lib/h5p-engine";
import { toClientProjectRecord } from "@/lib/project-serializers";
import type { HasProjectRecord } from "@/lib/supabase";
import { ProjectValidationError, readBoundedJson, validateProjectSpec } from "@/lib/project-validation";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Se requiere una sesión válida." }, { status: 401 });
  }

  try {
    const [profile, projects] = await Promise.all([
      getOrCreateProfile(user),
      listProjectsForUser(user.id),
    ]);
    return NextResponse.json({ profile, projects: projects.map(toClientProjectRecord) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[/api/projects GET]", error);
    return NextResponse.json(
      { error: "No fue posible cargar tus proyectos. Verifica la configuración del servidor." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Se requiere una sesión válida." }, { status: 401 });
  }

  try {
    const body = await readBoundedJson<Record<string, unknown>>(req, 1_000_000);
    const spec = validateProjectSpec(body.spec);
    const rawMockup = typeof body.rawMockup === "string"
      ? body.rawMockup.slice(0, 50_000)
      : "";
    const profile = await getOrCreateProfile(user);
    const now = new Date().toISOString();
    const record: HasProjectRecord = {
      id: spec.id,
      auth_user_id: user.id,
      user_email: profile.email,
      title: spec.title,
      course_name: spec.courseName,
      module_name: spec.moduleName,
      activity_number: spec.activityNumber || 1,
      template_id: spec.templateId,
      raw_mockup: rawMockup,
      project_spec: spec,
      ph5p_script: generatePh5pPythonScript(spec),
      moodle_book: generateMoodleBookJson(spec),
      audit_report: spec.auditReport || [],
      package_url: `/api/h5p/download?id=${encodeURIComponent(spec.id)}`,
      slides_count: spec.slides.length + (spec.includeNavigationGuide ? 1 : 0),
      interactions_count: spec.slides.filter((slide) => Boolean(slide.interaction)).length,
      status: "draft",
      created_at: now,
      updated_at: now,
    };
    const saved = await saveProjectToDb(record, user.id);
    return NextResponse.json({ success: true, project: toClientProjectRecord(saved) }, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: any) {
    console.error("[/api/projects POST]", error);
    const status = typeof error?.message === "string" && error.message.includes("ya pertenece")
      ? 409
      : error instanceof ProjectValidationError
        ? 400
        : 503;
    return NextResponse.json(
      { error: status === 503 ? "No fue posible guardar el proyecto." : error.message },
      { status }
    );
  }
}
