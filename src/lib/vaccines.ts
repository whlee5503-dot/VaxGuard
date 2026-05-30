/**
 * vaccines.ts — VaxGuard 백신 파라미터 DB
 *
 * WHO EPI 핵심 5종 + 커스텀 입력 지원.
 * 각 백신의 Arrhenius 파라미터(Ea, k_ref, T_ref)와
 * VVM 등급, 보관 조건, 판정 기준을 포함한다.
 *
 * 참고 문헌:
 *   - WHO EPI Technical Guides (2023)
 *   - WHO Vaccine Management Handbook (2022)
 *   - WHO TRS 961 Annex 9 (2011)
 *   - CDC Pink Book — Vaccine Stability & Storage
 *   - Kumru et al. (2014) Biologics 8:239-254
 */

import { DEFAULT_EA_J } from "./arrhenius";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

/** VVM(Vaccine Vial Monitor) 등급 */
export type VVMStage = 1 | 2 | 3 | 4;

/** VVM 등급별 상태 */
export interface VVMStatus {
  stage: VVMStage;
  /** 판독 가능 여부 */
  usable: boolean;
  description: string;
  /** 내부 사각형이 외부 원보다 밝음/같음/어두움 */
  colorState: "lighter" | "same" | "darker";
}

/** 백신 보관 온도 조건 */
export interface StorageCondition {
  /** 권장 보관 온도 범위 [°C] */
  minC: number;
  maxC: number;
  /** 최대 허용 노출 온도 [°C] */
  maxExposureC: number;
  /** 동결 허용 여부 */
  freezeAllowed: boolean;
  /** 동결 민감도 설명 */
  freezeSensitivityNote: string;
}

/** Arrhenius 안정성 파라미터 */
export interface ArrheniusParams {
  /** 활성화 에너지 [J/mol] */
  activationEnergyJ: number;
  /** 참조 온도 [°C] — k_ref 기준 */
  referenceTemperatureC: number;
  /** 참조 온도에서의 1차 분해 속도 상수 [1/hour] */
  kRefPerHour: number;
  /** 파라미터 출처 */
  source: string;
}

/** 백신 정의 */
export interface VaccineProfile {
  /** 고유 ID */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 약칭 */
  abbreviation: string;
  /** 백신 분류 */
  category: VaccineCategory;
  /** Arrhenius 파라미터 */
  arrhenius: ArrheniusParams;
  /** 보관 조건 */
  storage: StorageCondition;
  /** VVM 유형 (VVM2, VVM7, VVM14, VVM30) */
  vvmType: VVMType;
  /** 개봉 후 사용 가능 시간 [hours] — 멀티도즈 */
  openVialUsageHours: number;
  /** 비고 */
  notes: string;
  /** 커스텀 입력 여부 */
  isCustom: boolean;
}

/** 백신 분류 */
export type VaccineCategory =
  | "live_attenuated"   // 생백신 (OPV, MMR, 수두 등)
  | "inactivated"       // 불활화 백신 (IPV, Hep B 등)
  | "toxoid"            // 톡소이드 (DTP, TT 등)
  | "subunit"           // 서브유닛 (Hep B, HPV 등)
  | "custom";           // 사용자 정의

/** VVM 유형 — 숫자는 37°C 기준 누적 열 노출 허용일 */
export type VVMType = "VVM2" | "VVM7" | "VVM14" | "VVM30";

// ─────────────────────────────────────────────
// VVM 등급 해설
// ─────────────────────────────────────────────

export const VVM_STAGES: Record<VVMStage, VVMStatus> = {
  1: {
    stage: 1,
    usable: true,
    colorState: "lighter",
    description: "사용 가능 — 내부 사각형이 외부 원보다 밝음. 열 노출 최소.",
  },
  2: {
    stage: 2,
    usable: true,
    colorState: "lighter",
    description: "사용 가능 — 내부 사각형 색이 진해지기 시작. 즉시 사용 권장.",
  },
  3: {
    stage: 3,
    usable: false,
    colorState: "same",
    description: "사용 불가 — 내부 사각형과 외부 원 색이 동일. 폐기.",
  },
  4: {
    stage: 4,
    usable: false,
    colorState: "darker",
    description: "사용 불가 — 내부 사각형이 외부 원보다 어두움. 즉시 폐기.",
  },
};

// ─────────────────────────────────────────────
// WHO EPI 핵심 5종 백신 프로파일
// ─────────────────────────────────────────────

/**
 * BCG (결핵 예방 생백신)
 *
 * 열에 비교적 강하지만 동결·빛에 취약.
 * 개봉 후 6시간 내 사용.
 * Ea: WHO 기본값 적용 (문헌 정밀값 부재)
 */
