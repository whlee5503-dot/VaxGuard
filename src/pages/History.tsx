import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { type VaxGuardResult, type VerdictLevel } from "../lib/arrhenius";
import { type VVMStage } from "../lib/vaccines";

// ─── 상수 ────────────────────────────────────────

const LANG_SHORT: Record<string, string> = {
  en: "EN",
  ko: "한",
  fr: "FR",
  sw: "SW",
};

const LANG_ORDER = ["en", "fr", "sw", "ko"] as const;

const VERDICT_CLASS: Record<VerdictLevel, string> = {
  USABLE: "verdict-usable",
  CONDITIONAL: "verdict-conditional",
  DISCARD: "verdict-discard",
};

// ─── 타입 ────────────────────────────────────────

interface HistoryRecord extends VaxGuardResult {
  vvmStage: VVMStage | null;
  vaccineId: string;
  savedAt: string;
}

// ─── 날짜 포맷 ───────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── 컴포넌트 ────────────────────────────────────

export default function History() {
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

  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("vaxguard-history");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HistoryRecord[];
      // 최신순 정렬 (calculatedAt 기준)
      parsed.sort(
        (a, b) =>
          new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
      );
      setRecords(parsed);
    } catch { /* ignore */ }
  }, []);

  function deleteRecord(idx: number) {
    setRecords(prev => {
      const next = prev.filter((_, i) => i !== idx);
      localStorage.setItem("vaxguard-history", JSON.stringify(next));
      return next;
    });
  }

  function clearAll() {
    if (!window.confirm(t("history.confirmDelete"))) return;
    localStorage.removeItem("vaxguard-history");
    setRecords([]);
  }

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
        {/* 페이지 제목 */}
        <div style={{ marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "2px",
            }}
          >
            {t("history.title")}
          </h1>
        </div>

        {records.length === 0 ? (
          /* ── 빈 상태 ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 16px",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "3rem", lineHeight: 1 }}>📋</span>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {t("history.empty")}
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {t("history.emptySubtitle")}
            </p>
            <button
              type="button"
              className="vg-btn-primary"
              onClick={() => navigate("/")}
              style={{ marginTop: "8px", padding: "10px 24px", fontSize: "0.9rem" }}
            >
              Start Assessment
            </button>
          </div>
        ) : (
          <>
            {/* ── 목록 헤더 (Clear All) ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "10px",
              }}
            >
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "6px",
                  color: "var(--color-danger)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                🗑️ {t("history.deleteAll")}
              </button>
            </div>

            {/* ── 기록 카드 목록 ── */}
            {records.map((record, idx) => {
              const verdict = record.potency.verdict;
              const vaccineLabel =
                t(`vaccine.${record.vaccineId}`, {
                  defaultValue: record.vaccineId || "Unknown",
                });

              return (
                <div
                  key={`${record.savedAt}-${idx}`}
                  className="vg-surface"
                  style={{ padding: "14px", marginBottom: "10px" }}
                >
                  {/* 카드 상단: 날짜 + 삭제 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {formatDate(record.savedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteRecord(idx)}
                      aria-label="Delete record"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "var(--color-text-muted)",
                        padding: "0 2px",
                        lineHeight: 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* 백신 ID + 판정 배지 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {vaccineLabel}
                    </span>
                    <span
                      className={VERDICT_CLASS[verdict]}
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {verdict}
                    </span>
                  </div>

                  {/* MKT + Potency */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <span>
                      {t("result.mkt")}:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {record.mkt.mktC.toFixed(1)}°C
                      </strong>
                    </span>
                    <span>
                      {t("result.remainingPotency")}:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {record.potency.remainingPotency.toFixed(1)}%
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>

    </div>
  );
}
