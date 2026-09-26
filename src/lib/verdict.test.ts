import { describe, it, expect } from "vitest";
import { determineFinalVerdict, type VerdictInput } from "./verdict";

const base: VerdictInput = {
  vvmStage: 1,
  freezeSensitive: true,
  shakeTestValid: true,
  intervals: [{ temperatureC: 25, durationHours: 6 }],
  shakeTest: "not_done",
  estimatedPotencyPct: 100,
};

const frozen = [{ temperatureC: -2, durationHours: 3 }];

describe("determineFinalVerdict", () => {
  it("is USABLE with VVM stage 1 and no freeze exposure", () => {
    const r = determineFinalVerdict(base);
    expect(r.verdict).toBe("USABLE");
    expect(r.reasons).toEqual([]);
  });

  it("discards on VVM stage 3 even when the estimate is 100%", () => {
    const r = determineFinalVerdict({ ...base, vvmStage: 3 });
    expect(r.verdict).toBe("DISCARD");
    expect(r.reasons).toContain("vvm_discard");
  });

  it("discards on VVM stage 4", () => {
    expect(determineFinalVerdict({ ...base, vvmStage: 4 }).verdict).toBe("DISCARD");
  });

  it("holds a freeze-exposed, freeze-sensitive vaccine until the shake test is done", () => {
    const r = determineFinalVerdict({ ...base, intervals: frozen });
    expect(r.verdict).toBe("HOLD");
    expect(r.reasons).toContain("shake_test_required");
    expect(r.freezeExposure).toBe(true);
  });

  it("treats exactly 0 °C as freeze exposure", () => {
    const r = determineFinalVerdict({ ...base, intervals: [{ temperatureC: 0, durationHours: 1 }] });
    expect(r.freezeExposure).toBe(true);
  });

  it("discards when the shake test fails", () => {
    const r = determineFinalVerdict({ ...base, intervals: frozen, shakeTest: "failed" });
    expect(r.verdict).toBe("DISCARD");
    expect(r.reasons).toContain("shake_test_failed");
  });

  it("is USABLE when the shake test passes and VVM is stage 1", () => {
    const r = determineFinalVerdict({ ...base, intervals: frozen, shakeTest: "passed" });
    expect(r.verdict).toBe("USABLE");
  });

  it("does not require a shake test for vaccines that tolerate freezing", () => {
    const r = determineFinalVerdict({
      ...base,
      freezeSensitive: false,
      shakeTestValid: false,
      intervals: [{ temperatureC: -20, durationHours: 48 }],
    });
    expect(r.verdict).toBe("USABLE");
    expect(r.freezeExposure).toBe(false);
  });

  it("holds a freeze-exposed vaccine for which the shake test is not valid", () => {
    const r = determineFinalVerdict({ ...base, shakeTestValid: false, intervals: frozen });
    expect(r.verdict).toBe("HOLD");
    expect(r.reasons).toEqual(["freeze_untestable"]);
  });

  it("ignores a shake-test result when the test is not valid for the vaccine", () => {
    const r = determineFinalVerdict({
      ...base,
      shakeTestValid: false,
      intervals: frozen,
      shakeTest: "passed",
    });
    expect(r.verdict).toBe("HOLD");
    expect(r.reasons).toContain("freeze_untestable");
  });

  it("still discards on VVM stage 3 when the shake test is not valid", () => {
    const r = determineFinalVerdict({
      ...base,
      vvmStage: 3,
      shakeTestValid: false,
      intervals: frozen,
    });
    expect(r.verdict).toBe("DISCARD");
    expect(r.reasons).toEqual(["vvm_discard"]);
  });

  it("holds when VVM was not checked", () => {
    const r = determineFinalVerdict({ ...base, vvmStage: null });
    expect(r.verdict).toBe("HOLD");
    expect(r.reasons).toContain("vvm_not_checked");
  });

  it("lists both reasons when VVM and shake test both indicate discard", () => {
    const r = determineFinalVerdict({
      ...base,
      vvmStage: 3,
      intervals: frozen,
      shakeTest: "failed",
    });
    expect(r.reasons).toEqual(["vvm_discard", "shake_test_failed"]);
  });

  it("warns (without changing the verdict) on VVM stage 2", () => {
    const r = determineFinalVerdict({ ...base, vvmStage: 2 });
    expect(r.verdict).toBe("USABLE");
    expect(r.warnings).toContain("vvm_use_first");
  });

  it("warns (without changing the verdict) on a low potency estimate", () => {
    const r = determineFinalVerdict({ ...base, estimatedPotencyPct: 40 });
    expect(r.verdict).toBe("USABLE");
    expect(r.warnings).toContain("heat_estimate_low");
  });
});
