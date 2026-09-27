# VaxGuard — Data and Logic Validation

This document records how VaxGuard's verdict logic and vaccine data were checked against WHO guidance.

- **Validation date:** 2026-09-27
- **App version:** 1.2.0
- **Scope:** verdict logic, MKT calculation, and 12 presets (BCG, OPV, DTP, Measles/MR/MMR, Hepatitis B, Td/TT, PCV, IPV, Rotavirus, Yellow fever, Meningococcal conjugate, Oral cholera)

> **Disclaimer.** VaxGuard is a decision-support tool for cold chain excursions, not a substitute for national guidelines, the product insert, or a supervisor's decision. When in doubt, do not use the vaccine.

## Status key

| Status | Meaning |
|---|---|
| ✅ Verified | Matches the cited WHO source |
| ⏳ To verify | Not yet confirmed in the primary document or per product; shown conservatively |
| ⚠️ Conservative | WHO sources disagree or give no basis; the app takes the safer option |

## Version history

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-09-26 | MKT sign fix; WHO-aligned verdict (VVM and shake test); 5 presets corrected against WHO |
| 1.2.0 | 2026-09-27 | 7 presets added; unsourced Arrhenius parameters removed from all presets; potency estimate shown for custom vaccines only |

## Summary of corrections

| Area | Before | After | Source |
|---|---|---|---|
| MKT formula | Sign error: `exp(+Ea/RT)` gave MKT below the arithmetic mean (25/37/8 °C → 15.7 °C) | `exp(−Ea/RT)`; same case → 29.2 °C | USP ⟨1079⟩ (Haynes 1971); independent Python check |
| Verdict basis | Remaining potency % (80% usable / 60% conditional) | VVM and shake test only | WHO has no potency-% threshold (WHO/PQS/E006/IN05.4) |
| "Conditional: administer immediately" | Shown for 60–80% estimate | Removed | No WHO basis |
| Freeze exposure | Not assessed (low temperature lowered MKT and looked "safe") | 0 °C or below on a freeze-sensitive vaccine triggers a shake test or Hold | WHO/IVB/15.04; Kartoglu et al. 2010 |
| VVM not checked | Calculation alone could give "Usable" | Hold | Conservative rule; VVM is WHO's heat criterion |
| Open-vial rule | OPV and DTP 24 h, HepB 7 days | Up to 28 days if MDVP conditions met | WHO/IVB/14.07 (2014) |
| Open-vial rule | BCG and measles 6 h | 6 h or end of session, whichever first | WHO/IVB/14.07 (2014) |
| Exposure limits | DTP 40 °C and HepB 37 °C ("CTC protocol"); 25 °C for others | Removed | No DTP or HepB product is WHO-approved for CTC |
| VVM type | BCG and measles VVM2 | Product-specific | WHO/IVB/06.10 §2 (VVM2 is the OPV category) |
| Measles storage | −25 to −15 °C | 2–8 °C; freezer optional at higher levels | WHO/IVB/06.10; WHO/IVB/15.04 §2.2 |
| Diluent | Not flagged | Freeze-dried vaccines: diluent must never be frozen | WHO/IVB/15.04 §2.1.5 |
| Shake-test scope | Any freeze-sensitive vaccine | Aluminium-adsorbed vaccines only; others Hold | Kartoglu et al. 2010 |
| Arrhenius parameters | Per-preset Ea and half-life values | Removed from all presets; potency estimate only for custom vaccines with user-entered parameters | No WHO or peer-reviewed source found |
| Citations | Tano 2007 (Vaccine 25:7017), Lyons 2017 (Vaccine 35:2823), "Kumru 2014, Biologics 8:239" | Removed. The first two do not exist at those pages; Kumru is Biologicals 42:237–259 and does not supply the app's values | Crossref, PubMed checks |

## Verdict logic

Implemented in `src/lib/verdict.ts`, tested in `src/lib/verdict.test.ts`.

| Order | Condition | Verdict | Basis | Status |
|---|---|---|---|---|
| 1 | VVM at stage 3 (square matches circle) or stage 4 | Discard | WHO/PQS/E006/IN05.4 §3, §4.2.1: end point and beyond, do not use | ✅ |
| 2 | Freeze-sensitive, exposed to 0 °C or below, aluminium-adsorbed, shake test failed | Discard | Kartoglu et al. 2010 | ✅ |
| 3 | As above, shake test not done | Hold | Conservative | ✅ |
| 4 | Freeze-sensitive, exposed to 0 °C or below, not adsorbed | Hold | Shake test not validated (WHO/IVB/15.04 §2.1.4) | ✅ |
| 5 | VVM not checked | Hold | Conservative | ✅ |
| 6 | Otherwise | Usable | — | ✅ |