const BCG: VaccineProfile = {
  id: "bcg",
  name: "BCG (결핵)",
  abbreviation: "BCG",
  category: "live_attenuated",
  arrhenius: {
    activationEnergyJ: DEFAULT_EA_J,         // 83,000 J/mol — WHO 기본값
    referenceTemperatureC: 37,
    kRefPerHour: 0.00693,                    // t½ ≈ 100h @ 37°C (WHO 안정성 데이터)
    source: "WHO Vaccine Management Handbook 2022",
  },
  storage: {
    minC: 2,
    maxC: 8,
    maxExposureC: 25,
    freezeAllowed: true,
    freezeSensitivityNote: "동결 가능. 단 개봉 후 동결 불가.",
  },
  vvmType: "VVM2",
  openVialUsageHours: 6,
  notes: "빛에 매우 취약. 차광 보관 필수. 개봉 후 희석액 포함 6시간 내 사용.",
  isCustom: false,
};

/**
 * OPV (경구 폴리오 생백신)
 *
 * WHO EPI 중 열에 가장 취약한 백신.
 * -15°C ~ -25°C 냉동 보관 원칙.
 * VVM2 부착 (가장 빠른 열 반응형).
 */
const OPV: VaccineProfile = {
  id: "opv",
  name: "OPV (경구 폴리오)",
  abbreviation: "OPV",
  category: "live_attenuated",
  arrhenius: {
    activationEnergyJ: 100_000,              // 100 kJ/mol — 열 민감성 높은 생백신
    referenceTemperatureC: 37,
    kRefPerHour: 0.02310,                    // t½ ≈ 30h @ 37°C
    source: "Tano et al. (2007) Vaccine 25:7017; WHO TRS 961",
  },
  storage: {
    minC: -25,
    maxC: -15,
    maxExposureC: 25,
    freezeAllowed: true,
    freezeSensitivityNote: "냉동 보관 필수. 해동 후 재냉동 불가.",
  },
  vvmType: "VVM2",
  openVialUsageHours: 24,                    // 개봉 후 냉장 조건에서 24h
  notes: "WHO EPI 중 열 안정성 최저. 콜드체인 이탈 시 최우선 점검 대상.",
  isCustom: false,
};

/**
 * DTP (디프테리아-파상풍-백일해 혼합 불활화 백신)
 *
 * 동결에 매우 취약 — 흔들기 검사(Shake Test) 필수.
 * 열에는 OPV보다 강함.
 */
const DTP: VaccineProfile = {
  id: "dtp",
  name: "DTP (디프테리아·파상풍·백일해)",
  abbreviation: "DTP",
  category: "toxoid",
  arrhenius: {
    activationEnergyJ: DEFAULT_EA_J,         // 83,000 J/mol
    referenceTemperatureC: 37,
    kRefPerHour: 0.00347,                    // t½ ≈ 200h @ 37°C
    source: "WHO EPI Technical Guide; Kumru et al. (2014)",
  },
  storage: {
    minC: 2,
    maxC: 8,
    maxExposureC: 40,                        // 단기 40°C 허용 (WHO CTC 프로토콜)
    freezeAllowed: false,
    freezeSensitivityNote: "동결 절대 금지. 흡착 성분 침전 → 역가 소실 및 심각한 국소 반응.",
  },
  vvmType: "VVM14",
  openVialUsageHours: 24,                    // WHO 멀티도즈 정책
  notes: "흔들기 검사(Shake Test)로 동결 여부 반드시 확인. 동결 의심 시 즉시 폐기.",
  isCustom: false,
};

/**
 * Measles (홍역 생백신 / MR·MMR 포함)
 *
 * 빛과 열에 모두 취약한 생백신.
 * 개봉 후 6시간 내 사용.
 * Ea: 홍역 바이러스 열 불안정성 반영하여 높게 설정.
 */
const MEASLES: VaccineProfile = {
  id: "measles",
  name: "홍역 (Measles / MR / MMR)",
  abbreviation: "MR",
  category: "live_attenuated",
  arrhenius: {
    activationEnergyJ: 96_000,               // ~96 kJ/mol — 문헌 범위 90-100 kJ/mol
    referenceTemperatureC: 37,
    kRefPerHour: 0.01155,                    // t½ ≈ 60h @ 37°C
    source: "Lyons et al. (2017) Vaccine 35:2823; WHO EPI",
  },
  storage: {
    minC: -25,
    maxC: -15,
    maxExposureC: 25,
    freezeAllowed: true,
    freezeSensitivityNote: "냉동 또는 냉장(2-8°C) 모두 가능. 개봉 후 냉장.",
  },
  vvmType: "VVM2",
  openVialUsageHours: 6,
  notes: "차광 필수. 개봉 후 희석액 포함 6시간 내 사용. 빛 노출 시 즉시 역가 저하.",
  isCustom: false,
};

