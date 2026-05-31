# 🛡️ VaxGuard

**Vaccine cold chain monitor for Community Health Workers — WHO MKT-based potency assessment**

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://github.com/whlee5503-dot/VaxGuard/blob/main/LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple?style=flat-square)](https://vaxguard.pages.dev)
[![Deployed](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange?style=flat-square)](https://vaxguard.pages.dev)
[![WHO MKT](https://img.shields.io/badge/Standard-WHO%20MKT-blue?style=flat-square)](https://www.who.int/teams/immunization-vaccines-and-biologicals)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20473758.svg)](https://doi.org/10.5281/zenodo.20473758)
**DPG ID: [GID0093724](https://digitalpublicgoods.net/r/vaxguard)**
**[Live App →](https://vaxguard.pages.dev)**

---

## Overview

**VaxGuard** is Module 4 of the [EpiCalc Suite](#epicalc-suite) — a collection of open-source public health tools built for field use. VaxGuard helps Community Health Workers (CHWs) make evidence-based decisions when cold chain integrity is uncertain.

Designed for **CHWs, clinic staff, and field health workers** operating in remote or resource-limited settings. No login. No subscription. No internet required after the first visit.

**Core values:**

- **Offline-first** — all calculations run client-side; no server required
- **Free & open** — MIT licensed, no cost, no ads
- **Instant to use** — no registration, works on any smartphone

---

## Disclaimer

> **VaxGuard is a decision-support tool intended to assist — not replace — the judgment of qualified health personnel.**
>
> All vaccine use/discard decisions must be made in accordance with national immunization program guidelines. MKT calculations are based on WHO-recommended methods and published stability parameters, but cannot account for all variables affecting vaccine potency. When in doubt, consult your supervisory health authority.

---

## Features

| Feature | Description |
|---|---|
| 🌡️ **MKT Calculator** | WHO Arrhenius-based Mean Kinetic Temperature from temperature history |
| 💉 **Potency Assessment** | Residual potency (%) with 3-tier use/conditional/discard decision |
| 📋 **5 WHO EPI Presets** | OPV, BCG, Measles, DTP/Penta, HepB — plus custom entry |
| 🔴 **VVM Cross-check** | Vaccine Vial Monitor stages 1–4 alongside calculated result |
| 📤 **Export** | Share via WhatsApp, Email, or JSON |
| 🌙 **Dark / Light Mode** | Adaptive display for day and night field conditions |
| 🌍 **4-Language UI** | Full interface localization (EN / FR / SW / 한국어) |
| 📱 **PWA — Offline Ready** | Installable on any smartphone, works without internet |
| 🔒 **Privacy First** | All data stored locally on device — never leaves the phone |

---

## Scientific Basis

### Mean Kinetic Temperature (MKT)

VaxGuard uses the WHO- and FDA-endorsed MKT formula (ICH Q1E guideline):

```
T_MKT = (Ea/R) / ln[ (1/n) × Σ exp(Ea / R·Tᵢ) ]
```

### Decision Thresholds

| Residual Potency | Decision |
|---|---|
| ≥ 80% | ✅ **USE** — Vaccine is viable |
| 60–79% | ⚠️ **CONDITIONAL** — Use immediately; report to supervisor |
| < 60% | ❌ **DISCARD** — Dispose per protocol |

Default Ea: **83,000 J/mol** (WHO standard, ΔH/R = 10,000 K)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| PWA | Vite PWA Plugin + Workbox (2G/3G optimized) |
| i18n | i18next (EN / FR / SW / 한국어) |
| Deployment | Cloudflare Pages |

---

## EpiCalc Suite

VaxGuard is part of a broader suite of free, open-source public health tools:

| Module | App | URL |
|---|---|---|
| Module 1 | **EpiCalc** — Epidemiology & pharmacology calculator | [epi.chem-health-calc.com](https://epi.chem-health-calc.com) |
| Module 2 | **EpiLog** — Field disease surveillance log | [epilog-d72.pages.dev](https://epilog-d72.pages.dev) |
| Module 3 | **EpiAid** — Clinical decision support | [epiaid.pages.dev](https://epiaid.pages.dev) |
| Module 4 | **VaxGuard** — Vaccine cold chain monitor *(this app)* | [vaxguard.pages.dev](https://vaxguard.pages.dev) |

---

## Getting Started

```bash
# Clone
git clone https://github.com/whlee5503-dot/VaxGuard.git
cd VaxGuard

# Install
npm install

# Develop
npm run dev

# Build
npm run build
```

The PWA build outputs to `dist/`. Deploy directly to Cloudflare Pages, Netlify, or any static host.

---

## References

1. WHO. *Temperature sensitivity of vaccines.* WHO/IVB/06.10. 2006.
2. WHO. *Vaccine vial monitor (VVM) policy.* WHO/IVB/99.06. 1999.
3. ICH Harmonised Tripartite Guideline. *Evaluation for Stability Data Q1E.* 2003.
4. WHO. *Technical Report Series No. 926 — Annex 2: WHO guidelines on stability evaluation of vaccines.* 2006.

---

## Developer

**Won Ho Lee, Ph.D., MPH, MDiv** Public health researcher and field medicine educator.

Built for those who serve where no one else goes.

---

## License

[MIT License](https://github.com/whlee5503-dot/VaxGuard/blob/main/LICENSE) © 2026 Won Ho Lee

Free to use, modify, and distribute. Attribution appreciated.
