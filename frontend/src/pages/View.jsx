import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MONO = { fontFamily: "'DM Mono', monospace" };
const SERIF = { fontFamily: "'DM Serif Display', serif" };

// ── Severity → score ──────────────────────────────────────────────────────────
function severityToScore(severity) {
  if (severity === "low") return 80;
  if (severity === "medium") return 50;
  return 20;
}

function scoreColor(score) {
  if (score >= 70) return "#2d5a3d";
  if (score >= 45) return "#d4822a";
  return "#c0392b";
}

function SemiDial({ score }) {
  const color = scoreColor(score);
  const r = 60;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * r; // half circle
  const fillLength = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full">
      <svg width="100%" viewBox="0 0 200 105" style={{ maxWidth: "240px" }}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(45,90,61,0.1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Fill using strokeDasharray */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="34" fontWeight="700"
          fill={color} style={{ fontFamily: "'DM Serif Display', serif" }}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#9ab8a4"
          style={{ fontFamily: "'DM Mono', monospace" }}>out of 100</text>
        <text x="14" y="104" fontSize="9" fill="#9ab8a4" style={{ fontFamily: "'DM Mono', monospace" }}>0</text>
        <text x="176" y="104" fontSize="9" fill="#9ab8a4" style={{ fontFamily: "'DM Mono', monospace" }}>100</text>
      </svg>
      <p className="text-sm font-bold" style={{ ...MONO, color }}>
        {score >= 70 ? "Low Impact" : score >= 45 ? "Moderate Impact" : "High Impact"}
      </p>
    </div>
  );
}

