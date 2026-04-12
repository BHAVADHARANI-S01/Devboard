import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";

const VerifyEmail = () => {
  const [status, setStatus]   = useState("verifying");
  const [message, setMessage] = useState("");
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const t                     = useTheme();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.msg);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.msg || "Verification failed.");
      });
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ padding: "40px", background: t.card, borderRadius: "12px", border: `1px solid ${t.border}`, textAlign: "center", maxWidth: "400px", width: "90%" }}>

        {status === "verifying" && (
          <>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>⏳</p>
            <h2 style={{ color: t.text, margin: "0 0 8px 0" }}>Verifying your email...</h2>
            <p style={{ color: t.textMuted, fontSize: "14px" }}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>✅</p>
            <h2 style={{ color: t.text, margin: "0 0 8px 0" }}>Email Verified!</h2>
            <p style={{ color: t.textMuted, fontSize: "14px", marginBottom: "24px" }}>
              {message}
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{ padding: "10px 28px", background: "#378ADD", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px" }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>❌</p>
            <h2 style={{ color: t.text, margin: "0 0 8px 0" }}>Verification Failed</h2>
            <p style={{ color: t.textMuted, fontSize: "14px", marginBottom: "24px" }}>
              {message}
            </p>
            <button
              onClick={() => navigate("/register")}
              style={{ padding: "10px 28px", background: "#378ADD", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px" }}
            >
              Register Again
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;