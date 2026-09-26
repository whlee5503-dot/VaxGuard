import { describe, it, expect } from "vitest";
import { EPI_VACCINES, VACCINE_MAP, createCustomVaccine } from "./vaccines";

// Expected values from the September 2026 WHO cross-validation (see VALIDATION.md)
describe("vaccine presets match WHO guidance", () => {
  it("includes 12 presets and no COVID-19 preset", () => {
    expect(EPI_VACCINES).toHaveLength(12);
    expect(EPI_VACCINES.some((v) => v.id.includes("covid"))).toBe(false);
  });

  it("stores every preset at 2-8 °C at health-facility level", () => {
    for (const v of EPI_VACCINES) {
      expect([v.storage.minC, v.storage.maxC], v.id).toEqual([2, 8]);
    }
  });

  it("requires freezer storage for OPV at higher levels only", () => {
    expect(VACCINE_MAP.opv.storage.higherLevelFreezer?.required).toBe(true);
    for (const id of ["bcg", "measles", "yf"]) {
      expect(VACCINE_MAP[id].storage.higherLevelFreezer?.required, id).toBe(false);
    }
  });

  it("applies the WHO multi-dose vial policy", () => {
    for (const id of ["opv", "dtp", "hep_b", "td_tt"]) {
      expect(VACCINE_MAP[id].openVialRule, id).toBe("28d_conditional");
    }
    for (const id of ["bcg", "measles", "yf", "men_conj"]) {
      expect(VACCINE_MAP[id].openVialRule, id).toBe("6h_or_session_end");
    }
    for (const id of ["pcv", "ipv", "rota", "ocv"]) {
      expect(VACCINE_MAP[id].openVialRule, id).toBe("product_specific");
    }
  });

  it("uses only VVM types confirmed by WHO documents", () => {
    expect(VACCINE_MAP.opv.vvmType).toBe("VVM2");
    expect(VACCINE_MAP.hep_b.vvmType).toBe("VVM30");
    for (const v of EPI_VACCINES) {
      if (v.id !== "opv" && v.id !== "hep_b") expect(v.vvmType, v.id).toBe("product-specific");
    }
  });

  it("marks only aluminium-adsorbed vaccines as valid for the shake test", () => {
    const adsorbed = ["dtp", "hep_b", "td_tt", "pcv"];
    for (const v of EPI_VACCINES) {
      expect(v.shakeTestValid, v.id).toBe(adsorbed.includes(v.id));
    }
  });

  it("treats non-adsorbed freeze-sensitive vaccines as untestable", () => {
    for (const id of ["ipv", "ocv", "rota"]) {
      expect(VACCINE_MAP[id].storage.freezeAllowed, id).toBe(false);
      expect(VACCINE_MAP[id].shakeTestValid, id).toBe(false);
    }
  });

  it("never offers a shake test for a vaccine that tolerates freezing", () => {
    for (const v of EPI_VACCINES) {
      if (v.shakeTestValid) expect(v.storage.freezeAllowed, v.id).toBe(false);
    }
  });

  it("flags diluents that must never be frozen", () => {
    for (const id of ["bcg", "measles", "yf", "men_conj"]) {
      expect(VACCINE_MAP[id].storage.diluentNeverFreeze, id).toBe(true);
    }
  });

  it("carries no Arrhenius parameters for any preset", () => {
    for (const v of EPI_VACCINES) {
      expect(v.arrhenius, v.id).toBeNull();
    }
  });
});

describe("custom vaccine defaults", () => {
  it("is conservative when the user gives no freeze information", () => {
    const c = createCustomVaccine({ name: "Test", referenceTemperatureC: 37, kRefPerHour: 0.01 });
    expect(c.storage.freezeAllowed).toBe(false);
    expect(c.shakeTestValid).toBe(false);
    expect(c.vvmType).toBe("unknown");
    expect(c.openVialRule).toBe("unknown");
    expect(c.arrhenius).not.toBeNull();
  });
});
