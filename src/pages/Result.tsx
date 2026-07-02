import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import HelpButton from "../components/HelpButton";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { VVM_STAGES, type VVMStage } from "../lib/vaccines";
import { type VaxGuardResult, type VerdictLevel } from "../lib/arrhenius";
import { generateVaxGuardSummary, shareViaWhatsApp, shareViaEmail, exportResultToJSON } from "../utils/exportData";

// ─── 상수 ────────────────────────────────────────

const LANG_SHORT: Record<string, string> = {
  en: "EN",
  ko: "한",
  fr: "FR",
  sw: "SW",
};

const LANG_ORDER = ["en", "fr", "sw", "ko"] as const;

// ─── 타입 ────────────────────────────────────────

// Input.tsx 가 { ...result, vvmStage } 로 저장함
interface StoredResult extends VaxGuardResult {
  vvmStage: VVMStage | null;
}

interface HistoryRecord extends StoredResult {
  vaccineId: string;
  savedAt: string;
}

// ─── 판정 설정 ───────────────────────────────────

const VERDICT_CONFIG: Record<
  VerdictLevel,
  { icon: string; label: string; subLabel: string; cssVar: string; bg: string }
> = {
  USABLE: {
    icon: "✅",
    label: "USABLE",
    subLabel: "Safe to administer",
    cssVar: "var(--color-usable)",
    bg: "color-mix(in srgb, var(--color-usable) 15%, transparent)",
  },
  CONDITIONAL: {
    icon: "⚠️",
    label: "CONDITIONAL USE",
    subLabel: "Administer immediately & report",
    cssVar: "var(--color-conditional)",
    bg: "color-mix(in srgb, var(--color-conditional) 15%, transparent)",
  },
  DISCARD: {
    icon: "🚫",
    label: "DISCARD",
    subLabel: "Do not use — dispose immediately",
    cssVar: "var(--color-discard)",
    bg: "color-mix(in srgb, var(--color-discard) 15%, transparent)",
  },
};

function gaugeColor(potency: number): string {
  if (potency >= 80) return "var(--color-usable)";
  if (potency >= 60) return "var(--color-conditional)";
  return "var(--color-discard)";
}

// ─── 컴포넌트 ────────────────────────────────────

