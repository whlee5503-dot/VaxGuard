// src/components/Footer.tsx — PHT Lab family footer (ported from EpiLog)
import { useTranslation } from "react-i18next";
import { SIBLING_APPS } from "../data/siblingApps";

const CURRENT_APP_ID = "vaxguard";

const mutedLink: React.CSSProperties = {
  color: "var(--color-text-muted)",
  textDecoration: "none",
};

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        marginTop: "32px",
        padding: "24px 0 8px",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px" }}>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-text-muted)",
          }}
        >
          {t("footer.siblingsHeading")}
        </span>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {SIBLING_APPS.map((app) =>
            app.id === CURRENT_APP_ID ? (
              <span key={app.id} style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary)" }}>
                {app.name}
              </span>
            ) : (
              <a key={app.id} href={app.url} style={{ ...mutedLink, fontSize: "0.85rem" }}>
                {app.name}
              </a>
            )
          )}
        </nav>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
        }}
      >
        <a href="https://phtlab.org" target="_blank" rel="noopener noreferrer" style={mutedLink}>
          {t("footer.hub")}
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://orcid.org/0009-0005-1866-8257" target="_blank" rel="noopener noreferrer" style={mutedLink}>
          {t("footer.orcid")}
        </a>
        <span aria-hidden="true">·</span>
        <span>© {year} Won Ho Lee · PHT Lab</span>
      </div>

      <p
        style={{
          fontSize: "0.7rem",
          fontStyle: "italic",
          lineHeight: 1.5,
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
        {t("footer.disclaimer")}
      </p>
    </footer>
  );
}
