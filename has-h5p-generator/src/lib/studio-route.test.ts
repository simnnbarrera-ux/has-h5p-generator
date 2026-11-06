import assert from "node:assert/strict";
import { test } from "node:test";
import { formatStudioRoute, parseStudioRoute } from "./studio-route";

test("landing and dashboard aliases map to canonical studio routes", () => {
  assert.deepEqual(parseStudioRoute("/"), { view: "landing", step: 1 });
  assert.equal(formatStudioRoute(parseStudioRoute("/landing")), "/landing");
  assert.equal(formatStudioRoute(parseStudioRoute("/dashboard")), "/dashboard/mis-recursos");
  assert.equal(formatStudioRoute(parseStudioRoute("/dashboard/my-resources")), "/dashboard/mis-recursos");
});

test("wizard paths preserve all five steps", () => {
  for (const step of [1, 2, 3, 4, 5] as const) {
    const route = parseStudioRoute(`/dashboard/wizard/step-${step}`);
    assert.deepEqual(route, { view: "wizard", step });
    assert.equal(formatStudioRoute(route), `/dashboard/wizard/step-${step}`);
  }
});

test("wizard path preserves only a safe project id", () => {
  const route = parseStudioRoute("/dashboard/wizard/step-4", "?project=activity_123-qa");
  assert.deepEqual(route, { view: "wizard", step: 4, projectId: "activity_123-qa" });
  assert.equal(formatStudioRoute(route), "/dashboard/wizard/step-4?project=activity_123-qa");
  assert.equal(parseStudioRoute("/dashboard/wizard/step-2", "?project=../private").projectId, undefined);
});

test("unsupported route or wizard step is normalized to landing", () => {
  assert.deepEqual(parseStudioRoute("/dashboard/wizard/step-9"), { view: "landing", step: 1 });
  assert.deepEqual(parseStudioRoute("/unknown"), { view: "landing", step: 1 });
});
