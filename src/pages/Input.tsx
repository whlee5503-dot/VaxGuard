import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import HelpButton from "../components/HelpButton";
import { SUPPORTED_LANGUAGES } from "../i18n";
import {
  getVaccineById,
  VVM_STAGES,
  type VaccineProfile,
  type VVMStage,
} from "../lib/vaccines";
import {
  runVaxGuardCalculation,
  type TemperatureInterval,
} from "../lib/arrhenius";

const LANG_SHORT: Record<string, string> = {
  en: "EN",
  ko: "한",
  fr: "FR",
  sw: "SW",
};

const VVM_COLORS: Record<VVMStage, { bg: string; border: string; text: string }> = {
  1: {
    bg: "color-mix(in srgb, #16a34a 15%, transparent)",
    border: "#16a34a",
    text: "#16a34a",
  },
  2: {
    bg: "color-mix(in srgb, #ca8a04 15%, transparent)",
    border: "#ca8a04",
    text: "#ca8a04",
  },
  3: {
    bg: "color-mix(in srgb, #ea580c 15%, transparent)",
    border: "#ea580c",
    text: "#ea580c",
  },
  4: {
    bg: "color-mix(in srgb, #dc2626 15%, transparent)",
    border: "#dc2626",
    text: "#dc2626",
  },
};

interface IntervalField {
  id: number;
  temperatureC: string;
  durationHours: string;
  errors: { temp?: string; duration?: string };
}

const LANG_ORDER = ["en", "fr", "sw", "ko"] as const;

// ─── Help modal ───────────────────────────────

interface HelpModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function HelpModal({ title, onClose, children }: HelpModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.1rem",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const helpIconStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "0.8rem",
  color: "var(--color-text-muted)",
  padding: "0 2px",
  lineHeight: 1,
  flexShrink: 0,
};

const fieldStyle = (hasError: boolean): React.CSSProperties => ({
  background: "var(--color-surface-2)",
  border: `1px solid ${hasError ? "var(--color-danger)" : "var(--color-border)"}`,
  borderRadius: "0.5rem",
  padding: "0.45rem 0.6rem",
  fontSize: "0.9rem",
  color: "var(--color-text)",
  width: "100%",
  outline: "none",
});

const labelTextStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--color-danger)",
};

