import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/app");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #d4e8d0 0%, #b8d9b2 50%, #daecd5 100%)", fontFamily: "'DM Serif Display', serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 24px 64px rgba(45,90,61,0.15)" }}>

        <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "#2d5a3d" }}>🌿</div>
          <p className="text-lg font-bold" style={{ color: "#1e3a2a" }}>GreenPlate</p>
        </button>

        <h1 className="text-3xl mb-1" style={{ color: "#1e3a2a" }}>Welcome back</h1>
        <p className="mb-8 text-sm" style={{ fontFamily: "'DM Mono', monospace", color: "#4a7c59" }}>Log in to your account</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs text-center"
            style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", fontFamily: "'DM Mono', monospace", color: "#c0392b" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#4a7c59" }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl outline-none text-sm"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(45,90,61,0.2)", fontFamily: "'DM Mono', monospace", color: "#1e3a2a" }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#4a7c59" }}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="w-full px-4 py-3 rounded-xl outline-none text-sm"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(45,90,61,0.2)", fontFamily: "'DM Mono', monospace", color: "#1e3a2a" }} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-medium mt-2 transition-all active:scale-95"
            style={{ background: loading ? "rgba(45,90,61,0.4)" : "#2d5a3d", color: "#d4e8d0", fontFamily: "'DM Mono', monospace", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ fontFamily: "'DM Mono', monospace", color: "#4a7c59" }}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#2d5a3d", fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}