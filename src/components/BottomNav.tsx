import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { path: "/",        icon: "🏠", label: "Home"    },
  { path: "/input",   icon: "🌡️", label: "Input"   },
  { path: "/result",  icon: "📊", label: "Result"  },
  { path: "/history", icon: "📋", label: "History" },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleTab(path: string) {
    if (path === "/input" && !sessionStorage.getItem("vaxguard-vaccineId")) {
      navigate("/");
      return;
    }
    if (path === "/result" && !sessionStorage.getItem("vaxguard-result")) {
      navigate("/");
      return;
    }
    navigate(path);
  }

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        zIndex: 1000,
      }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => handleTab(tab.path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 0",
              gap: "3px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              transition: "color 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