Warnings (never change the verdict): VVM stage 2 "use first" (WHO/PQS/E006/IN05.4 §1); potency estimate below 80% (custom vaccines only).

**Freeze trigger.** 0 °C or below. WHO advises never exposing freeze-sensitive vaccines to zero or subzero temperatures. The PQS freeze-indicator trigger (−0.5 °C ± 0.5 °C for 60 min, WHO/PQS/E06/IN03.1) is less conservative. ✅

**VVM stages.** Stages 1–4 are a common field convention. WHO describes the colour change as continuous. The app maps stages 1–2 to usable (2 = use first) and 3–4 to discard. ✅

## MKT calculation

Implemented in `src/lib/arrhenius.ts`, tested in `src/lib/arrhenius.test.ts`.

- **Formula:** T_MKT = (Ea/R) / −ln[ Σ tᵢ·exp(−Ea/(R·Tᵢ)) / Σ tᵢ ], time-weighted form of USP ⟨1079⟩ (Haynes 1971).
- **Constants:** Ea = 83,000 J/mol, R = 8.314 J/(mol·K). USP uses ΔH = 83.144 kJ/mol; the difference changes MKT by less than 0.05 °C.
- **Attribution:** WHO TRS 961 Annex 9 does not define MKT or give a worked example.
- **Use:** MKT is shown for every vaccine as a reporting value. It never decides the verdict.

| Test case | Expected | App | Status |
|---|---|---|---|
| Single interval at 25 °C | 25.0 °C | 25.0 °C | ✅ |
| 25 / 37 / 8 °C, 24 h each | 29.2 °C (Python, independent) | 29.2 °C | ✅ |
| MKT ≥ time-weighted arithmetic mean | Always | Holds | ✅ |
| Duration weighting (48 h at 25 °C = 2 × 24 h) | Equal | Equal | ✅ |

## Potency estimate

A first-order Arrhenius model applied at the MKT. **No preset carries Arrhenius parameters**, because no WHO or peer-reviewed source was found for them. The estimate is shown only for custom vaccines, using parameters the user enters from manufacturer stability data, and is labelled as a reference value. It never decides the verdict.

## Per-vaccine data

Implemented in `src/lib/vaccines.ts`, tested in `src/lib/vaccines.test.ts`. Presets are keyed by antigen; items that vary by product are marked "product-specific" and shown as guidance only. Storage ranges are for the health-facility level, where the app is used. No preset is listed as CTC-approved in the app's data; CTC notes appear only as text.

### BCG

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; freezer optional at higher levels | WHO/IVB/06.10 §1; WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Vaccine not damaged; diluent must never be frozen | WHO/IVB/15.04 Table 2, §2.1.5 | ✅ |
| VVM | Product-specific (VVM30 or VVM14 by manufacturer) | WHO/IVB/06.10 §2 | ✅ (product ⏳) |
| Open vial | 6 h or end of session | WHO/IVB/14.07 | ✅ (page ⏳) |

### OPV

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C at facility; −25 to −15 °C required at higher levels | WHO/IVB/15.04 §2.2; WHO/IVB/06.10 §1 | ✅ |
| Freezing | Not damaged | WHO/IVB/15.04 Table 2 | ✅ |
| Freeze–thaw limit | Refer to product insert | WHO/IVB/06.10 §12.2 | ⏳ |
| VVM | VVM2 | WHO/IVB/06.10 §2 | ✅ |
| Open vial | Up to 28 days if MDVP conditions met | WHO/IVB/14.07 | ✅ |

### DTP (incl. pentavalent)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; never freeze | WHO/IVB/06.10 §1 | ✅ |
| Freezing | Damaged (aluminium adjuvant); shake test valid | WHO/IVB/15.04 §2.1.4; Kartoglu 2010 | ✅ |
| VVM | Product-specific | WHO/IVB/06.10 §2 | ✅ (product ⏳) |
| Open vial | Up to 28 days if MDVP conditions met | WHO/IVB/14.07 | ✅ |
| CTC | Not approved | WHO CTC table | ✅ |

