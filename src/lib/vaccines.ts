/**
 * vaccines.ts — VaxGuard vaccine preset data
 *
 * Values follow WHO guidance as cross-checked in September 2026
 * (see VALIDATION.md for item-by-item sources).
 *
 * Presets are keyed by antigen. Items that vary by product (VVM type,
 * some open-vial rules) are marked "product-specific" and are shown as
 * guidance only; they never decide the verdict.
 *
 * Presets carry no Arrhenius parameters: no WHO or peer-reviewed source
 * was found for them. The potency estimate is shown only for custom
 * vaccines whose parameters the user enters from manufacturer data.
 *
 * Sources:
 *   - WHO. Temperature sensitivity of vaccines. WHO/IVB/06.10 (2006)
 *   - WHO. Vaccine Management Handbook, Module VMH-E2. WHO/IVB/15.04 (2015)
 *   - WHO. Policy on the use of opened multi-dose vaccine vials. WHO/IVB/14.07 (2014)
 *   - WHO. PQS performance specification: VVM. WHO/PQS/E006/IN05.4 (2020)
 *   - WHO. Table of vaccines prequalified for use in CTC (web, accessed 2026)
 *   - Kartoglu et al. Bull WHO 2010;88:624-631 (shake test validation)
 */

import { DEFAULT_EA_J } from "./arrhenius";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** VVM reading stage (national practice; WHO treats colour change as continuous) */
export type VVMStage = 1 | 2 | 3 | 4;

export interface VVMStatus {
  stage: VVMStage;
  usable: boolean;
  description: string;
  colorState: "lighter" | "same" | "darker";
}

/**
 * VVM type. Numbers are the maximum days to end point at 37 °C
 * (WHO/PQS/E006/IN05.4, Table 1a). "product-specific" means the type
 * differs by manufacturer and must be read from the vial or WHO PQ page.
 */
export type VVMType =
  | "VVM2"
  | "VVM7"
  | "VVM14"
  | "VVM30"
  | "product-specific"
  | "unknown";

/** Open-vial rule under WHO/IVB/14.07 (2014) */
export type OpenVialRule =
  | "28d_conditional"    // up to 28 days if all MDVP conditions are met
  | "6h_or_session_end"  // discard 6 h after opening or at end of session, whichever first
  | "single_dose"
  | "product_specific"   // differs by presentation; check the label
  | "unknown";

export type VaccineCategory =
  | "live_attenuated"
  | "inactivated"
  | "toxoid"
  | "subunit"
  | "custom";

export interface StorageCondition {
  /** Recommended range at health-facility level [°C] */
  minC: number;
  maxC: number;
  /** Optional or required freezer storage at national/subnational stores */
  higherLevelFreezer?: {
    minC: number;
    maxC: number;
    required: boolean;
  };
  /** The vaccine itself tolerates freezing */
  freezeAllowed: boolean;
  /** Diluent supplied with a freeze-dried vaccine must never be frozen */
  diluentNeverFreeze: boolean;
  freezeSensitivityNote: string;
}

export interface ArrheniusParams {
  activationEnergyJ: number;
  referenceTemperatureC: number;
  kRefPerHour: number;
  /** True when no WHO or peer-reviewed source supports the values */
  illustrative: boolean;
  source: string;
}

export interface VaccineProfile {
  id: string;
  name: string;
  abbreviation: string;
  category: VaccineCategory;
  /** null: no sourced stability parameters, so no potency estimate is shown */
  arrhenius: ArrheniusParams | null;
  storage: StorageCondition;
  vvmType: VVMType;
  openVialRule: OpenVialRule;
  /** Shake test is validated only for aluminium-adsorbed vaccines */
  shakeTestValid: boolean;
  notes: string;
  isCustom: boolean;
}

// ─────────────────────────────────────────────
// VVM stages
// ─────────────────────────────────────────────

export const VVM_STAGES: Record<VVMStage, VVMStatus> = {
  1: { stage: 1, usable: true, colorState: "lighter", description: "Square lighter than circle. Usable." },
  2: { stage: 2, usable: true, colorState: "lighter", description: "Square darker but still lighter than circle. Usable; use first." },
  3: { stage: 3, usable: false, colorState: "same", description: "Square matches circle. Discard point." },
  4: { stage: 4, usable: false, colorState: "darker", description: "Square darker than circle. Discard." },
};

// ─────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────

const FREEZE_SENSITIVE = (note: string): StorageCondition => ({
  minC: 2,
  maxC: 8,
  freezeAllowed: false,
  diluentNeverFreeze: false,
  freezeSensitivityNote: note,
});