export default function Result() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();

  const currentLang = i18n.language.split("-")[0];
  const [, setLang] = useState(i18n.language);
  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [i18n]);

  const [result, setResult] = useState<StoredResult | null>(null);
  const [vaccineId, setVaccineId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("vaxguard-result");
    if (!raw) {
      navigate("/");
      return;
    }
    try {
      setResult(JSON.parse(raw) as StoredResult);
    } catch {
      navigate("/");
      return;
    }
    setVaccineId(sessionStorage.getItem("vaxguard-vaccineId") ?? "");
  }, [navigate]);

  function handleSave() {
    if (!result) return;
    const record: HistoryRecord = {
      ...result,
      vaccineId,
      savedAt: new Date().toISOString(),
    };
    const raw = localStorage.getItem("vaxguard-history");
    const history: HistoryRecord[] = raw ? (JSON.parse(raw) as HistoryRecord[]) : [];
    history.unshift(record);
    if (history.length > 50) history.length = 50;
    localStorage.setItem("vaxguard-history", JSON.stringify(history));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleNewAssessment() {
    sessionStorage.removeItem("vaxguard-result");
    sessionStorage.removeItem("vaxguard-vaccineId");
    sessionStorage.removeItem("vaxguard-customVaccine");
    navigate("/");
  }

  if (!result) return null;

  const vaccineName = sessionStorage.getItem("vaxguard-vaccine-name") ?? "Unknown Vaccine";
  const verdict = result.potency.verdict;
  const vc = VERDICT_CONFIG[verdict];
  const potency = result.potency.remainingPotency;
  const gaugeWidth = Math.max(0, Math.min(100, potency));

  // VVM 교차 검증
  const vvmStage = result.vvmStage;
  const hasVvm = vvmStage !== null && vvmStage !== undefined;
  const vvmMismatch =
    hasVvm &&
    VVM_STAGES[vvmStage!].usable !== (verdict !== "DISCARD");

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid var(--color-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor:
            resolved === "dark"
              ? "rgba(30, 41, 59, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
        }}
      >
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: back + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={() => navigate("/input")}
              aria-label={t("common.back") ?? "Back"}
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                width: "30px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                cursor: "pointer",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ←
            </button>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>🛡️</span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-primary)",
              }}
            >
              VaxGuard
            </span>
          </div>

          {/* Right: dark mode + language */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <HelpButton />
            <button
              type="button"
              onClick={toggle}
              aria-label={
                resolved === "dark"
                  ? (t("theme.light") ?? "Light mode")
                  : (t("theme.dark") ?? "Dark mode")
              }
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                width: "30px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                cursor: "pointer",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {resolved === "dark" ? "☀️" : "🌙"}
            </button>

            {LANG_ORDER.map(code => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)!;
              const active = currentLang === lang.code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    localStorage.setItem("vaxguard-language", lang.code);
                  }}
                  aria-label={lang.label}
                  style={{
                    height: "28px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: active
                      ? "1.5px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                    background: active
                      ? "var(--color-primary)"
                      : "var(--color-surface-2)",
                    color: active
                      ? "var(--color-text-inverse)"
                      : "var(--color-text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {LANG_SHORT[code] ?? code.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          padding: "12px 16px",
          width: "100%",
        }}
      >
        {/* 판정 배지 */}
        <div
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "12px",
            background: vc.bg,
            border: `2px solid ${vc.cssVar}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: vc.cssVar,
              lineHeight: 1.3,
            }}
          >
            {vc.icon} {vc.label}
          </div>
          <div
            style={{
              fontSize: "0.88rem",
              color: vc.cssVar,
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            {vc.subLabel}
          </div>
        </div>

        {/* 권고 조치 카드 */}
        <div
          className="vg-surface"
          style={{
            padding: "16px",
            marginBottom: "12px",
            borderLeft: `4px solid ${vc.cssVar}`,
            borderRadius: "0 12px 12px 0",
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {t("result.action")}
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--color-text)",
              lineHeight: 1.6,
            }}
          >
            {result.potency.recommendedAction}
          </p>
        </div>

        {/* MKT 결과 카드 */}
        <div
          className="vg-surface"
          style={{ padding: "16px", marginBottom: "12px" }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {t("result.mkt")}
          </p>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              marginBottom: "10px",
            }}
          >
            {result.mkt.mktC.toFixed(1)}°C
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.82rem",
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>
                {t("result.arithmeticMean")}
              </span>
              <span style={{ fontWeight: 600 }}>
                {result.mkt.arithmeticMeanC.toFixed(1)}°C
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.82rem",
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>
                {t("result.totalExposure")}
              </span>
              <span style={{ fontWeight: 600 }}>
                {result.mkt.totalHours.toFixed(1)} {t("result.hours")}
              </span>
            </div>
          </div>
        </div>

        {/* 역가 카드 */}
        <div
          className="vg-surface"
          style={{ padding: "16px", marginBottom: "12px" }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {t("result.remainingPotency")}
          </p>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: gaugeColor(potency),
              marginBottom: "10px",
            }}
          >
            {result.potency.remainingPotency.toFixed(1)}%
          </div>
          {/* 게이지 바 */}
          <div
            style={{
              height: "12px",
              borderRadius: "6px",
              background: "var(--color-surface-2)",
              marginBottom: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${gaugeWidth}%`,
                borderRadius: "6px",
                background: gaugeColor(potency),
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.82rem",
            }}
          >
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("result.potencyLoss")}
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>
              -{result.potency.potencyLoss.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* VVM 교차 검증 카드 */}
        {hasVvm && (
          <div
            className="vg-surface"
            style={{ padding: "16px", marginBottom: "12px" }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {t("result.vvmCrossCheck")}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: vvmMismatch ? "10px" : 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: VVM_STAGES[vvmStage!].usable
                    ? "color-mix(in srgb, var(--color-usable) 15%, transparent)"
                    : "color-mix(in srgb, var(--color-discard) 15%, transparent)",
                  color: VVM_STAGES[vvmStage!].usable
                    ? "var(--color-usable)"
                    : "var(--color-discard)",
                  border: `1px solid ${
                    VVM_STAGES[vvmStage!].usable
                      ? "var(--color-usable)"
                      : "var(--color-discard)"
                  }`,
                }}
              >
                Stage {vvmStage}
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                {VVM_STAGES[vvmStage!].usable ? "Usable" : "Discard"}
              </span>
            </div>
            {vvmMismatch && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-warning)",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ VVM and calculation results differ. Use clinical judgment.
              </p>
            )}
          </div>
        )}

        {/* 하단 버튼 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            className="vg-btn-secondary"
            onClick={handleSave}
            style={{ flex: 1, fontSize: "0.9rem", padding: "12px 8px" }}
          >
            {saved ? "✅ Saved!" : `💾 ${t("result.saveRecord")}`}
          </button>
          <button
            type="button"
            className="vg-btn-primary"
            onClick={handleNewAssessment}
            style={{ flex: 1, fontSize: "0.9rem", padding: "12px 8px" }}
          >
            🔄 {t("result.newAssessment")}
          </button>
        </div>

        {/* 공유 버튼 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              shareViaWhatsApp(
                generateVaxGuardSummary(result, vaccineName, i18n.language as 'en' | 'ko' | 'fr' | 'sw')
              )
            }
            style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: "#25D366",
              color: "white",
            }}
          >
            📱 WhatsApp
          </button>
          <button
            type="button"
            onClick={() =>
              shareViaEmail(
                "VaxGuard Assessment",
                generateVaxGuardSummary(result, vaccineName, i18n.language as 'en' | 'ko' | 'fr' | 'sw')
              )
            }
            style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: "var(--color-primary)",
              color: "white",
            }}
          >
            📧 Email
          </button>
          <button
            type="button"
            onClick={() => exportResultToJSON(result, vaccineName)}
            style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: "#475569",
              color: "white",
            }}
          >
            📥 JSON
          </button>
        </div>
      </main>

    </div>
  );
}
