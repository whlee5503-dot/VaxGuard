// src/components/HelpModal.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface HelpModalProps {
  onClose: () => void;
}

interface TermItem {
  term: string;
  desc: string;
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-primary)",
  marginBottom: "0.5rem",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--color-text)",
  margin: 0,
  lineHeight: 1.55,
};

const noteStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-muted)",
  margin: "0.5rem 0 0",
  lineHeight: 1.5,
};

// ─── Reusable blocks ─────────────────────────────

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((text, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
          <span
            style={{
              width: "1.35rem",
              height: "1.35rem",
              borderRadius: "50%",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontSize: "0.7rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "0.1rem",
            }}
          >
            {i + 1}
          </span>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>{text}</p>
        </li>
      ))}
    </ol>
  );
}

function CardList({ items }: { items: TermItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map(({ term, desc }, i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--color-surface-2)",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            padding: "0.65rem 0.85rem",
          }}
        >
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.15rem" }}>
            {term}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
            {desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p style={sectionTitleStyle}>{title}</p>
      {children}
    </section>
  );
}

// ─── Modal ───────────────────────────────────────

export default function HelpModal({ onClose }: HelpModalProps) {
  const { t } = useTranslation();

  const list = (key: string) => t(key, { returnObjects: true }) as string[];
  const cards = (key: string) => t(key, { returnObjects: true }) as TermItem[];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("help.modalTitle")}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="vg-surface"
        style={{
          width: "100%",
          maxWidth: "440px",
          maxHeight: "85svh",
          overflowY: "auto",
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>🛡️</span>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              {t("help.modalTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "var(--color-text-muted)",
              width: "28px",
              height: "28px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Section title={t("help.flow")}>
            <NumberedList items={list("help.flowSteps")} />
          </Section>

          {/* The calculation never decides the verdict */}
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid var(--color-danger)",
              backgroundColor: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
              padding: "0.875rem 1rem",
            }}
          >
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-danger)", margin: "0 0 0.3rem" }}>
              ⚠️ {t("help.safetyTitle")}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text)", margin: 0, lineHeight: 1.55 }}>
              {t("help.safetyDesc")}
            </p>
          </div>

          <Section title={t("help.decisionTitle")}>
            <NumberedList items={list("help.decisionSteps")} />
          </Section>

          <Section title={t("help.verdictTitle")}>
            <CardList items={cards("help.verdictList")} />
          </Section>

          <Section title={t("help.vvmTitle")}>
            <CardList items={cards("help.vvmList")} />
            <p style={noteStyle}>{t("help.vvmNote")}</p>
          </Section>

          <Section title={t("help.shakeTitle")}>
            <NumberedList items={list("help.shakeSteps")} />
            <p style={noteStyle}>{t("help.shakeNote")}</p>
          </Section>

          <Section title={t("help.intervalTitle")}>
            <p style={paragraphStyle}>{t("help.intervalDesc")}</p>
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {list("help.intervalExamples").map((ex, i) => (
                <li key={i} style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {ex}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("help.estimateTitle")}>
            <p style={paragraphStyle}>{t("help.estimateDesc")}</p>
          </Section>

          <Section title={t("help.terms")}>
            <CardList items={cards("help.termList")} />
          </Section>

          <Section title={t("help.customTitle")}>
            <p style={paragraphStyle}>{t("help.customDesc")}</p>
          </Section>

          <Section title={t("help.shareTitle")}>
            <p style={paragraphStyle}>{t("help.shareDesc")}</p>
          </Section>

          <Section title={t("help.dataTitle")}>
            <p style={paragraphStyle}>{t("help.dataDesc")}</p>
          </Section>

          <Section title={t("help.references")}>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {list("help.referenceList").map((ref, i) => (
                <li key={i} style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {ref}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>,
    document.body
  );
}