const FREEZE_DRIED = (optionalFreezer: boolean): StorageCondition => ({
  minC: 2,
  maxC: 8,
  ...(optionalFreezer ? { higherLevelFreezer: { minC: -25, maxC: -15, required: false } } : {}),
  freezeAllowed: true,
  diluentNeverFreeze: true,
  freezeSensitivityNote: "Freeze-dried vaccine is not damaged by freezing. Diluent must never be frozen.",
});

// ─────────────────────────────────────────────
// WHO EPI presets: original five
// ─────────────────────────────────────────────

const BCG: VaccineProfile = {
  id: "bcg",
  name: "BCG",
  abbreviation: "BCG",
  category: "live_attenuated",
  arrhenius: null,
  storage: FREEZE_DRIED(true),
  vvmType: "product-specific", // VVM30 or VVM14 depending on manufacturer (WHO/IVB/06.10 §2)
  openVialRule: "6h_or_session_end",
  shakeTestValid: false,
  notes: "Protect from light.",
  isCustom: false,
};

const OPV: VaccineProfile = {
  id: "opv",
  name: "OPV",
  abbreviation: "OPV",
  category: "live_attenuated",
  arrhenius: null,
  storage: {
    minC: 2,
    maxC: 8,
    higherLevelFreezer: { minC: -25, maxC: -15, required: true },
    freezeAllowed: true,
    diluentNeverFreeze: false,
    freezeSensitivityNote: "Not damaged by freezing. Freeze-thaw cycle limits: see product insert.",
  },
  vvmType: "VVM2", // assigned to OPV (WHO/IVB/06.10 §2)
  openVialRule: "28d_conditional",
  shakeTestValid: false,
  notes: "Least heat-stable EPI vaccine. Frozen at national/subnational stores; 2-8 °C at health facilities.",
  isCustom: false,
};

const DTP: VaccineProfile = {
  id: "dtp",
  name: "DTP",
  abbreviation: "DTP",
  category: "toxoid",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing (aluminium adjuvant). Never freeze."),
  vvmType: "product-specific",
  openVialRule: "28d_conditional",
  shakeTestValid: true,
  notes: "No DTP product is WHO-approved for CTC.",
  isCustom: false,
};

const MEASLES: VaccineProfile = {
  id: "measles",
  name: "Measles / MR / MMR",
  abbreviation: "MR",
  category: "live_attenuated",
  arrhenius: null,
  storage: FREEZE_DRIED(true),
  vvmType: "product-specific",
  openVialRule: "6h_or_session_end",
  shakeTestValid: false,
  notes: "Protect from light. Reconstituted vaccine loses potency rapidly at room temperature.",
  isCustom: false,
};

const HEP_B: VaccineProfile = {
  id: "hep_b",
  name: "Hepatitis B",
  abbreviation: "HepB",
  category: "subunit",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing (aluminium adjuvant). Never freeze."),
  vvmType: "VVM30", // WHO/IVB/06.10 §2
  openVialRule: "28d_conditional",
  shakeTestValid: true,
  notes: "No hepatitis B product is WHO-approved for CTC.",
  isCustom: false,
};

// ─────────────────────────────────────────────
// WHO EPI presets: added September 2026
// ─────────────────────────────────────────────

const TD_TT: VaccineProfile = {
  id: "td_tt",
  name: "Td / TT",
  abbreviation: "Td/TT",
  category: "toxoid",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing (aluminium adjuvant). Never freeze."),
  vvmType: "product-specific",
  openVialRule: "28d_conditional", // SIIPL dT package insert (UNICEF 2026); WHO/IVB/14.07
  shakeTestValid: true,
  notes: "Aluminium-adsorbed.",
  isCustom: false,
};

const PCV: VaccineProfile = {
  id: "pcv",
  name: "Pneumococcal conjugate",
  abbreviation: "PCV",
  category: "subunit",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing (aluminium adjuvant). Never freeze."),
  vvmType: "product-specific",
  openVialRule: "product_specific", // 4-dose with preservative: 28 days; unpreserved: end of session
  shakeTestValid: true,
  notes: "Aluminium-adsorbed. 4-dose vials with preservative: up to 28 days if MDVP conditions are met.",
  isCustom: false,
};

const IPV: VaccineProfile = {
  id: "ipv",
  name: "Inactivated polio",
  abbreviation: "IPV",
  category: "inactivated",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing. Not adsorbed: the shake test is not valid."),
  vvmType: "product-specific",
  openVialRule: "product_specific",
  shakeTestValid: false, // WHO/IVB/15.04 §2.1.4
  notes: "Freeze exposure cannot be checked with a shake test.",
  isCustom: false,
};

