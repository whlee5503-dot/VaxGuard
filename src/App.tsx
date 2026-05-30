import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Result from "./pages/Result";
import History from "./pages/History";
import BottomNav from "./components/BottomNav";
import "./i18n";

function AppLayout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        backgroundColor: "var(--color-bg)",
        overflow: "hidden",
      }}
    >
      {/* 페이지 콘텐츠 — 스크롤 가능 */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/input"   element={<Input />} />
          <Route path="/result"  element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* 네비게이션 — flex 하단 고정 */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </Suspense>
    </ThemeProvider>
  );
}
