import assert from "node:assert/strict";
import test from "node:test";
import { clampTransparency, clearFactorForTransparency } from "./glass-pref.ts";

test("clampTransparency keeps 0–100 and falls back when the value is not a number", () => {
  assert.equal(clampTransparency(35), 35);
  assert.equal(clampTransparency(0), 0);
  assert.equal(clampTransparency(100), 100);
  assert.equal(clampTransparency(-4), 0);
  assert.equal(clampTransparency(140), 100);
  assert.equal(clampTransparency(Number.NaN), 35);
});

test("clear factor is 1 at the default, 0 when fully clear, and does not invert the slider", () => {
  assert.equal(clearFactorForTransparency(35), 1);
  assert.equal(clearFactorForTransparency(100), 0);
  assert.ok(clearFactorForTransparency(0) > clearFactorForTransparency(35));
  assert.ok(clearFactorForTransparency(70) < 1);
});
