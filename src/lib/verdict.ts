/**
 * verdict.ts — VaxGuard final verdict (WHO-aligned decision order)
 *
 * Decision order:
 *   1. VVM at or beyond discard point (stage 3-4)            -> DISCARD
 *   2. Freeze-sensitive vaccine exposed to <= 0 °C
 *        shake test valid for this vaccine:
 *          failed                                            -> DISCARD
 *          not done                                          -> HOLD
 *        shake test not valid (non-adsorbed vaccine)         -> HOLD
 *   3. VVM not checked                                       -> HOLD
 *   4. Otherwise                                             -> USABLE
 *
 * The shake test is validated only for aluminium-adsorbed vaccines
 * (Kartoglu et al., Bull WHO 2010;88:624-631). The Arrhenius potency
 * estimate never decides the verdict; it may only add a warning.
 */

import { VVM_STAGES, type VVMStage } from "./vaccines";
import type { TemperatureInterval } from "./arrhenius";

/** Freeze-exposure trigger [°C]. WHO: never expose freeze-sensitive vaccines to 0 °C or below. */
export const FREEZE_THRESHOLD_C = 0;

/** A potency estimate below this adds a warning (never changes the verdict). */
export const LOW_ESTIMATE_WARNING_PCT = 80;

export type ShakeTestResult = "passed" | "failed" | "not_done";
export type FinalVerdict = "USABLE" | "HOLD" | "DISCARD";

export type VerdictReason =
  | "vvm_discard"
  | "shake_test_failed"
  | "shake_test_required"
  | "freeze_untestable"
  | "vvm_not_checked";

export type VerdictWarning = "vvm_use_first" | "heat_estimate_low";

export interface VerdictInput {
  vvmStage: VVMStage | null;
  freezeSensitive: boolean;
  /** Shake test is valid for this vaccine (aluminium-adsorbed) */
  shakeTestValid: boolean;
  intervals: TemperatureInterval[];
  shakeTest: ShakeTestResult;
  /** Remaining / initial potency x 100 (Arrhenius estimate) */
  estimatedPotencyPct: number;
}

export interface VerdictOutput {
  verdict: FinalVerdict;
  reasons: VerdictReason[];
  warnings: VerdictWarning[];
  freezeExposure: boolean;
}

export function hasFreezeExposure(intervals: TemperatureInterval[]): boolean {
  return intervals.some(
    (iv) => iv.durationHours > 0 && iv.temperatureC <= FREEZE_THRESHOLD_C
  );
}

export function determineFinalVerdict(input: VerdictInput): VerdictOutput {
  const reasons: VerdictReason[] = [];
  const warnings: VerdictWarning[] = [];
  const freezeExposure =
    input.freezeSensitive && hasFreezeExposure(input.intervals);

  // Discard rules
  if (input.vvmStage !== null && !VVM_STAGES[input.vvmStage].usable) {
    reasons.push("vvm_discard");
  }
  if (freezeExposure && input.shakeTestValid && input.shakeTest === "failed") {
    reasons.push("shake_test_failed");
  }
  if (reasons.length > 0) {
    return { verdict: "DISCARD", reasons, warnings, freezeExposure };
  }

  // Hold rules
  if (freezeExposure && input.shakeTestValid && input.shakeTest === "not_done") {
    reasons.push("shake_test_required");
  }
  if (freezeExposure && !input.shakeTestValid) {
    reasons.push("freeze_untestable");
  }
  if (input.vvmStage === null) {
    reasons.push("vvm_not_checked");
  }

  // Warnings
  if (input.vvmStage === 2) warnings.push("vvm_use_first");
  if (input.estimatedPotencyPct < LOW_ESTIMATE_WARNING_PCT) {
    warnings.push("heat_estimate_low");
  }

  return {
    verdict: reasons.length > 0 ? "HOLD" : "USABLE",
    reasons,
    warnings,
    freezeExposure,
  };
}

/** Fallback for results saved before the WHO-aligned verdict existed. */
export const LEGACY_VERDICT: VerdictOutput = {
  verdict: "HOLD",
  reasons: ["vvm_not_checked"],
  warnings: [],
  freezeExposure: false,
};
