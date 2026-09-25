import { describe, it, expect } from "vitest";
import {
    calculateMKT,
    runVaxGuardCalculation,
    DEFAULT_EA_J,
} from "./arrhenius";

describe("calculateMKT", () => {
    it("returns the input temperature for a single interval", () => {
        const r = calculateMKT({ intervals: [{ temperatureC: 25, durationHours: 10 }] });
        expect(r.mktC).toBeCloseTo(25, 6);
    });

    it("is never below the time-weighted arithmetic mean", () => {
        const r = calculateMKT({
            intervals: [
                { temperatureC: 5, durationHours: 100 },
                { temperatureC: 40, durationHours: 2 },
                { temperatureC: -10, durationHours: 20 },
            ],
        });
        expect(r.mktC).toBeGreaterThanOrEqual(r.arithmeticMeanC);
    });

    // Regression: the sign error gave 15.7 °C here (below the 23.3 °C mean).
    it("matches an independent calculation for 25/37/8 °C, 24 h each", () => {
        const r = calculateMKT({
            intervals: [
                { temperatureC: 25, durationHours: 24 },
                { temperatureC: 37, durationHours: 24 },
                { temperatureC: 8, durationHours: 24 },
            ],
            activationEnergyJ: DEFAULT_EA_J,
        });
        expect(r.mktC).toBeCloseTo(29.22, 1);
        expect(r.arithmeticMeanC).toBeCloseTo(23.33, 2);
    });

    it("weights intervals by duration", () => {
        const merged = calculateMKT({
            intervals: [
                { temperatureC: 25, durationHours: 48 },
                { temperatureC: 37, durationHours: 24 },
            ],
        });
        const split = calculateMKT({
            intervals: [
                { temperatureC: 25, durationHours: 24 },
                { temperatureC: 25, durationHours: 24 },
                { temperatureC: 37, durationHours: 24 },
            ],
        });
        expect(merged.mktC).toBeCloseTo(split.mktC, 8);
    });
});

describe("remaining potency", () => {
    const params = {
        activationEnergyJ: DEFAULT_EA_J,
        kRefPerHour: Math.LN2 / 100, // half-life 100 h at 37 °C
        referenceTemperatureC: 37,
    };

    it("halves potency after one half-life at the reference temperature", () => {
        const r = runVaxGuardCalculation([{ temperatureC: 37, durationHours: 100 }], params);
        expect(r.potency.remainingPotency).toBeCloseTo(50, 4);
    });

    it("degrades more slowly at a lower temperature", () => {
        const hot = runVaxGuardCalculation([{ temperatureC: 37, durationHours: 100 }], params);
        const cool = runVaxGuardCalculation([{ temperatureC: 25, durationHours: 100 }], params);
        expect(cool.potency.remainingPotency).toBeGreaterThan(hot.potency.remainingPotency);
    });
});