/**
 * Hepatitis B (B형 간염 재조합 서브유닛 백신)
 *
 * 동결에 매우 취약 (DTP와 동일 주의).
 * 열 안정성은 EPI 중 가장 높음.
 * CTC(Controlled Temperature Chain) 적용 가능.
 */
const HEP_B: VaccineProfile = {
  id: "hep_b",
  name: "B형 간염 (Hepatitis B)",
  abbreviation: "HepB",
  category: "subunit",
  arrhenius: {
    activationEnergyJ: 75_000,               // ~75 kJ/mol — 서브유닛 안정성 반영
    referenceTemperatureC: 37,
    kRefPerHour: 0.00173,                    // t½ ≈ 400h @ 37°C
    source: "WHO Prequalification; Kumru et al. (2014) Biologics 8:239",
  },
  storage: {
    minC: 2,
    maxC: 8,
    maxExposureC: 37,                        // CTC 프로토콜: 37°C 최대 수일 허용
    freezeAllowed: false,
    freezeSensitivityNote: "동결 절대 금지. 흡착 성분 침전 → 효능 소실.",
  },
  vvmType: "VVM30",
  openVialUsageHours: 168,                   // 단일도즈 개봉 즉시 사용; 멀티도즈 7일(WHO)
  notes: "출생 직후 접종(Birth Dose) 시 CTC 적용 가능. 흔들기 검사로 동결 확인.",
  isCustom: false,
};

// ─────────────────────────────────────────────
// 백신 레지스트리
// ─────────────────────────────────────────────

/** WHO EPI 핵심 5종 배열 */
export const EPI_VACCINES: VaccineProfile[] = [BCG, OPV, DTP, MEASLES, HEP_B];

/** ID → VaccineProfile 맵 */
export const VACCINE_MAP: Record<string, VaccineProfile> = Object.fromEntries(
  EPI_VACCINES.map((v) => [v.id, v])
);

/**
 * 백신 ID로 프로파일 조회
 * @throws Error — 존재하지 않는 ID
 */
export function getVaccineById(id: string): VaccineProfile {
  const vaccine = VACCINE_MAP[id];
  if (!vaccine) {
    throw new Error(`알 수 없는 백신 ID: "${id}". 유효한 ID: ${Object.keys(VACCINE_MAP).join(", ")}`);
  }
  return vaccine;
}

/**
 * 커스텀 백신 프로파일 생성
 * UI에서 사용자가 직접 파라미터를 입력하는 경우 사용.
 */
export function createCustomVaccine(params: {
  name: string;
  activationEnergyJ?: number;
  referenceTemperatureC: number;
  kRefPerHour: number;
  maxExposureC?: number;
  freezeAllowed?: boolean;
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
      source: "사용자 입력",
    },
    storage: {
      minC: 2,
      maxC: 8,
      maxExposureC: params.maxExposureC ?? 25,
      freezeAllowed: params.freezeAllowed ?? false,
      freezeSensitivityNote: "제조사 지침 확인 필요.",
    },
    vvmType: "VVM14",
    openVialUsageHours: 6,
    notes: "사용자 정의 백신 — 파라미터 출처 및 정확성 확인 필요.",
    isCustom: true,
  };
}

// ─────────────────────────────────────────────
// 동결 감수성 검사 (Shake Test) 판정 헬퍼
// ─────────────────────────────────────────────

/**
 * 동결 감수성 백신 여부 반환
 * DTP, Hep B, IPV 등 흡착 백신은 동결 시 즉시 폐기.
 */
export function isFreezeSensitive(vaccineId: string): boolean {
  const vaccine = VACCINE_MAP[vaccineId];
  if (!vaccine) return false;
  return !vaccine.storage.freezeAllowed;
}

// ─────────────────────────────────────────────
// 개발/QA 확인용
// ─────────────────────────────────────────────

/**
 * 전체 백신 파라미터 요약 출력 (npx tsx 실행 시)
 */
export function printVaccineSummary(): void {
  console.log("\n=== VaxGuard 백신 파라미터 DB ===\n");
  for (const v of EPI_VACCINES) {
    const ea_kJ = (v.arrhenius.activationEnergyJ / 1000).toFixed(0);
    const t_half = (Math.LN2 / v.arrhenius.kRefPerHour).toFixed(0);
    console.log(
      `[${v.abbreviation.padEnd(6)}] Ea=${ea_kJ} kJ/mol | ` +
      `k_ref=${v.arrhenius.kRefPerHour} /h | ` +
      `t½≈${t_half}h @ ${v.arrhenius.referenceTemperatureC}°C | ` +
      `VVM: ${v.vvmType} | ` +
      `동결: ${v.storage.freezeAllowed ? "허용" : "금지"}`
    );
  }
  console.log("\n총", EPI_VACCINES.length, "종 로드 완료.\n");
}
printVaccineSummary();