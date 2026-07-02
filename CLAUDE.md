# VaxGuard — Project Context

## 프로젝트 개요

저개발국 현장 보건요원(CHW)을 위한 오프라인 우선 PWA 앱.
WHO MKT(Mean Kinetic Temperature) 기반 백신 열화 판정 도구.
EpiCalc Suite의 네 번째 모듈 (Module 4).

- EpiCalc (Module 1): https://epi.chem-health-calc.com
- EpiLog (Module 2): https://epilog-d72.pages.dev
- EpiAid (Module 3): https://epiaid.pages.dev
- VaxGuard (Module 4): https://vaxguard.pages.dev ✅


## 배포 상태

- **URL**: https://vaxguard.pages.dev (Cloudflare Pages) ✅
- **GitHub**: whlee5503-dot/VaxGuard (Public, MIT) ✅
- **Zenodo DOI**: 10.5281/zenodo.20473758 ✅
- **DPGA**: GID0093724 (UNDER REVIEW) ✅
- **PWA**: 완성 ✅


## 기술 스택

- React + Vite + TypeScript
- Tailwind CSS v4
- PWA (Vite PWA Plugin + Workbox) — 2G/3G 최적화
- localStorage (오프라인 판정 기록)
- Cloudflare Pages 배포
- i18next (EN/FR/SW/KO 4개 언어)


## 핵심 계산 엔진

### MKT 공식 (WHO/ICH Q1E 표준)
```
T_MKT = (Ea/R) / ln[ (1/n) × Σ exp(Ea/R·Tᵢ) ]
```

### 잔존 역가
```
P(t) = P₀ × exp(-k_ref × t × exp[-Ea/R × (1/T_MKT - 1/T_ref)])
```

- 기본 Ea: 83,000 J/mol (WHO 표준값)
- R: 8.314 J/mol·K


## 판정 기준

| 잔존 역가 | 판정 |
|---|---|
| ≥ 80% | ✅ USE — 사용 가능 |
| 60–79% | ⚠️ CONDITIONAL — 즉시 사용, 보고 필요 |
| < 60% | ❌ DISCARD — 즉시 폐기 |


## 디자인 원칙

- EpiCalc Suite 브랜딩 통일 (forest green #1a6b4a, DM Sans)
- 비전문가(CHW)도 즉시 사용 가능한 UX
- 2G/3G 환경 최적화 (gzip ~108KB)
- 영/불/스와힐리/한 4개 언어 지원
- 오프라인 우선 — 모든 계산 클라이언트 사이드


## 개발자

Won Ho Lee, Ph.D., MPH, MDiv
(MD 아님 — 모든 문서에서 MD 표기 금지)


## 개발 현황

### v1.0.0 — 완료 (2026-05-31) ✅

1. MKT 계산 엔진 (arrhenius.ts)
2. 백신 파라미터 DB (vaccines.ts) — WHO EPI 5종 + 커스텀
3. 온도 이력 입력 UI (Input.tsx)
4. 판정 결과 화면 (Result.tsx)
5. VVM 시각 표시 (VVMIndicator.tsx)
6. 기록 조회 (History.tsx)
7. WhatsApp/Email/JSON 공유 (exportData.ts)
8. 다크/라이트 모드 (ThemeContext.tsx)
9. 4개 언어 지원 (i18n.ts + locales/)
10. PWA 오프라인 설정
11. README.md + LICENSE + Zenodo DOI
12. DPGA 심사 제출 (GID0093724)

## Lighthouse 점수 (Mobile, Incognito, 2026-06-01)

| 항목 | VaxGuard | EpiAid | EpiLog | EpiCalc |
|---|---|---|---|---|
| Performance | 98 ✅ | 92 ✅ | 94 ✅ | 71 🟡 |
| Accessibility | 94 ✅ | 95 ✅ | 93 ✅ | 93 ✅ |
| Best Practices | 100 ✅ | 100 ✅ | 100 ✅ | 100 ✅ |
| SEO | 82 🟡 | 91 ✅ | 82 🟡 | 91 ✅ |

EpiCalc Performance 71점 — SIR/SEIR 시뮬레이션, 통계 차트 등 계산 엔진이 무거워 번들 크기가 큼. 나머지 3개 앱은 모두 90점 이상.

## EpiCalc Suite DOI

- EpiCalc (Module 1): 10.5281/zenodo.20181520
- EpiLog (Module 2): 10.5281/zenodo.20349994
- EpiAid (Module 3): 10.5281/zenodo.20436469
- VaxGuard (Module 4): 10.5281/zenodo.20473758


## 중요 원칙

- 모든 판정 결과에 면책 고지 필수:
  "This app is a decision-support tool, not a replacement for clinical judgment"
- WHO MKT/VVM 표준 준수
- EpiAid/EpiLog/EpiCalc 디자인 패턴 일관성 유지
- 개인정보 수집 없음 — 모든 데이터 기기 내 저장
