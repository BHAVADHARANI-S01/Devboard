import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState("");
  const [waking, setWaking]     = useState(false);  // NEW: cold start indicator

  const { login } = useAuth();
  const navigate  = useNavigate();
  const t         = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWaking(false);

    // NEW: Show "waking server" message after 4s if still loading
    const wakeTimer = setTimeout(() => setWaking(true), 4000);

    try {
      await login(email, password);
      clearTimeout(wakeTimer);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      clearTimeout(wakeTimer);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error("Server is taking too long. Please try again.");
      } else {
        toast.error(err.response?.data?.msg || "Login failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
      setWaking(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", fontFamily: "'Outfit', sans-serif" }}>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* LOGO */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <div style={{ width: "36px", height: "36px", background: t.accent, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>D</span>
            </div>
            <span style={{ color: t.text, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>DevBoard</span>
          </div>

          <h1 style={{ color: t.text, fontSize: "28px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.5px" }}>
            Welcome back
          </h1>
          <p style={{ color: t.textMuted, fontSize: "15px", marginBottom: "32px" }}>
            Sign in to continue to your workspace
          </p>

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: t.textMuted, fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "12px 16px",
                  background: t.inputBg, color: t.text,
                  border: `1px solid ${focused === "email" ? t.accent : t.border}`,
                  borderRadius: "10px", fontSize: "15px",
                  outline: "none", transition: "border-color 0.2s",
                  boxShadow: focused === "email" ? `0 0 0 3px ${t.accentLight}` : "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: t.textMuted, fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                required
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 16px",
                  background: t.inputBg, color: t.text,
                  border: `1px solid ${focused === "password" ? t.accent : t.border}`,
                  borderRadius: "10px", fontSize: "15px",
                  outline: "none", transition: "border-color 0.2s",
                  boxShadow: focused === "password" ? `0 0 0 3px ${t.accentLight}` : "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* NEW: Cold start message */}
            {waking && (
              <p style={{ fontSize: "13px", color: t.textMuted, marginBottom: "12px", textAlign: "center" }}>
                ⏳ Server is waking up, please wait a moment...
              </p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? t.bg4 : t.accent,
                color: "white", border: "none",
                borderRadius: "10px", fontSize: "15px",
                fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s", letterSpacing: "0.2px",
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: t.textMuted, fontSize: "14px", marginTop: "24px" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: t.accent, fontWeight: "600", textDecoration: "none" }}>
              Create one free
            </Link>
          </p>

          {/* THEME TOGGLE */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              onClick={t.toggle}
              style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}
            >
              {t.dark ? "☀ Light mode" : "🌙 Dark mode"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, background: t.bg3, borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", right: "-10%", width: "400px", height: "400px", background: `radial-gradient(circle, ${t.accent}15 0%, transparent 70%)`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-10%", width: "300px", height: "300px", background: `radial-gradient(circle, ${t.success}10 0%, transparent 70%)`, borderRadius: "50%" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "360px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "40px" }}>
            {["To Do", "In Progress", "Done"].map((col, i) => (
              <div key={col} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col}</div>
                {[...Array(i === 0 ? 3 : i === 1 ? 2 : 1)].map((_, j) => (
                  <div key={j} style={{ background: t.bg3, borderRadius: "6px", padding: "8px", marginBottom: "6px", height: "32px", opacity: 1 - j * 0.2 }} />
                ))}
              </div>
            ))}
          </div>
          <h2 style={{ color: t.text, fontSize: "22px", fontWeight: "700", marginBottom: "12px", letterSpacing: "-0.5px" }}>
            Ship faster with DevBoard
          </h2>
          <p style={{ color: t.textMuted, fontSize: "14px", lineHeight: "1.6" }}>
            Real-time Kanban boards, sprint tracking, burndown charts and Pomodoro timer — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
