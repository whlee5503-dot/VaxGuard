// src/components/HelpModal.tsx
import { useTranslation } from "react-i18next";

interface HelpModalProps {
  onClose: () => void;
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-primary)",
  marginBottom: "0.5rem",
};

export default function HelpModal({ onClose }: HelpModalProps) {
  const { t } = useTranslation();

  const flowSteps: string[] = t("help.flowSteps", { returnObjects: true }) as string[];
  const termList: { term: string; desc: string }[] = t("help.termList", {
    returnObjects: true,
  }) as { term: string; desc: string }[];
  const referenceList: string[] = t("help.referenceList", { returnObjects: true }) as string[];

  return (
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
          {/* App Flow */}
          <section>
            <p style={sectionTitleStyle}>{t("help.flow")}</p>
            <ol style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: 0, padding: 0, listStyle: "none" }}>
              {flowSteps.map((step, i) => (
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
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Safety warning — VVM always takes priority */}
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

          {/* Key Terms */}
          <section>
            <p style={sectionTitleStyle}>{t("help.terms")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {termList.map(({ term, desc }, i) => (
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
          </section>

          {/* Custom vaccine guidance */}
          <section>
            <p style={sectionTitleStyle}>{t("help.customTitle")}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text)", margin: 0, lineHeight: 1.55 }}>
              {t("help.customDesc")}
            </p>
          </section>

          {/* Data & privacy */}
          <section>
            <p style={sectionTitleStyle}>{t("help.dataTitle")}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text)", margin: 0, lineHeight: 1.55 }}>
              {t("help.dataDesc")}
            </p>
          </section>

          {/* References */}
          <section>
            <p style={sectionTitleStyle}>{t("help.references")}</p>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {referenceList.map((ref, i) => (
                <li key={i} style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {ref}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