export default function Input() {
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

  const [vaccine, setVaccine] = useState<VaccineProfile | null>(null);
  useEffect(() => {
    const id = sessionStorage.getItem("vaxguard-vaccineId");
    if (!id) {
      navigate("/");
      return;
    }
    const customRaw = sessionStorage.getItem("vaxguard-customVaccine");
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw) as VaccineProfile;
        if (custom.id === id) {
          setVaccine(custom);
          return;
        }
      } catch { /* ignore */ }
    }
    try {
      setVaccine(getVaccineById(id));
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const [vvmStage, setVvmStage] = useState<VVMStage | null>(null);
  const [intervals, setIntervals] = useState<IntervalField[]>([
    { id: 1, temperatureC: "", durationHours: "", errors: {} },
  ]);
  const [nextId, setNextId] = useState(2);
  const [initialPotency, setInitialPotency] = useState("100");
  const [potencyError, setPotencyError] = useState("");
  const [calcError, setCalcError] = useState("");
  const [showVvmHelp, setShowVvmHelp] = useState(false);
  const [showIntervalHelp, setShowIntervalHelp] = useState(false);

  function addInterval() {
    if (intervals.length >= 10) return;
    setIntervals(prev => [
      ...prev,
      { id: nextId, temperatureC: "", durationHours: "", errors: {} },
    ]);
    setNextId(n => n + 1);
  }

  function removeInterval(id: number) {
    setIntervals(prev => prev.filter(iv => iv.id !== id));
  }

  function updateInterval(
    id: number,
    field: "temperatureC" | "durationHours",
    value: string
  ) {
    setIntervals(prev =>
      prev.map(iv => {
        if (iv.id !== id) return iv;
        const errors = { ...iv.errors };
        if (field === "temperatureC") delete errors.temp;
        else delete errors.duration;
        return { ...iv, [field]: value, errors };
      })
    );
  }

  function validate(): boolean {
    let valid = true;
    const updated = intervals.map(iv => {
      const errors: IntervalField["errors"] = {};
      const temp = parseFloat(iv.temperatureC);
      const dur = parseFloat(iv.durationHours);

      if (iv.temperatureC === "" || isNaN(temp)) {
        errors.temp = t("input.validation.tempRequired");
        valid = false;
      } else if (temp < -80 || temp > 100) {
        errors.temp = t("input.validation.tempRange");
        valid = false;
      }

      if (iv.durationHours === "" || isNaN(dur)) {
        errors.duration = t("input.validation.durationRequired");
        valid = false;
      } else if (dur <= 0) {
        errors.duration = t("input.validation.durationPositive");
        valid = false;
      }

      return { ...iv, errors };
    });
    setIntervals(updated);

    const p = parseFloat(initialPotency);
    if (isNaN(p) || p < 1 || p > 100) {
      setPotencyError("Potency must be between 1 and 100.");
      valid = false;
    } else {
      setPotencyError("");
    }

    return valid;
  }

  function handleCalculate() {
    if (!vaccine) return;
    setCalcError("");
    if (!validate()) return;

    const ivs: TemperatureInterval[] = intervals.map(iv => ({
      temperatureC: parseFloat(iv.temperatureC),
      durationHours: parseFloat(iv.durationHours),
    }));

    try {
      const result = runVaxGuardCalculation(
        ivs,
        {
          activationEnergyJ: vaccine.arrhenius.activationEnergyJ,
          kRefPerHour: vaccine.arrhenius.kRefPerHour,
          referenceTemperatureC: vaccine.arrhenius.referenceTemperatureC,
        },
        parseFloat(initialPotency)
      );
      sessionStorage.setItem(
        "vaxguard-result",
        JSON.stringify({ ...result, vvmStage })
      );
      navigate("/result");
    } catch {
      setCalcError(
        t("error.calculation") ?? "Calculation failed. Please check your inputs."
      );
    }
  }

  if (!vaccine) return null;

  const vaccineName = vaccine.isCustom
    ? vaccine.name
    : t(`vaccine.${vaccine.id}`);
  const freezeSensitive = !vaccine.storage.freezeAllowed;

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
              onClick={() => navigate("/")}
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
                  key={lang.code}
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
                  {LANG_SHORT[lang.code] ?? lang.code.toUpperCase()}
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
        {/* Page title */}
        <div style={{ marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "2px",
            }}
          >
            {t("input.title")}
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {t("input.subtitle")}
          </p>
        </div>

        {/* Vaccine info card */}
        <div
          className="vg-surface"
          style={{ padding: "12px", marginBottom: "12px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--color-text)",
              }}
            >
              {vaccineName}
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "4px",
                background:
                  "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                color: "var(--color-primary)",
                border:
                  "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              }}
            >
              {vaccine.vvmType}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {vaccine.abbreviation}
            {" · "}
            {vaccine.storage.minC}°C ~ {vaccine.storage.maxC}°C
          </p>
        </div>

        {/* Freeze-sensitive warning */}
        {freezeSensitive && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: "12px",
              borderRadius: "8px",
              background:
                "color-mix(in srgb, var(--color-warning) 12%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--color-warning) 40%, transparent)",
              fontSize: "0.8rem",
              color: "var(--color-warning)",
              fontWeight: 500,
            }}
          >
            ⚠️ Freeze-sensitive vaccine. Do NOT freeze.
          </div>
        )}

        {/* VVM stage selection */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              {t("input.vvmLabel")} (optional)
            </span>
            <button
              type="button"
              style={helpIconStyle}
              onClick={() => setShowVvmHelp(true)}
              aria-label="VVM help"
            >
              ❓
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
            }}
          >
            {([1, 2, 3, 4] as VVMStage[]).map(stage => {
              const colors = VVM_COLORS[stage];
              const selected = vvmStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() =>
                    setVvmStage(prev => (prev === stage ? null : stage))
                  }
                  style={{
                    padding: "7px 4px",
                    borderRadius: "6px",
                    border: `${selected ? "2px" : "1px"} solid ${
                      selected ? colors.border : "var(--color-border)"
                    }`,
                    background: selected
                      ? colors.bg
                      : "var(--color-surface-2)",
                    color: selected ? colors.text : "var(--color-text-muted)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  Stage {stage}
                </button>
              );
            })}
          </div>
          {vvmStage !== null && !VVM_STAGES[vvmStage].usable && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-danger)",
                marginTop: "6px",
              }}
            >
              ⚠️ VVM indicates discard. Calculation will proceed for reference.
            </p>
          )}
        </div>

        {/* Temperature intervals */}
        <div style={{ marginBottom: "8px" }}>
          {intervals.map((iv, idx) => (
            <div
              key={iv.id}
              className="vg-surface"
              style={{ padding: "12px", marginBottom: "8px" }}
            >
              {/* Interval header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t("input.intervalCount", { count: idx + 1 })}
                  </span>
                  {idx === 0 && (
                    <button
                      type="button"
                      style={helpIconStyle}
                      onClick={() => setShowIntervalHelp(true)}
                      aria-label="Interval help"
                    >
                      ❓
                    </button>
                  )}
                </div>
                {intervals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInterval(iv.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-danger)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                  >
                    {t("input.removeInterval")}
                  </button>
                )}
              </div>

              {/* Fields */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {/* Temperature */}
                <label
                  style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                >
                  <span style={labelTextStyle}>{t("input.temperature")}</span>
                  <input
                    type="number"
                    value={iv.temperatureC}
                    onChange={e =>
                      updateInterval(iv.id, "temperatureC", e.target.value)
                    }
                    placeholder="e.g. 37"
                    min={-80}
                    max={100}
                    step={0.1}
                    style={fieldStyle(!!iv.errors.temp)}
                  />
                  {iv.errors.temp && (
                    <span style={errorTextStyle}>{iv.errors.temp}</span>
                  )}
                </label>

                {/* Duration */}
                <label
                  style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                >
                  <span style={labelTextStyle}>{t("input.duration")}</span>
                  <input
                    type="number"
                    value={iv.durationHours}
                    onChange={e =>
                      updateInterval(iv.id, "durationHours", e.target.value)
                    }
                    placeholder="e.g. 6"
                    min={0.01}
                    step={0.5}
                    style={fieldStyle(!!iv.errors.duration)}
                  />
                  {iv.errors.duration && (
                    <span style={errorTextStyle}>{iv.errors.duration}</span>
                  )}
                </label>
              </div>
            </div>
          ))}

          {/* Add interval */}
          {intervals.length < 10 && (
            <button
              type="button"
              className="vg-btn-secondary"
              style={{ width: "100%", fontSize: "0.85rem", padding: "8px" }}
              onClick={addInterval}
            >
              + {t("input.addInterval")}
            </button>
          )}
        </div>

        {/* Initial potency */}
        <div
          className="vg-surface"
          style={{ padding: "12px", marginBottom: "16px" }}
        >
          <label
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
              {t("input.initialPotency")}
            </span>
            <input
              type="number"
              value={initialPotency}
              onChange={e => {
                setInitialPotency(e.target.value);
                setPotencyError("");
              }}
              placeholder="Default: 100"
              min={1}
              max={100}
              step={1}
              style={fieldStyle(!!potencyError)}
            />
            {potencyError && (
              <span style={errorTextStyle}>{potencyError}</span>
            )}
          </label>
        </div>

        {/* Calculation error */}
        {calcError && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-danger)",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {calcError}
          </p>
        )}

        {/* Calculate button */}
        <button
          type="button"
          className="vg-btn-primary"
          onClick={handleCalculate}
          style={{
            width: "100%",
            marginBottom: "16px",
            padding: "14px",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          {t("input.calculate")}
        </button>
      </main>

      {/* ── VVM Help Modal ── */}
      {showVvmHelp && (
        <HelpModal title="What is VVM?" onClose={() => setShowVvmHelp(false)}>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              marginBottom: "12px",
            }}
          >
            VVM (Vaccine Vial Monitor) is a heat-sensitive sticker on the
            vaccine vial cap.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", lineHeight: 1.5 }}>
            <p style={{ color: "#16a34a" }}>
              ■ Stage 1 — Inner square LIGHTER than outer circle → Safe to use
            </p>
            <p style={{ color: "#d97706" }}>
              ■ Stage 2 — Inner square getting darker → Use immediately
            </p>
            <p style={{ color: "#ea580c" }}>
              ■ Stage 3 — Inner square SAME color as outer circle → Do NOT use
            </p>
            <p style={{ color: "#dc2626" }}>
              ■ Stage 4 — Inner square DARKER than outer circle → Discard immediately
            </p>
          </div>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              marginTop: "12px",
              lineHeight: 1.5,
            }}
          >
            Select the stage that matches what you see on the vial.
          </p>
        </HelpModal>
      )}

      {/* ── Interval Help Modal ── */}
      {showIntervalHelp && (
        <HelpModal
          title="What is a Temperature Interval?"
          onClose={() => setShowIntervalHelp(false)}
        >
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            Enter each separate cold chain break as one interval.
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--color-text)",
              marginBottom: "6px",
            }}
          >
            Example — Vaccine exposed to heat during transport:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            <p>· Interval 1: Vehicle breakdown → 37°C for 6 hours</p>
            <p>· Interval 2: Power outage → 25°C for 12 hours</p>
            <p>· Interval 3: Normal storage → 8°C for 48 hours</p>
          </div>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              marginTop: "10px",
              lineHeight: 1.5,
            }}
          >
            Add as many intervals as needed (max 10). The calculator uses WHO
            MKT formula to combine all intervals.
          </p>
        </HelpModal>
      )}

    </div>
  );
}
