# 🛡️ VaxGuard

**Vaccine cold chain decision support for community health workers, aligned with WHO guidance**

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://github.com/whlee5503-dot/VaxGuard/blob/main/LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20ready-purple?style=flat-square)](https://vaxguard.phtlab.org)
[![Deployed](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange?style=flat-square)](https://vaxguard.phtlab.org)
[![Validated](https://img.shields.io/badge/Validated-WHO%20guidance-blue?style=flat-square)](VALIDATION.md)
[![Tests](https://img.shields.io/badge/Tests-30%20passing-brightgreen?style=flat-square)](VALIDATION.md#automated-tests)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20473758.svg)](https://doi.org/10.5281/zenodo.20473758)

**DPG ID: [GID0093724](https://digitalpublicgoods.net/r/vaxguard)** · **[Open the app →](https://vaxguard.phtlab.org)** (also at [vaxguard.pages.dev](https://vaxguard.pages.dev))

---

## Overview

VaxGuard helps community health workers (CHWs), clinic staff and field health workers decide what to do with a vaccine after a cold chain break. It is part of the [PHT Lab family](#pht-lab-family) of free, open-source public health tools built for field use.

- **Offline-first**: installable PWA; everything runs on the device after the first visit
- **Free and open**: MIT licensed, no login, no ads
- **Private**: assessment history stays in the browser on the device

---

## Disclaimer

> **VaxGuard is a decision-support tool. It does not replace national immunization guidelines, the product insert, or a supervisor's decision.** When in doubt, do not use the vaccine and ask your supervisor.

---

## How VaxGuard decides

The verdict comes **only from what the health worker checks on the vial**: the vaccine vial monitor (VVM) and, after freezing, the shake test. The temperature calculation is a reference value for reporting and never decides the verdict.

| Order | Condition | Verdict |
|---|---|---|
| 1 | VVM at stage 3 or 4 (discard point reached) | 🚫 Discard |
| 2 | Freeze-sensitive vaccine exposed to 0 °C or below, aluminium-adsorbed, shake test **failed** | 🚫 Discard |
| 3 | As above, shake test **not done** | ⏸️ Hold |
| 4 | Freeze-sensitive vaccine exposed to 0 °C or below, not adsorbed (shake test not valid) | ⏸️ Hold |
| 5 | VVM not checked | ⏸️ Hold |
| 6 | None of the above | ✅ Usable |

Warnings that do not change the verdict: VVM stage 2 ("use first") and a low potency estimate. Each result shows the reasons and the recommended action.

---

## Features

| Feature | Description |
|---|---|
| ✅ **WHO-aligned verdict** | Usable / Hold / Discard from VVM and shake test, with reasons and recommended action |
| ❄️ **Freeze check** | Shake test prompt for aluminium-adsorbed vaccines exposed to 0 °C or below |
| 💉 **5 WHO EPI presets** | BCG, OPV, DTP/Penta, Measles/MR/MMR, Hepatitis B, with storage, open-vial rule and diluent warnings |
| 🧪 **Custom vaccines** | User parameters with explicit freezing behaviour; conservative defaults |
| 🌡️ **MKT and potency estimate** | Mean kinetic temperature and an Arrhenius potency estimate, shown as reference values |
| 📖 **Built-in guide** | Decision order, reading the VVM, shake test procedure, entering temperature intervals |
| 📤 **Share and export** | Device share menu (WhatsApp, email, messages) with clipboard fallback; JSON export |
| 🌍 **4 languages** | English, French, Swahili, Korean |
| 📱 **PWA** | Installable, works without internet, dark and light modes |

---

## Validation

VaxGuard's verdict logic and preset data were cross-checked against WHO guidance in September 2026. Every item, its source and its status are listed in **[VALIDATION.md](VALIDATION.md)**.

Main corrections in version 1.1.0:

- **MKT formula**: fixed a sign error that under-estimated heat exposure (25/37/8 °C for 24 h each now gives 29.2 °C, confirmed independently).
- **Verdict**: removed the potency-percentage thresholds (80% / 60%), which have no WHO basis. The verdict now follows the VVM and the shake test.
- **Preset data**: open-vial rules follow the WHO multi-dose vial policy (2014); invented "CTC" exposure limits were removed; VVM types, storage and diluent handling follow WHO documents.
- **Shake test scope**: offered only for aluminium-adsorbed vaccines, where it has been validated.
- **Citations**: references that could not be verified were removed.

`npm test` runs 30 automated tests covering the MKT formula, the decision order and the preset values.

---

## Scientific basis

### Mean kinetic temperature (MKT)

Time-weighted form of the MKT definition in USP General Chapter ⟨1079⟩ (Haynes 1971):

```
T_MKT = (ΔH/R) / −ln[ Σ tᵢ · exp(−ΔH / (R·Tᵢ)) / Σ tᵢ ]
```

with ΔH = 83,000 J/mol and R = 8.314 J/(mol·K). MKT gives more weight to hot periods and is always at least the time-weighted arithmetic mean.

### Potency estimate

A first-order Arrhenius model applied at the MKT. The per-vaccine parameters are **illustrative**: no WHO or peer-reviewed source was found for them, so the estimate is labelled as a reference value and never decides the verdict.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| PWA | vite-plugin-pwa, Workbox |
| i18n | i18next (EN / FR / SW / KO) |
| Tests | Vitest |
| Deployment | Cloudflare Pages |

---

## PHT Lab family

VaxGuard is one of six free, open-source public health tools by PHT Lab ([phtlab.org](https://phtlab.org)).

| App | Purpose | Link |
|---|---|---|
| **EpiCalc** | Epidemiology and pharmacology calculators | [epi.chem-health-calc.com](https://epi.chem-health-calc.com) |
| **EpiStat** | Epidemiological statistics | [epistat.phtlab.org](https://epistat.phtlab.org) |
| **EpiPlus** | Population burden, effect and survey-design calculators | [epiplus.phtlab.org](https://epiplus.phtlab.org) |
| **EpiLog** | Field outbreak and contact-tracing log | [epilog.phtlab.org](https://epilog.phtlab.org) |
| **EpiAid** | Clinical dosing decision support | [epiaid.phtlab.org](https://epiaid.phtlab.org) |
| **VaxGuard** | Vaccine cold chain decision support *(this app)* | [vaxguard.phtlab.org](https://vaxguard.phtlab.org) |

---

## Getting started

```bash
git clone https://github.com/whlee5503-dot/VaxGuard.git
cd VaxGuard
npm install
npm run dev      # development server
npm test         # automated tests
npm run build    # production build in dist/
```

---

## How to cite

See [CITATION.cff](CITATION.cff), or cite the Zenodo record: [doi.org/10.5281/zenodo.20473758](https://doi.org/10.5281/zenodo.20473758).

---

## References

1. WHO. *Temperature sensitivity of vaccines.* WHO/IVB/06.10. 2006.
2. WHO. *Vaccine Management Handbook, Module VMH-E2.* WHO/IVB/15.04. 2015.
3. WHO. *Policy statement: the use of opened multi-dose vaccine vials in subsequent immunization sessions* (2014 revision). WHO/IVB/14.07.
4. WHO. *PQS performance specification: Vaccine vial monitor.* WHO/PQS/E006/IN05.4. 2020.
5. Kartoglu Ü, et al. Validation of the shake test for detecting freeze damage to adsorbed vaccines. *Bull World Health Organ* 2010;88:624–631.
6. USP General Chapter ⟨1079⟩; Haynes JD. *J Pharm Sci* 1971;60:927–929.

Full source list: [VALIDATION.md](VALIDATION.md#sources).

---

## Developer

**Won Ho Lee, Ph.D., MPH, MDiv** · PHT Lab ([phtlab.org](https://phtlab.org))

Built for those who serve where no one else goes.

---

## License

[MIT License](https://github.com/whlee5503-dot/VaxGuard/blob/main/LICENSE) © 2026 Won Ho Lee