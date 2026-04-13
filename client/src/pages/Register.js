import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const Register = () => {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState("");
  const [done, setDone]         = useState(false);
  const [waking, setWaking]     = useState(false);  // NEW: cold start indicator

  const { register } = useAuth();  // FIX: use register from AuthContext
  const navigate = useNavigate();
  const t        = useTheme();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWaking(false);

    // NEW: Show "waking server" message after 4s if still loading
    const wakeTimer = setTimeout(() => setWaking(true), 4000);

    try {
      await register(name, email, password);  // FIX: use AuthContext register
      clearTimeout(wakeTimer);
      setDone(true);
      toast.success("Check your email to verify your account!");
    } catch (err) {
      clearTimeout(wakeTimer);
      console.error("Register error:", err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error("Server is taking too long. Please try again.");
      } else {
        toast.error(err.response?.data?.msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setWaking(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%", padding: "12px 16px",
    background: t.inputBg, color: t.text,
    border: `1px solid ${focused === field ? t.accent : t.border}`,
    borderRadius: "10px", fontSize: "15px",
    outline: "none", transition: "all 0.2s",
    boxShadow: focused === field ? `0 0 0 3px ${t.accentLight}` : "none",
    fontFamily: "'Outfit', sans-serif",
    boxSizing: "border-box",
  });

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "48px 36px", textAlign: "center", maxWidth: "400px", width: "90%" }}>
          <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>📧</p>
          <h2 style={{ color: t.text, fontSize: "22px", fontWeight: "700", margin: "0 0 10px 0" }}>
            Check your email!
          </h2>
          <p style={{ color: t.textMuted, fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            We sent a verification link to <strong style={{ color: t.text }}>{email}</strong>. Click the link to activate your account.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{ padding: "12px 28px", background: t.accent, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "600", fontFamily: "'Outfit', sans-serif" }}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center", alignItems: "center", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "36px", background: t.accent, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>D</span>
          </div>
          <span style={{ color: t.text, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>DevBoard</span>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "36px" }}>
          <h1 style={{ color: t.text, fontSize: "24px", fontWeight: "700", marginBottom: "6px", letterSpacing: "-0.5px" }}>
            Create your account
          </h1>
          <p style={{ color: t.textMuted, fontSize: "14px", marginBottom: "28px" }}>
            Start managing projects like a pro
          </p>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: t.textMuted, fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Full name
              </label>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused("")}
                required placeholder="Enter Name"
                style={inputStyle("name")}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: t.textMuted, fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                required placeholder="you@example.com"
                style={inputStyle("email")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: t.textMuted, fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                required minLength={6}
                placeholder="Min. 6 characters"
                style={inputStyle("password")}
              />
            </div>

            {/* NEW: Cold start message */}
            {waking && (
              <p style={{ fontSize: "13px", color: t.textMuted, marginBottom: "12px", textAlign: "center" }}>
                ⏳ Server is waking up, please wait a moment...
              </p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? t.bg4 : t.accent,
                color: "white", border: "none",
                borderRadius: "10px", fontSize: "15px",
                fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s", fontFamily: "'Outfit', sans-serif"
              }}
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: t.textMuted, fontSize: "14px", marginTop: "20px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: t.accent, fontWeight: "600", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={t.toggle}
            style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontFamily: "'Outfit', sans-serif" }}
          >
            {t.dark ? "☀ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
