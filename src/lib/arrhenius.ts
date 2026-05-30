/**
 * arrhenius.ts — VaxGuard MKT 계산 엔진
 *
 * WHO/FDA/EU 공식 표준 Mean Kinetic Temperature 계산.
 * Arrhenius 기반, 빈도인자(A)는 비율 계산에서 소거됨.
 *
 * 참고 문헌:
 *   - WHO Technical Report Series No. 961, Annex 9 (2011)
 *   - ICH Q1E Guideline: Evaluation for Stability Data
 *   - Haynes, J.D. (1971) J. Pharm. Sci. 60, 927-929
 */

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

/** 기체상수 [J / mol·K] */
export const R_CONST = 8.314;

/** WHO 기본 활성화 에너지 [J/mol] (83 kJ/mol = ΔH/R ≈ 10,000 K) */
export const DEFAULT_EA_J = 83_000;

/** 절대온도 변환 오프셋 */
const KELVIN_OFFSET = 273.15;

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

/** 단일 온도 노출 구간 */
export interface TemperatureInterval {
  /** 노출 온도 [°C] */
  temperatureC: number;
  /** 노출 시간 [hours] */
  durationHours: number;
}

/** MKT 계산 입력 */
export interface MKTInput {
  /** 온도 이력 배열 */
  intervals: TemperatureInterval[];
  /** 활성화 에너지 [J/mol] — 생략 시 WHO 기본값(83,000 J/mol) 사용 */
  activationEnergyJ?: number;
}

/** MKT 계산 결과 */
export interface MKTResult {
  /** Mean Kinetic Temperature [°C] */
  mktC: number;
  /** Mean Kinetic Temperature [K] */
  mktK: number;
  /** 단순 산술 평균 온도 [°C] (참조용) */
  arithmeticMeanC: number;
  /** 총 노출 시간 [hours] */
  totalHours: number;
  /** 사용된 활성화 에너지 [J/mol] */
  activationEnergyJ: number;
  /** 각 구간별 Arrhenius 항 exp(Ea/RT) 배열 (디버그용) */
  arrheniusTerms: number[];
}

/** 잔존 역가 계산 입력 */
export interface PotencyInput {
  /** MKT 계산 결과 */
  mkt: MKTResult;
  /** 초기 역가 [%] — 보통 100 */
  initialPotency: number;
  /** 참조 온도 [°C] — 각 백신의 k_ref 기준 온도 */
  referenceTemperatureC: number;
  /** 참조 온도에서의 1차 분해 속도 상수 [1/hour] */
  kRefPerHour: number;
  /** 총 노출 시간 [hours] */
  exposureHours: number;
  /** 활성화 에너지 [J/mol] */
  activationEnergyJ?: number;
}

/** 잔존 역가 계산 결과 */
export interface PotencyResult {
  /** 잔존 역가 [%] */
  remainingPotency: number;
  /** 역가 손실 [%] */
  potencyLoss: number;
  /** 최종 판정 */
  verdict: VerdictLevel;
  /** 판정 상세 메시지 */
  verdictMessage: string;
  /** 권고 조치 */
  recommendedAction: string;
}

/** 판정 등급 */
export type VerdictLevel = "USABLE" | "CONDITIONAL" | "DISCARD";

/** 종합 판정 결과 (MKT + 역가) */
export interface VaxGuardResult {
  mkt: MKTResult;
  potency: PotencyResult;
  /** 계산 타임스탬프 (ISO 8601) */
  calculatedAt: string;
}

// ─────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────

/**
 * 섭씨 → 켈빈 변환
 */
export function celsiusToKelvin(celsius: number): number {
  return celsius + KELVIN_OFFSET;
}

/**
 * 켈빈 → 섭씨 변환
 */
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - KELVIN_OFFSET;
}

/**
 * 입력값 유효성 검사
 * @throws Error — 유효하지 않은 입력값
 */
