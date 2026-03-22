import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

function FallingLeaves() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const LEAF_COLORS = [
      "#4a7c59", "#5a9a6f", "#6aad7e", "#3d6b4a",
      "#7dba8a", "#a8d5a2", "#c8e6c0", "#8bc34a",
    ];

    // Draw a simple leaf shape
    function drawLeaf(ctx, x, y, size, angle, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size);
      ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      // midrib
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // Create leaves
    const leaves = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      size: 8 + Math.random() * 14,
      speedY: 0.6 + Math.random() * 1.2,
      speedX: -0.5 + Math.random() * 1,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.012,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      leaves.forEach((l) => {
        l.sway += l.swaySpeed;
        l.x += l.speedX + Math.sin(l.sway) * 0.8;
        l.y += l.speedY;
        l.angle += l.rotSpeed;

        if (l.y > canvas.height + 20) {
          l.y = -20;
          l.x = Math.random() * canvas.width;
        }

        drawLeaf(ctx, l.x, l.y, l.size, l.angle, l.color);
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "linear-gradient(160deg, #d4e8d0 0%, #b8d9b2 30%, #c8e0c2 60%, #daecd5 100%)",
        fontFamily: "'DM Serif Display', serif",
        color: "#1e3a2a",
      }}
    >
      <FallingLeaves />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes scrollLeft  { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes scrollRight { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
        @keyframes marquee     { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes fadeUp      { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>     

      {/* ── Navbar ── */}
      <nav className="relative z-20 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "#2d5a3d" }}>
            🌿
          </div>
          <div>
            <p className="text-xl font-bold leading-none" style={{ color: "#1e3a2a" }}>GreenPlate</p>
            <p className="mono text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "#4a7c59" }}>
              Carbon Food Emissions Analyzer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="mono text-sm px-4 py-2 transition-colors"
            style={{ color: "#2d5a3d" }}>
            Log in
          </button>
          <button onClick={() => navigate("/register")}
            className="mono text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            style={{ background: "#2d5a3d", color: "#d4e8d0" }}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-12 pb-20 fade-up">
        <p className="mono text-[10px] tracking-[0.4em] uppercase mb-6" style={{ color: "#3d6b4a" }}>
          Carbon Food Emissions Analyzer
        </p>
        <h1 className="leading-none mb-6" style={{ fontSize: "clamp(52px, 10vw, 100px)", color: "#1e3a2a" }}>
          Eat Smart,<br />
          <em style={{ color: "#2d5a3d" }}>Live Green</em>
        </h1>
        <p className="mono max-w-sm leading-relaxed mb-10" style={{ fontSize: "13px", color: "#3d6b4a" }}>
          Upload a photo of your meal. Get your carbon footprint,<br />
          water usage, and a greener alternative.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mb-20">
          <button onClick={() => navigate("/register")}
            className="mono font-medium px-10 py-4 rounded-2xl text-sm transition-all active:scale-95"
            style={{ background: "#2d5a3d", color: "#d4e8d0", boxShadow: "0 8px 32px rgba(45,90,61,0.25)" }}>
            Analyze Your Meal →
          </button>
          <button onClick={() => navigate("/login")}
            className="mono text-sm px-8 py-4 rounded-2xl border transition-colors"
            style={{ borderColor: "#4a7c59", color: "#2d5a3d", background: "rgba(255,255,255,0.3)" }}>
            Log in
          </button>
        </div>

       
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 py-16" style={{ background: "rgba(45,90,61,0.08)", borderTop: "1px solid rgba(45,90,61,0.15)", borderBottom: "1px solid rgba(45,90,61,0.15)" }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            { value: "Free", label: "to analyze" },
            { value: "80%", label: "emissions saved going plant-based" },
            { value: "2500kg", label: "avg annual food carbon per person" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-5xl font-bold mb-2" style={{ color: "#2d5a3d" }}>{s.value}</p>
              <p className="mono text-xs uppercase tracking-widest" style={{ color: "#4a7c59" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      
      
      
      {/* ── How it works ── */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: "1px solid rgba(45,90,61,0.15)" }}>
        <div className="max-w-4xl mx-auto">
          <p className="mono text-center text-[10px] tracking-[0.4em] uppercase mb-4" style={{ color: "#3d6b4a" }}>
            How it works
          </p>
          <h2 className="text-center mb-16" style={{ fontSize: "clamp(32px, 6vw, 58px)", color: "#1e3a2a" }}>
            Three steps.<br /><em style={{ color: "#2d5a3d" }}>One greener plate.</em>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { n: "01", t: "Upload", d: "Drop a photo or type what you ate. Gemini identifies every ingredient automatically." },
              { n: "02", t: "Analyze", d: "Get your CO₂ footprint, water usage, and our custom algorithmic Green Score all calculated in seconds." },
              { n: "03", t: "Swap", d: "Receive a personalised eco alternative that keeps the flavour and cuts the impact." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-3 pt-6" style={{ borderTop: "1px solid rgba(45,90,61,0.2)" }}>
                <p className="mono text-6xl font-medium" style={{ color: "rgba(45,90,61,0.2)" }}>{s.n}</p>
                <h3 className="text-2xl" style={{ color: "#1e3a2a" }}>{s.t}</h3>
                <p className="mono text-xs leading-relaxed" style={{ color: "#4a7c59" }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-28 px-6 text-center">
        <h2 className="mb-6" style={{ fontSize: "clamp(36px, 7vw, 72px)", color: "#1e3a2a" }}>
          Ready to meet<br /><em style={{ color: "#2d5a3d" }}>your footprint?</em>
        </h2>
        <p className="mono text-xs max-w-xs mx-auto mb-10 leading-relaxed" style={{ color: "#4a7c59" }}>
          Join GreenPlate and start making more conscious choices — one meal at a time.
        </p>
        <button onClick={() => navigate("/register")}
          className="mono font-medium px-12 py-5 rounded-2xl text-sm transition-all active:scale-95"
          style={{ background: "#2d5a3d", color: "#d4e8d0", boxShadow: "0 12px 40px rgba(45,90,61,0.3)" }}>
          Create Free Account →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-8 py-8 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(45,90,61,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "#2d5a3d" }}>🌿</div>
          <p className="font-bold" style={{ color: "#2d5a3d" }}>GreenPlate</p>
        </div>
        <p className="mono text-xs" style={{ color: "#6aad7e" }}>
          © 2026 GreenPlate · Built for sustainability
        </p>
      </footer>
    </div>
  );
}