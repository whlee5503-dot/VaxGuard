import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: "🏠", label: "Home", path: "/" },
    { icon: "🌡️", label: "Input", path: "/input" },
    { icon: "📊", label: "Result", path: "/result" },
    { icon: "📋", label: "History", path: "/history" },
  ];

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      paddingBottom: "env(safe-area-inset-bottom)",
      left: 0,
      right: 0,
      display: "flex",
      backgroundColor: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      zIndex: 9999,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            flex: 1,
            border: "none",
            background: "none",
            padding: "8px 4px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            color: location.pathname === tab.path
              ? "var(--color-primary)"
              : "var(--color-text-muted)",
            fontWeight: location.pathname === tab.path ? 600 : 400,
            fontSize: "0.7rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