// ── Meter bar ─────────────────────────────────────────────────────────────────
function Meter({ label, value, unit, pct, color }) {
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <p className="text-xs uppercase tracking-widest" style={{ ...MONO, color: "#4a7c59" }}>{label}</p>
        <p className="text-2xl font-bold" style={{ ...SERIF, color: "#1e3a2a" }}>
          {value}<span className="text-sm font-normal ml-1" style={{ ...MONO, color: "#4a7c59" }}>{unit}</span>
        </p>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(45,90,61,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function View() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [tab, setTab] = useState("image");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [weeklyAvg, setWeeklyAvg] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null); // null = original, index = swap index
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchWeeklyAvg(); }, []);

  const fetchWeeklyAvg = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5001/user/avgEmissionPerWeek", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.total_co2_kg !== undefined) setWeeklyAvg(data.total_co2_kg);
    } catch (e) {}
  };

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const canSubmit = !loading && (tab === "image" ? !!imageFile : textInput.trim().length > 2);

  const handleAnalyzePhoto = async () => {
    if (!imageFile) return;
    setError(null);
    setLoading(true);
    setSaved(false);
    setSelectedFood(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch("http://localhost:5001/analyze-image", {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) return;
    setError(null);
    setLoading(true);
    setSaved(false);
    setSelectedFood(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ meal: textInput }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save whichever food the user selected (original or a swap)
  const handleAddFood = async () => {
    if (!results) return;
    setSaving(true);
    const token = localStorage.getItem("token");

    let foodToSave;
    if (selectedFood === null) {
      // saving original meal
      foodToSave = results;
    } else {
      // saving a swap — build a simplified object matching backend schema
      const swap = results.swaps[selectedFood];
      foodToSave = {
        meal: swap.suggestion,
        total_co2_kg: swap.co2_kg,
        total_water_liters: swap.water_liters,
        severity: swap.severity,
        items: [],
        swaps: [],
        comparisons: swap.comparisons || {},
      };
    }

    try {
      await fetch("http://localhost:5001/user/addFood", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ food: foodToSave }),
      });
      setSaved(true);
      fetchWeeklyAvg();
    } catch (e) {
      setError("Failed to save food");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setTextInput("");
    setSaved(false);
    setSelectedFood(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Determine what's currently "selected" for display
  const displayData = results && selectedFood !== null
    ? { ...results.swaps[selectedFood], isSwap: true }
    : results;

  const displayScore = displayData
  ? (selectedFood !== null
      ? (results.swaps[selectedFood].green_score ?? severityToScore(results.swaps[selectedFood].severity))
      : (results.green_score ?? severityToScore(results.severity)))
  : 0;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #d4e8d0 0%, #b8d9b2 40%, #daecd5 100%)", fontFamily: "'DM Serif Display', serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');`}</style>

      {/* ── Navbar ── */}
      <nav className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(45,90,61,0.15)", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: "#2d5a3d" }}>🌿</div>
          <p className="text-lg font-bold" style={{ color: "#1e3a2a" }}>GreenPlate</p>
        </button>
        <button onClick={handleLogout} className="text-xs px-4 py-2 rounded-lg border"
          style={{ ...MONO, color: "#4a7c59", borderColor: "rgba(45,90,61,0.2)", background: "rgba(255,255,255,0.4)" }}>
          Log out
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 61px)" }}>

        {/* ── LEFT ── */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col border-r overflow-y-auto p-5 gap-4"
          style={{ borderColor: "rgba(45,90,61,0.15)", background: "rgba(255,255,255,0.4)" }}>

          <div>
            <p className="text-xl font-bold" style={{ color: "#1e3a2a" }}>Analyze a Meal</p>
            <p className="text-xs" style={{ ...MONO, color: "#4a7c59" }}>Upload a photo or describe your dish</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(45,90,61,0.08)" }}>
            {[{ id: "image", label: "📷 Photo" }, { id: "text", label: "✏️ Text" }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  ...MONO,
                  background: tab === t.id ? "rgba(255,255,255,0.9)" : "transparent",
                  color: tab === t.id ? "#1e3a2a" : "#4a7c59",
                  border: tab === t.id ? "1px solid rgba(45,90,61,0.15)" : "1px solid transparent",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {tab === "image" ? (
            <div onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              className="rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden"
              style={{ borderColor: dragOver ? "#2d5a3d" : "rgba(45,90,61,0.25)", background: "rgba(255,255,255,0.5)" }}>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Meal" className="w-full max-h-48 object-contain p-3" />
                  <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#4a7c59", border: "1px solid rgba(45,90,61,0.2)" }}>✕</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "rgba(45,90,61,0.1)" }}>🍽️</div>
                  <p className="text-sm" style={{ color: "#1e3a2a" }}>Drop your meal photo</p>
                  <p className="text-[9px] uppercase tracking-widest" style={{ ...MONO, color: "#6aad7e" }}>or click to browse</p>
                </div>
              )}
            </div>
          ) : (
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. Beef burger with cheddar, brioche bun, lettuce, tomato…"
              className="w-full min-h-36 px-4 py-3 rounded-2xl text-sm resize-none outline-none leading-relaxed"
              style={{ ...MONO, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(45,90,61,0.2)", color: "#1e3a2a" }} />
          )}

          {error && (
            <p className="text-xs px-4 py-3 rounded-xl text-center"
              style={{ ...MONO, color: "#c0392b", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.15)" }}>
              ⚠ {error}
            </p>
          )}

          <button onClick={tab === "image" ? handleAnalyzePhoto : handleAnalyzeText} disabled={!canSubmit}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ ...MONO, background: canSubmit ? "#2d5a3d" : "rgba(45,90,61,0.15)", color: canSubmit ? "#d4e8d0" : "#6aad7e", cursor: canSubmit ? "pointer" : "not-allowed" }}>
            {loading ? "Analyzing…" : "Analyze Meal →"}
          </button>

          {/* Weekly average */}
          {weeklyAvg !== null && (
            <div className="mt-auto rounded-2xl p-4" style={{ background: "rgba(45,90,61,0.06)", border: "1px solid rgba(45,90,61,0.15)" }}>
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ ...MONO, color: "#4a7c59" }}>Your Weekly Average</p>
              <p className="text-2xl font-bold" style={{ ...SERIF, color: "#1e3a2a" }}>
                {weeklyAvg.toFixed(2)}<span className="text-xs font-normal ml-1" style={{ ...MONO, color: "#4a7c59" }}>kg CO₂/day</span>
              </p>
              <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ background: "rgba(45,90,61,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((weeklyAvg / 5) * 100, 100)}%`, background: weeklyAvg < 1.5 ? "#2d5a3d" : weeklyAvg < 3 ? "#d4822a" : "#c0392b" }} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#6aad7e" }}>
                {weeklyAvg < 1.5 ? "🟢 Great job!" : weeklyAvg < 3 ? "🟡 Room to improve" : "🔴 Try some swaps"}
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: "white" }}>

          {/* Empty state */}
          {!results && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(45,90,61,0.06)" }}>🌿</div>
              <p className="text-2xl" style={{ color: "#2d5a3d" }}>Results</p>
              <p className="text-sm" style={{ ...MONO, color: "#9ab8a4" }}>Your analysis will appear here after the job is completed.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "#2d5a3d", borderTopColor: "transparent" }} />
              <p className="text-lg" style={{ color: "#2d5a3d" }}>Analyzing your meal…</p>
              <p className="text-xs uppercase tracking-widest" style={{ ...MONO, color: "#6aad7e" }}>Calculating footprint</p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="p-8 flex flex-col gap-6 max-w-2xl w-full mx-auto">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ ...MONO, color: "#4a7c59" }}>Analysis complete</p>
                  <p className="text-3xl italic" style={{ color: "#1e3a2a" }}>
                    {selectedFood !== null ? results.swaps[selectedFood].suggestion : results.meal}
                  </p>
                </div>
                <button onClick={handleReset} className="text-xs px-3 py-2 rounded-lg border mt-1"
                  style={{ ...MONO, color: "#4a7c59", borderColor: "rgba(45,90,61,0.2)" }}>
                  ↩ Reset
                </button>
              </div>

              {/* Dial */}
              <div className="flex flex-col items-center py-4 rounded-2xl"
                style={{ background: "rgba(45,90,61,0.03)", border: "1px solid rgba(45,90,61,0.08)" }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ ...MONO, color: "#4a7c59" }}>Green Score</p>
                <SemiDial score={displayScore} />
                {results.comparisons && selectedFood === null && (
                  <p className="text-xs mt-2" style={{ ...MONO, color: "#4a7c59" }}>
                    🚗 {results.comparisons.driving_miles?.toFixed(1)} miles driven · 🚿 {results.comparisons.showers?.toFixed(0)} showers
                  </p>
                )}
              </div>

              {/* Meters */}
              <div className="rounded-2xl p-6 flex flex-col gap-5"
                style={{ border: "1px solid rgba(45,90,61,0.1)" }}>
                <Meter
                  label="Carbon Footprint"
                  value={selectedFood !== null ? results.swaps[selectedFood].co2_kg?.toFixed(2) : results.total_co2_kg?.toFixed(2)}
                  unit="kg CO₂"
                  pct={((selectedFood !== null ? results.swaps[selectedFood].co2_kg : results.total_co2_kg) / 15) * 100}
                  color="#d4822a"
                />
                <Meter
                  label="Water Usage"
                  value={Math.round(selectedFood !== null ? results.swaps[selectedFood].water_liters : results.total_water_liters).toLocaleString()}
                  unit="liters"
                  pct={((selectedFood !== null ? results.swaps[selectedFood].water_liters : results.total_water_liters) / 5000) * 100}
                  color="#2980b9"
                />
              </div>

              {/* Ingredient breakdown — only for original */}
              {selectedFood === null && results.items?.length > 0 && (
                <div className="rounded-2xl p-6" style={{ border: "1px solid rgba(45,90,61,0.1)" }}>
                  <p className="text-xs uppercase tracking-widest mb-4" style={{ ...MONO, color: "#4a7c59" }}>Ingredient Breakdown</p>
                  <div className="flex flex-col gap-3">
                    {results.items.map((c, i) => {
                      const max = Math.max(...results.items.map(x => x.co2_kg));
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <p className="text-sm w-36 shrink-0 truncate" style={{ color: "#1e3a2a" }}>{c.name}</p>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(45,90,61,0.08)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${(c.co2_kg / max) * 100}%`, background: "linear-gradient(90deg, #4a7c59, #d4822a)" }} />
                          </div>
                          <p className="text-xs w-16 text-right" style={{ ...MONO, color: "#4a7c59" }}>{c.co2_kg?.toFixed(3)} kg</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Swaps */}
              {results.swaps?.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-widest" style={{ ...MONO, color: "#4a7c59" }}>🌱 Greener Swaps — click to select</p>
                  {results.swaps.map((s, i) => (
                    <button key={i} onClick={() => setSelectedFood(selectedFood === i ? null : i)}
                      className="rounded-2xl p-5 text-left transition-all w-full"
                      style={{
                        border: selectedFood === i ? "2px solid #2d5a3d" : "1px solid rgba(45,90,61,0.15)",
                        background: selectedFood === i ? "rgba(45,90,61,0.08)" : "rgba(45,90,61,0.03)",
                      }}>
                      <p className="text-base font-bold mb-2" style={{ color: "#1e3a2a" }}>{s.suggestion}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ ...MONO, background: "rgba(45,90,61,0.1)", color: "#2d5a3d" }}>
                          {s.co2_kg?.toFixed(2)} kg CO₂
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full capitalize" style={{ ...MONO, background: "rgba(45,90,61,0.1)", color: "#2d5a3d" }}>
                          {s.severity} impact
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ ...MONO, background: "rgba(41,128,185,0.08)", color: "#2980b9" }}>
                          {Math.round(s.water_liters)} L water
                        </span>
                      </div>
                      {selectedFood === i && (
                        <p className="text-xs mt-2" style={{ ...MONO, color: "#2d5a3d" }}>✓ Selected</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Add food button */}
              {!saved ? (
                <button onClick={handleAddFood} disabled={saving}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95"
                  style={{
                    background: saving ? "rgba(45,90,61,0.3)" : "#2d5a3d",
                    color: "#d4e8d0",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 20px rgba(45,90,61,0.2)",
                  }}>
                  {saving ? "Saving…" : selectedFood !== null
                    ? `✓ I Ate the Swap: ${results.swaps[selectedFood].suggestion.split(" ").slice(0, 3).join(" ")}…`
                    : "✓ I Ate This — Add to Log"}
                </button>
              ) : (
                <div className="w-full py-4 rounded-2xl text-center text-base font-bold"
                  style={{ background: "rgba(45,90,61,0.08)", border: "2px solid #2d5a3d", color: "#2d5a3d" }}>
                  🌿 Added to your food log!
                </div>
              )}
              
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}