import { describe, it, expect } from "vitest";
import { EPI_VACCINES, VACCINE_MAP, createCustomVaccine } from "./vaccines";

// Expected values from the September 2026 WHO cross-validation (see VALIDATION.md)
describe("vaccine presets match WHO guidance", () => {
  it("stores every preset at 2-8 °C at health-facility level", () => {
    for (const v of EPI_VACCINES) {
      expect([v.storage.minC, v.storage.maxC], v.id).toEqual([2, 8]);
    }
  });

  it("requires freezer storage for OPV at higher levels only", () => {
    expect(VACCINE_MAP.opv.storage.higherLevelFreezer?.required).toBe(true);
    expect(VACCINE_MAP.measles.storage.higherLevelFreezer?.required).toBe(false);
    expect(VACCINE_MAP.bcg.storage.higherLevelFreezer?.required).toBe(false);
  });

  it("applies the WHO multi-dose vial policy", () => {
    expect(VACCINE_MAP.opv.openVialRule).toBe("28d_conditional");
    expect(VACCINE_MAP.dtp.openVialRule).toBe("28d_conditional");
    expect(VACCINE_MAP.hep_b.openVialRule).toBe("28d_conditional");
    expect(VACCINE_MAP.bcg.openVialRule).toBe("6h_or_session_end");
    expect(VACCINE_MAP.measles.openVialRule).toBe("6h_or_session_end");
  });

  it("uses only VVM types confirmed by WHO documents", () => {
    expect(VACCINE_MAP.opv.vvmType).toBe("VVM2");
    expect(VACCINE_MAP.hep_b.vvmType).toBe("VVM30");
    expect(VACCINE_MAP.bcg.vvmType).toBe("product-specific");
    expect(VACCINE_MAP.measles.vvmType).toBe("product-specific");
  });

  it("marks only aluminium-adsorbed vaccines as valid for the shake test", () => {
    expect(VACCINE_MAP.dtp.shakeTestValid).toBe(true);
    expect(VACCINE_MAP.hep_b.shakeTestValid).toBe(true);
    for (const id of ["bcg", "opv", "measles"]) {
      expect(VACCINE_MAP[id].shakeTestValid, id).toBe(false);
    }
  });

  it("never offers a shake test for a vaccine that tolerates freezing", () => {
    for (const v of EPI_VACCINES) {
      if (v.shakeTestValid) expect(v.storage.freezeAllowed, v.id).toBe(false);
    }
  });

  it("flags diluents that must never be frozen", () => {
    expect(VACCINE_MAP.bcg.storage.diluentNeverFreeze).toBe(true);
    expect(VACCINE_MAP.measles.storage.diluentNeverFreeze).toBe(true);
  });

  it("labels every Arrhenius parameter set as illustrative", () => {
    for (const v of EPI_VACCINES) {
      expect(v.arrhenius.illustrative, v.id).toBe(true);
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
  });
});