function validateMKTInput(input: MKTInput): void {
  if (!input.intervals || input.intervals.length === 0) {
    throw new Error("온도 이력이 비어 있습니다. 최소 1개 이상의 구간이 필요합니다.");
  }

  for (let i = 0; i < input.intervals.length; i++) {
    const interval = input.intervals[i];

    if (typeof interval.temperatureC !== "number" || isNaN(interval.temperatureC)) {
      throw new Error(`구간 ${i + 1}: 온도값이 유효하지 않습니다.`);
    }
    if (typeof interval.durationHours !== "number" || isNaN(interval.durationHours)) {
      throw new Error(`구간 ${i + 1}: 시간값이 유효하지 않습니다.`);
    }
    if (interval.durationHours < 0) {
      throw new Error(`구간 ${i + 1}: 노출 시간은 0 이상이어야 합니다.`);
    }
    // 물리적으로 가능한 온도 범위 (-80°C ~ 100°C)
    if (interval.temperatureC < -80 || interval.temperatureC > 100) {
      throw new Error(
        `구간 ${i + 1}: 온도 ${interval.temperatureC}°C는 허용 범위(-80~100°C)를 벗어났습니다.`
      );
    }
  }

  const Ea = input.activationEnergyJ ?? DEFAULT_EA_J;
  if (Ea <= 0) {
    throw new Error("활성화 에너지는 양수여야 합니다.");
  }
}

// ─────────────────────────────────────────────
// 핵심 계산 함수
// ─────────────────────────────────────────────

/**
 * WHO 표준 MKT 계산
 *
 * 공식:
 *   T_MKT = (Ea/R) / ln[ (1/n) × Σ exp(Ea / R·Tᵢ) ]
 *
 * 시간 가중치 적용 (구간별 노출 시간이 다를 경우):
 *   T_MKT = (Ea/R) / ln[ Σ(tᵢ × exp(Ea/R·Tᵢ)) / Σtᵢ ]
 *
 * @param input MKT 계산 입력값
 * @returns MKT 계산 결과
 */
export function calculateMKT(input: MKTInput): MKTResult {
  validateMKTInput(input);

  const Ea = input.activationEnergyJ ?? DEFAULT_EA_J;
  const EaOverR = Ea / R_CONST; // [K] — Arrhenius 지수항의 분자

  const { intervals } = input;

  // 총 노출 시간 계산
  const totalHours = intervals.reduce((sum, iv) => sum + iv.durationHours, 0);

  // 시간 가중 Arrhenius 합산
  // Σ [ tᵢ × exp(Ea / R·Tᵢ) ]
  const arrheniusTerms: number[] = [];
  let weightedSum = 0;

  for (const interval of intervals) {
    const Tk = celsiusToKelvin(interval.temperatureC);
    const term = Math.exp(EaOverR / Tk); // exp(Ea / R·T)
    arrheniusTerms.push(term);
    weightedSum += interval.durationHours * term;
  }

  // 시간 가중 평균: Σ(tᵢ·termᵢ) / Σtᵢ
  const weightedMean = weightedSum / totalHours;

  // T_MKT [K] = (Ea/R) / ln(weightedMean)
  const mktK = EaOverR / Math.log(weightedMean);
  const mktC = kelvinToCelsius(mktK);

  // 산술 평균 (참조용)
  const arithmeticMeanC =
    intervals.reduce((sum, iv) => sum + iv.temperatureC * iv.durationHours, 0) / totalHours;

  return {
    mktC,
    mktK,
    arithmeticMeanC,
    totalHours,
    activationEnergyJ: Ea,
    arrheniusTerms,
  };
}

/**
 * 잔존 역가 계산 (Arrhenius 1차 반응 모델)
 *
 * 공식:
 *   P(t) = P₀ × exp( -k_ref × t × exp[-Ea/R × (1/T_MKT - 1/T_ref)] )
 *
 * 1/T_MKT > 1/T_ref 이면 T_MKT < T_ref → 분해가 느림
 * 1/T_MKT < 1/T_ref 이면 T_MKT > T_ref → 분해가 빠름
 *
 * @param input 잔존 역가 계산 입력값
 * @returns 잔존 역가 및 판정 결과
 */
