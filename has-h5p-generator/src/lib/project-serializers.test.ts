import assert from "node:assert/strict";
import { test } from "node:test";
import { toClientProjectRecord } from "./project-serializers";

test("toClientProjectRecord does not expose owner IDs or private storage keys", () => {
  const safe = toClientProjectRecord({
    id: "curso-1",
    auth_user_id: "internal-user-uuid",
    storage_path: "packages/internal-user-uuid/curso-1/version.h5p",
    user_email: "docente@example.org",
    title: "Curso",
    course_name: "Curso",
    module_name: "Módulo",
    activity_number: 1,
    template_id: "plantilla-1",
    project_spec: {},
    slides_count: 1,
    interactions_count: 0,
    status: "ready",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  });
  assert.equal("auth_user_id" in safe, false);
  assert.equal("storage_path" in safe, false);
  assert.equal(safe.id, "curso-1");
});
