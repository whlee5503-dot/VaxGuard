import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import {
  EPI_VACCINES,
  createCustomVaccine,
  type VaccineProfile,
} from "../lib/vaccines";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { DEFAULT_EA_J } from "../lib/arrhenius";

const LANG_SHORT: Record<string, string> = {
  en: "EN",
  ko: "한",
  fr: "FR",
  sw: "SW",
};

const LANG_ORDER = ["en", "fr", "sw", "ko"] as const;

// ─── 커스텀 백신 모달 폼 ─────────────────────────

interface CustomForm {
  name: string;
  activationEnergyKJ: string;
  referenceTemperatureC: string;
  kRefPerHour: string;
}

const EMPTY_FORM: CustomForm = {
  name: "",
  activationEnergyKJ: String(DEFAULT_EA_J / 1000),
  referenceTemperatureC: "37",
  kRefPerHour: "",
};

// ─── 백신 카드 (컴팩트) ───────────────────────────

interface VaccineCardProps {
  vaccine: VaccineProfile;
  selected: boolean;
  onSelect: (id: string) => void;
}

function VaccineCard({ vaccine, selected, onSelect }: VaccineCardProps) {
  const { t } = useTranslation();
  const displayName = vaccine.isCustom
    ? vaccine.name
    : t(`vaccine.${vaccine.id}`);

  return (
    <button
      type="button"
      onClick={() => onSelect(vaccine.id)}
      aria-pressed={selected}
      style={{
        width: "100%",
        background: "var(--color-surface)",
        border: `2px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: "10px",
        padding: "10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        boxShadow: selected
          ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent)"
          : "none",
      }}
    >
      {/* 약칭 + 동결금지 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "3px",
        }}
      >
        <span
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: selected ? "var(--color-primary)" : "var(--color-text)",
            lineHeight: 1.2,
          }}
        >
          {vaccine.abbreviation}
        </span>
        {!vaccine.storage.freezeAllowed && (
          <span title={t("vaccine.noFreeze") ?? "No freeze"} style={{ fontSize: "0.8rem", lineHeight: 1 }}>
            ❄️🚫
          </span>
        )}
      </div>

      {/* 백신 이름 */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          marginBottom: "5px",
          lineHeight: 1.3,
        }}
      >
        {displayName}
      </p>

      {/* VVM 배지 */}
      <span
        style={{
          display: "inline-block",
          fontSize: "0.65rem",
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: "4px",
          background: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
          color: "var(--color-primary)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
        }}
      >
        {vaccine.vvmType}
      </span>
    </button>
  );
}

// ─── 커스텀 백신 모달 ─────────────────────────────

interface CustomModalProps {
  onClose: () => void;
  onConfirm: (vaccine: VaccineProfile) => void;
}

function CustomModal({ onClose, onConfirm }: CustomModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CustomForm>(EMPTY_FORM);
  const [error, setError] = useState<string>("");

  function handleChange(field: keyof CustomForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("error.nameRequired") ?? "Vaccine name is required.");
      return;
    }
    const kRef = parseFloat(form.kRefPerHour);
    if (isNaN(kRef) || kRef <= 0) {
      setError(t("error.kRefPositive") ?? "k_ref must be a positive number.");
      return;
    }
    const refT = parseFloat(form.referenceTemperatureC);
    if (isNaN(refT)) {
      setError(t("error.refTempInvalid") ?? "Enter a valid reference temperature.");
      return;
    }
    const eaKJ = parseFloat(form.activationEnergyKJ);
    if (isNaN(eaKJ) || eaKJ <= 0) {
      setError(t("error.eaPositive") ?? "Ea must be a positive number.");
      return;
    }
    onConfirm(
      createCustomVaccine({
        name: form.name.trim(),
        activationEnergyJ: eaKJ * 1000,
        referenceTemperatureC: refT,
        kRefPerHour: kRef,
      })
    );
  }

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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="vg-surface"
        style={{ width: "100%", maxWidth: "420px", padding: "1.5rem" }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "var(--color-text)",
          }}
        >
          {t("home.customBtn")}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Vaccine Name *</span>
            <input
              style={inputStyle}
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 수두 (Varicella)"
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Ea (kJ/mol)</span>
            <input
              style={inputStyle}
              type="number"
              value={form.activationEnergyKJ}
              onChange={(e) => handleChange("activationEnergyKJ", e.target.value)}
              min={1}
              step={1}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Reference Temp (°C)</span>
            <input
              style={inputStyle}
              type="number"
              value={form.referenceTemperatureC}
              onChange={(e) => handleChange("referenceTemperatureC", e.target.value)}
              step={0.1}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>k_ref (/h) *</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              {t("input.krefHint") ?? "Degradation rate constant. BCG≈0.00693, OPV≈0.0231. If unknown, enter 0.00693"}
            </span>
            <input
              style={inputStyle}
              type="number"
              value={form.kRefPerHour}
              onChange={(e) => handleChange("kRefPerHour", e.target.value)}
              placeholder="예: 0.00693 (BCG 기준)"
              min={0}
              step="any"
            />
          </label>
        </div>

        {error && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-danger)",
              marginTop: "0.75rem",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button
            type="button"
            className="vg-btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="vg-btn-primary"
            style={{ flex: 1 }}
            onClick={handleSubmit}
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const labelTextStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  color: "var(--color-text)",
  width: "100%",
  outline: "none",
};

// ─── 메인 Home 페이지 ─────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();

  const currentLang = i18n.language.split("-")[0];

  const [, setLang] = useState(i18n.language);
  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => { i18n.off("languageChanged", handler); };
  }, [i18n]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customVaccine, setCustomVaccine] = useState<VaccineProfile | null>(null);
  const [showModal, setShowModal] = useState(false);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleCustomConfirm(vaccine: VaccineProfile) {
    setCustomVaccine(vaccine);
    setSelectedId(vaccine.id);
    setShowModal(false);
  }

  function handleCalculate() {
    if (!selectedId) return;
    sessionStorage.setItem("vaxguard-vaccineId", selectedId);
    if (customVaccine && selectedId === customVaccine.id) {
      sessionStorage.setItem("vaxguard-customVaccine", JSON.stringify(customVaccine));
    } else {
      sessionStorage.removeItem("vaxguard-customVaccine");
    }
    navigate("/input");
  }

  const allVaccines: VaccineProfile[] = customVaccine
    ? [...EPI_VACCINES, customVaccine]
    : EPI_VACCINES;

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "80px",
      }}
    >
      {/* ── 헤더 ── */}
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
          {/* 로고 */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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

          {/* 오른쪽 컨트롤 */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* 다크모드 토글 */}
            <button
              type="button"
              onClick={toggle}
              aria-label={resolved === "dark" ? (t("theme.light") ?? "Light mode") : (t("theme.dark") ?? "Dark mode")}
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

            {/* 언어 버튼 4개 */}
            {LANG_ORDER.map((code) => {
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

      {/* ── 메인 콘텐츠 ── */}
      <main
        style={{
          flex: 1,
          padding: "12px 16px",
          width: "100%",
        }}
      >
        {/* 제목 */}
        <div style={{ marginBottom: "8px" }}>
          <h1
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "2px",
            }}
          >
            {t("home.title")}
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {t("home.subtitle")}
          </p>
        </div>

        {/* WHO EPI 섹션 레이블 */}
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "6px",
          }}
        >
          {t("home.preset")}
        </p>

        {/* 백신 카드 — 3열 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          {allVaccines.map((vaccine) => (
            <VaccineCard
              key={vaccine.id}
              vaccine={vaccine}
              selected={selectedId === vaccine.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* 커스텀 백신 버튼 */}
        {!customVaccine ? (
          <button
            type="button"
            className="vg-btn-secondary"
            style={{
              width: "100%",
              marginTop: "8px",
              fontSize: "0.85rem",
              padding: "8px",
            }}
            onClick={() => setShowModal(true)}
          >
            + {t("home.customBtn")}
          </button>
        ) : (
          <button
            type="button"
            style={{
              width: "100%",
              marginTop: "8px",
              background: "transparent",
              border: "1px dashed var(--color-border)",
              borderRadius: "6px",
              padding: "8px",
              fontSize: "0.82rem",
              color: "var(--color-text-muted)",
              cursor: "pointer",
            }}
            onClick={() => {
              if (selectedId === customVaccine.id) setSelectedId(null);
              setCustomVaccine(null);
            }}
          >
            {t("home.removeCustom") ?? "Remove"} ({customVaccine.name})
          </button>
        )}

        {/* ── CTA ── */}
        <button
          type="button"
          className="vg-btn-primary"
          onClick={handleCalculate}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            fontSize: "1rem",
            fontWeight: 700,
            opacity: selectedId ? 1 : 0.4,
            pointerEvents: selectedId ? "auto" : "none",
            cursor: selectedId ? "pointer" : "not-allowed",
          }}
        >
          {t("input.calculate")}
        </button>
      </main>

      {/* ── 커스텀 백신 모달 ── */}
      {showModal && (
        <CustomModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCustomConfirm}
        />
      )}

    </div>
  );
}