export function calculateRemainingPotency(input: PotencyInput): PotencyResult {
  const {
    mkt,
    initialPotency,
    referenceTemperatureC,
    kRefPerHour,
    exposureHours,
  } = input;

  const Ea = input.activationEnergyJ ?? mkt.activationEnergyJ ?? DEFAULT_EA_J;
  const EaOverR = Ea / R_CONST;

  const T_mkt = mkt.mktK; // [K]
  const T_ref = celsiusToKelvin(referenceTemperatureC); // [K]

  // Arrhenius 보정 인자: exp[-Ea/R × (1/T_MKT - 1/T_ref)]
  const arrheniusFactor = Math.exp(-EaOverR * (1 / T_mkt - 1 / T_ref));

  // 유효 속도 상수: k_eff = k_ref × Arrhenius 보정
  const kEff = kRefPerHour * arrheniusFactor;

  // 잔존 역가: P = P₀ × exp(-k_eff × t)
  const remainingPotency = initialPotency * Math.exp(-kEff * exposureHours);

  // 역가 손실 [%]
  const potencyLoss = initialPotency - remainingPotency;

  // 판정
  const { verdict, verdictMessage, recommendedAction } = determineVerdict(
    remainingPotency,
    initialPotency
  );

  return {
    remainingPotency,
    potencyLoss,
    verdict,
    verdictMessage,
    recommendedAction,
  };
}

/**
 * 판정 기준 적용
 *
 * WHO EPI 기준:
 *   ≥ 80%  → USABLE   (사용 가능)
 *   60~80% → CONDITIONAL (조건부 사용 — 즉시 접종, 보고 필요)
 *   < 60%  → DISCARD  (즉시 폐기)
 */
function determineVerdict(
  remainingPotency: number,
  initialPotency: number
): Pick<PotencyResult, "verdict" | "verdictMessage" | "recommendedAction"> {
  const ratio = (remainingPotency / initialPotency) * 100;

  if (ratio >= 80) {
    return {
      verdict: "USABLE",
      verdictMessage: "Potency maintained — vaccine is safe to use.",
      recommendedAction: "Administer following standard protocol.",
    };
  } else if (ratio >= 60) {
    return {
      verdict: "CONDITIONAL",
      verdictMessage: "Potency partially degraded — conditional use only.",
      recommendedAction:
        "Administer immediately and report to health authorities. Prevent further cold chain breaks.",
    };
  } else {
    return {
      verdict: "DISCARD",
      verdictMessage: "Potency below acceptable threshold — do not use.",
      recommendedAction:
        "Discard immediately. Complete disposal record and report to supervisory authority.",
    };
  }
}

// ─────────────────────────────────────────────
// 통합 계산 함수
// ─────────────────────────────────────────────

/**
 * VaxGuard 종합 판정 계산
 * MKT 계산과 잔존 역가 계산을 한 번에 수행합니다.
 *
 * @param intervals 온도 이력
 * @param vaccineParams 백신별 파라미터 (Ea, k_ref, T_ref)
 * @param initialPotency 초기 역가 [%] (기본값: 100)
 */
export function runVaxGuardCalculation(
  intervals: TemperatureInterval[],
  vaccineParams: {
    activationEnergyJ: number;
    kRefPerHour: number;
    referenceTemperatureC: number;
  },
  initialPotency = 100
): VaxGuardResult {
  // Step 1: MKT 계산
  const mkt = calculateMKT({
    intervals,
    activationEnergyJ: vaccineParams.activationEnergyJ,
  });

  // Step 2: 잔존 역가 계산
  const totalHours = mkt.totalHours;
  const potency = calculateRemainingPotency({
    mkt,
    initialPotency,
    referenceTemperatureC: vaccineParams.referenceTemperatureC,
    kRefPerHour: vaccineParams.kRefPerHour,
    exposureHours: totalHours,
    activationEnergyJ: vaccineParams.activationEnergyJ,
  });

  return {
    mkt,
    potency,
    calculatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// 단위 테스트용 헬퍼 (개발/QA 전용)
// ─────────────────────────────────────────────

/**
 * WHO TRS 961 Annex 9 예제 검증용
 *
 * 예시 케이스:
 *   25°C 24h → 37°C 24h → 8°C 24h
 *   Ea = 83,000 J/mol
 *   예상 MKT ≈ 26.7°C (WHO 문서 기준)
 */
export function runWHOValidationExample(): MKTResult {
  return calculateMKT({
    intervals: [
      { temperatureC: 25, durationHours: 24 },
      { temperatureC: 37, durationHours: 24 },
      { temperatureC: 8, durationHours: 24 },
    ],
    activationEnergyJ: DEFAULT_EA_J,
  });
}
// arrhenius.ts 맨 끝에 추가
const r = runWHOValidationExample();
console.log("WHO 검증 MKT:", r.mktC.toFixed(2), "°C");