### Measles / MR / MMR

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; freezer optional at higher levels | WHO/IVB/06.10 Fig. 1; WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Vaccine not damaged; diluent must never be frozen | WHO/IVB/15.04 Table 2 | ✅ |
| VVM | Product-specific | WHO/IVB/06.10 §2 | ✅ (product ⏳) |
| Open vial | 6 h or end of session | WHO/IVB/14.07; SII MR package insert 2022 | ✅ |

### Hepatitis B

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; never freeze | WHO/IVB/06.10 Fig. 1 | ✅ |
| Freezing | Damaged (aluminium adjuvant); shake test valid | WHO/IVB/15.04 Table 2; Kartoglu 2010 | ✅ |
| VVM | VVM30 | WHO/IVB/06.10 §2 | ✅ (product ⏳) |
| Open vial | Up to 28 days if MDVP conditions met | WHO/IVB/14.07 | ✅ |
| CTC | Not approved (out-of-cold-chain use in WHO/IVB/06.10 §6.3 is not CTC) | WHO CTC table | ✅ |

### Td / TT (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; never freeze | WHO/IVB/06.10 Fig. 1 | ✅ |
| Freezing | Damaged (aluminium adjuvant); shake test valid | WHO/IVB/15.04 Table 2; Kartoglu 2010 | ✅ |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | Up to 28 days if MDVP conditions met | WHO/IVB/14.07; SIIPL dT package insert (UNICEF 2026) | ✅ |
| CTC | Not approved | WHO CTC table | ✅ |

### PCV (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; never freeze | WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Damaged (aluminium adjuvant); shake test valid | WHO/IVB/15.04 Table 2 | ✅ |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | Product-specific: 4-dose vials with 2-phenoxyethanol up to 28 days if MDVP conditions met; unpreserved presentations end of session | Gavi PCV 4-dose FAQ; WHO/IVB/14.07 | ⏳ per product |
| CTC | Not approved | WHO CTC table | ✅ |

### IPV (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; never freeze | WHO/IVB/06.10 Fig. 1 | ✅ |
| Freezing | Damaged; not adsorbed, so the shake test is not valid → Hold after freeze exposure | WHO/IVB/15.04 §2.1.4, Table 2 | ✅ |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | Product-specific | WHO/IVB/14.07 | ⏳ per product |
| CTC | Not approved | WHO CTC table | ✅ |

### Rotavirus (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C | WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Treated as freeze-sensitive without a valid shake test → Hold after freeze exposure; follow the product insert | WHO/IVB/15.04 Table 2 lists rotavirus as not damaged; WHO/PATH training slides (2014) say to follow the product insert for liquid rotavirus | ⚠️ Conservative |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | Product-specific | WHO PQ | ⏳ per product |
| CTC | Not approved | WHO CTC table | ✅ |

### Yellow fever (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; freezer optional at higher levels | WHO/IVB/06.10 §1; WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Vaccine not damaged; diluent must never be frozen | WHO/IVB/15.04 Table 2, §2.1.5 | ✅ |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | 6 h or end of session | WHO/IVB/14.07 | ✅ |
| CTC | Not approved | WHO CTC table | ✅ |

### Meningococcal conjugate, freeze-dried (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Scope | Freeze-dried conjugates such as MenAfriVac and MenFive. Liquid MenC products are not covered | WHO/IVB/15.04 Table 2 | ✅ |
| Storage | 2–8 °C | WHO/IVB/15.04 §2.2 | ✅ |
| Freezing | Lyophilized vaccine not damaged; diluent must never be frozen | WHO/IVB/15.04 Table 2 | ✅ |
| VVM | Product-specific | WHO PQ | ✅ (product ⏳) |
| Open vial | 6 h or end of session | WHO/IVB/14.07 | ✅ |
| CTC | Note only: MenAfriVac 40 °C for 4 days; MenFive 40 °C for 15 days | WHO CTC table | ✅ (not used in the verdict) |

### Oral cholera vaccine (added in 1.2.0)

