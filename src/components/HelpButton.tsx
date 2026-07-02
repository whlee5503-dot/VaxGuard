// src/components/HelpButton.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import HelpModal from "./HelpModal";

/**
 * Self-contained help trigger, styled to match the existing
 * theme-toggle / language-button icons used across VaxGuard's
 * per-page headers (30x28px chip). Drop into any header's
 * right-side controls row.
 */
export default function HelpButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("help.btnLabel")}
        title={t("help.btnLabel")}
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
          width: "30px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          lineHeight: 1,
          flexShrink: 0,
          color: "var(--color-text-muted)",
        }}
      >
        ?
      </button>
      {open && <HelpModal onClose={() => setOpen(false)} />}
    </>
  );
}