const ROTA: VaccineProfile = {
  id: "rota",
  name: "Rotavirus",
  abbreviation: "Rota",
  category: "live_attenuated",
  arrhenius: null,
  // WHO/IVB/15.04 Table 2 says not damaged; WHO/PATH 2014 slides say follow the insert.
  // Treated conservatively as freeze-sensitive without a valid shake test.
  storage: FREEZE_SENSITIVE("Freezing behaviour differs by product. Follow the product insert."),
  vvmType: "product-specific",
  openVialRule: "product_specific",
  shakeTestValid: false,
  notes: "WHO documents differ on freezing; treated conservatively.",
  isCustom: false,
};

const YF: VaccineProfile = {
  id: "yf",
  name: "Yellow fever",
  abbreviation: "YF",
  category: "live_attenuated",
  arrhenius: null,
  storage: FREEZE_DRIED(true),
  vvmType: "product-specific",
  openVialRule: "6h_or_session_end",
  shakeTestValid: false,
  notes: "Reconstituted vaccine: discard after 6 h or at end of session.",
  isCustom: false,
};

const MEN_CONJ: VaccineProfile = {
  id: "men_conj",
  name: "Meningococcal conjugate (freeze-dried)",
  abbreviation: "Men",
  category: "subunit",
  arrhenius: null,
  storage: FREEZE_DRIED(false),
  vvmType: "product-specific",
  openVialRule: "6h_or_session_end",
  shakeTestValid: false,
  notes: "Freeze-dried conjugates such as MenAfriVac and MenFive (both WHO-approved for CTC). Liquid MenC products are not covered.",
  isCustom: false,
};

const OCV: VaccineProfile = {
  id: "ocv",
  name: "Oral cholera",
  abbreviation: "OCV",
  category: "inactivated",
  arrhenius: null,
  storage: FREEZE_SENSITIVE("Damaged by freezing. Not adsorbed: the shake test is not valid."),
  vvmType: "product-specific", // Euvichol-S: VVM30 (WHOPAR 2025)
  openVialRule: "product_specific",
  shakeTestValid: false,
  notes: "Some products are WHO-approved for CTC; check the current WHO CTC list.",
  isCustom: false,
};

// ─────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────

export const EPI_VACCINES: VaccineProfile[] = [
  BCG, OPV, DTP, MEASLES, HEP_B,
  TD_TT, PCV, IPV, ROTA, YF, MEN_CONJ, OCV,
];

export const VACCINE_MAP: Record<string, VaccineProfile> = Object.fromEntries(
  EPI_VACCINES.map((v) => [v.id, v])
);

export function getVaccineById(id: string): VaccineProfile {
  const vaccine = VACCINE_MAP[id];
  if (!vaccine) {
    throw new Error(`Unknown vaccine ID "${id}". Valid IDs: ${Object.keys(VACCINE_MAP).join(", ")}`);
  }
  return vaccine;
}

/**
 * Custom vaccine from user-entered parameters.
 * Defaults are conservative: VVM and open-vial rule unknown,
 * freezing not allowed, shake test not valid.
 */
export function createCustomVaccine(params: {
  name: string;
  activationEnergyJ?: number;
  referenceTemperatureC: number;
  kRefPerHour: number;
  freezeAllowed?: boolean;
  shakeTestValid?: boolean;
}): VaccineProfile {
  return {
    id: `custom_${Date.now()}`,
    name: params.name,
    abbreviation: "CUSTOM",
    category: "custom",
    arrhenius: {
      activationEnergyJ: params.activationEnergyJ ?? DEFAULT_EA_J,
      referenceTemperatureC: params.referenceTemperatureC,
      kRefPerHour: params.kRefPerHour,
      illustrative: true,
      source: "User input",
    },
    storage: {
      minC: 2,
      maxC: 8,
      freezeAllowed: params.freezeAllowed ?? false,
      diluentNeverFreeze: false,
      freezeSensitivityNote: "Check the manufacturer's instructions.",
    },
    vvmType: "unknown",
    openVialRule: "unknown",
    shakeTestValid: params.shakeTestValid ?? false,
    notes: "User-defined vaccine. Check the source and accuracy of all parameters.",
    isCustom: true,
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Freeze-sensitive: the vaccine itself is damaged by freezing */
export function isFreezeSensitive(vaccineId: string): boolean {
  const vaccine = VACCINE_MAP[vaccineId];
  if (!vaccine) return false;
  return !vaccine.storage.freezeAllowed;
}

/** Development helper: print a summary of the preset data */
export function printVaccineSummary(): void {
  for (const v of EPI_VACCINES) {
    console.log(
      `[${v.abbreviation.padEnd(6)}] ${v.storage.minC}..${v.storage.maxC} °C | ` +
      `freeze ${v.storage.freezeAllowed ? "ok" : "NO"} | ${v.vvmType} | ` +
      `${v.openVialRule} | shake test ${v.shakeTestValid ? "valid" : "n/a"}`
    );
  }
}