| Item | App value | WHO reference | Status |
|---|---|---|---|
| Storage | 2–8 °C; should not be frozen | Euvichol-S WHOPAR (2025) | ✅ |
| Freezing | Damaged; not adsorbed, so the shake test is not valid → Hold after freeze exposure | WHO/IVB/15.04 Table 2 | ✅ |
| VVM | Product-specific (Euvichol-S: VVM30) | Euvichol-S WHOPAR (2025) | ✅ (product ⏳) |
| Open vial | Product-specific (Euvichol-S: single-dose) | Euvichol-S WHOPAR; WHO PQ | ⏳ per product |
| CTC | Note only: some products approved; check the current WHO CTC list | WHO CTC table; PATH OCV CTC brief (Feb 2026) | ⏳ |

### Not included: COVID-19

Storage differs widely between products (ultra-cold mRNA vs 2–8 °C protein vaccines), and several products have been delisted since 2024. A single antigen-level preset would be unsafe; product-level presets may be added separately if needed.

### Custom vaccines

Defaults are conservative: VVM unknown, open-vial rule unknown, freezing not allowed, shake test not valid. The user selects the freezing behaviour (unknown / not damaged / damaged and adsorbed / damaged and not adsorbed). The potency estimate is calculated from user-entered parameters.

## Shake test (help text)

| Item | App text | Source | Status |
|---|---|---|---|
| Control vial | Same vaccine, manufacturer and batch; frozen solid (at least 10 h at −10 °C or colder), then thawed | WHO-derived training; WHO/IVB/06.10 Annex 1 | ⏳ (Annex 1 not opened) |
| Shaking | Together, vigorously, about 10–15 s | Same | ⏳ |
| Observation | Side by side, up to 30 min | Same | ⏳ |
| Pass/fail | Slower sedimentation than control = pass; same or faster = fail | Kartoglu et al. 2010 | ✅ |
| Scope | Aluminium-adsorbed vaccines only | Kartoglu et al. 2010 (100% sensitivity and specificity in 475 vials of 8 adsorbed types) | ✅ |

## Known limitations

1. **Product-level data.** VVM type, open-vial eligibility and CTC status vary by product. The app shows these as "product-specific" guidance; they never decide the verdict.
2. **No potency estimate for presets.** A future option is to derive Ea from the WHO VVM reaction-rate table, but a reference rate constant would still be needed.
3. **Pending items (⏳)** should be checked against the primary PDFs (WHO/IVB/14.07 page numbers, WHO/IVB/06.10 Annex 1) and WHO PQ product pages.
4. **History records** saved before 1.1.0 used the incorrect MKT formula; they are flagged in the History screen and shown as Hold.

## Automated tests

`npm test` runs 32 tests:

- `arrhenius.test.ts` (6): MKT formula and potency model
- `verdict.test.ts` (15): decision order, freeze exposure, shake-test scope, warnings
- `vaccines.test.ts` (11): preset values in this document

## Sources

1. WHO. *Temperature sensitivity of vaccines.* WHO/IVB/06.10. 2006.
2. WHO. *Vaccine Management Handbook, Module VMH-E2: How to manage vaccines in the cold chain.* WHO/IVB/15.04. 2015.
3. WHO. *Policy statement: the use of opened multi-dose vaccine vials in subsequent immunization sessions* (2014 revision). WHO/IVB/14.07.
4. WHO. *PQS performance specification: Vaccine vial monitor.* WHO/PQS/E006/IN05.4. 2020.
5. WHO. *PQS performance specification: Electronic freeze indicator.* WHO/PQS/E06/IN03.1. 2006.
6. WHO. *Table of vaccines prequalified for use in a controlled temperature chain* (web, accessed September 2026).
7. WHO Prequalification. *Euvichol-S WHO Public Assessment Report.* 2025.
8. Serum Institute of India. *Diphtheria and tetanus vaccine adsorbed (dT) package insert* (UNICEF, 2026).
9. Gavi. *Pneumococcal conjugate vaccine 4-dose vial presentations: FAQ.*
10. Kartoglu Ü, Özgüler NK, Wolfson LJ, Kurzątkowski W. Validation of the shake test for detecting freeze damage to adsorbed vaccines. *Bull World Health Organ* 2010;88:624–631.
11. USP General Chapter ⟨1079⟩; Haynes JD. Worldwide virtual temperatures for product stability testing. *J Pharm Sci* 1971;60:927–929.
12. Kumru OS, et al. Vaccine instability in the cold chain: mechanisms, analysis and formulation strategies. *Biologicals* 2014;42(5):237–259.