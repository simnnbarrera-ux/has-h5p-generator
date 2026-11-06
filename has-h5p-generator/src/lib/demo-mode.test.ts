import test from "node:test";
import assert from "node:assert/strict";
import { createDemoProfile, DEMO_PROFILE_NAMES } from "./demo-mode";

test("demo profiles are synthetic, non-privileged and cost-free", () => {
  assert.deepEqual(DEMO_PROFILE_NAMES, ["Alex", "Hermaioni", "Simón", "Oswaldo", "Demo"]);

  for (const name of DEMO_PROFILE_NAMES) {
    const profile = createDemoProfile(name);
    assert.equal(profile.full_name, name);
    assert.match(profile.email, /^[a-z]+@demo\.invalid$/);
    assert.equal(profile.role, "professor");
    assert.equal(profile.daily_quota, 0);
    assert.equal(profile.faculty, "Perfil ficticio de demostración");
  }
});
