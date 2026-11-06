import test from "node:test";
import assert from "node:assert/strict";
import { createDemoProfile, DEMO_PROFILE_NAMES } from "./demo-mode";

test("demo profiles provide full active testing capabilities", () => {
  assert.deepEqual(DEMO_PROFILE_NAMES, ["Alex", "Hermaioni", "Simón", "Oswaldo", "Demo"]);

  for (const name of DEMO_PROFILE_NAMES) {
    const profile = createDemoProfile(name);
    assert.equal(profile.full_name, name);
    assert.match(profile.email, /^[a-z.]+@has\.com$/);
    assert.ok(profile.daily_quota >= 50);
    assert.equal(profile.faculty, "Facultad de Ingeniería y Ciencias Básicas");
  }
});
