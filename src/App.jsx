import { useState, useEffect, useRef } from "react";

const STRINGS = [
  {
    id: "UI_001",
    category: "HUD",
    source: "Health: {0} / {1}",
    maxChars: 20,
    context: "HUD display showing current and maximum health points in battle.",
    characterName: null,
    note: "Keep variables {0} and {1} intact. Very limited space.",
  },
  {
    id: "DLG_002",
    category: "DIALOGUE",
    source: "The cursed blade has awakened. You must not wield it, traveler — not until the prophecy is fulfilled.",
    maxChars: 120,
    context: "An ancient wizard warns the player about a legendary sword. Formal, archaic tone.",
    characterName: "Archimage Valdren",
    note: "Formal register. The wizard speaks in elevated, old-fashioned style.",
  },
  {
    id: "MNU_003",
    category: "MENU",
    source: "New Game",
    maxChars: 12,
    context: "Main menu button to start a new playthrough.",
    characterName: null,
    note: "Very short. Must be a noun phrase, not a verb.",
  },
  {
    id: "DLG_004",
    category: "DIALOGUE",
    source: "I've been waiting for you, %s. The kingdom of Arathos needs its champion.",
    maxChars: 100,
    context: "NPC greets the player by their chosen character name. Dramatic, cinematic tone.",
    characterName: "Queen Seraphine",
    note: "Variable %s = player name. Do not translate it.",
  },
  {
    id: "SYS_005",
    category: "SYSTEM",
    source: "Your companion has fallen. Return to a safe zone to revive them.",
    maxChars: 80,
    context: "On-screen alert when a party member is defeated in battle.",
    characterName: null,
    note: "Urgent tone but not aggressive. Informational.",
  },
  {
    id: "ITM_006",
    category: "ITEM",
    source: "Elixir of Forgotten Shadows — Restores %d MP and grants invisibility for 30 seconds.",
    maxChars: 90,
    context: "Item description in inventory screen.",
    characterName: null,
    note: "Keep %d for mana value. Poetic item name should be translated.",
  },
  {
    id: "DLG_007",
    category: "DIALOGUE",
    source: "Run! The dark fortress is collapsing — we have less than two minutes!",
    maxChars: 80,
    context: "Urgent dialogue during a timed escape sequence. High adrenaline moment.",
    characterName: "Lyra (companion)",
    note: "Convey urgency. Keep it short. Exclamation is mandatory.",
  },
  {
    id: "TUT_008",
    category: "TUTORIAL",
    source: "Press [JUMP] to leap over obstacles. Hold [JUMP] to glide.",
    maxChars: 60,
    context: "Tutorial hint displayed on screen during the first level.",
    characterName: null,
    note: "Keep [JUMP] in brackets. Do not translate button names.",
  },
];

const CATEGORY_COLORS = {
  HUD: { bg: "#1a2a1a", border: "#4ade80", text: "#4ade80" },
  DIALOGUE: { bg: "#1a1a2e", border: "#818cf8", text: "#818cf8" },
  MENU: { bg: "#2a1a1a", border: "#f87171", text: "#f87171" },
  SYSTEM: { bg: "#1a1f2e", border: "#60a5fa", text: "#60a5fa" },
  ITEM: { bg: "#2a1a2a", border: "#c084fc", text: "#c084fc" },
  TUTORIAL: { bg: "#1a2a2a", border: "#34d399", text: "#34d399" },
};

const RUBRIC_CRITERIA = [
  { key: "variables", label: "Variables intactas", max: 20 },
  { key: "charLimit", label: "Límite de caracteres", max: 15 },
  { key: "register", label: "Registro y tono", max: 25 },
  { key: "fluency", label: "Fluidez en español latino", max: 25 },
  { key: "accuracy", label: "Fidelidad al sentido", max: 15 },
];

function ScoreBar({ score, max, color }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 8, background: "#1e1e2e", borderRadius: 4, overflow: "hidden"
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171",
          borderRadius: 4, transition: "width 0.6s ease"
        }} />
      </div>
      <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 50, textAlign: "right" }}>
        {score}/{max}
      </span>
    </div>
  );
}

export default function LocalizationLab() {
  const [current, setCurrent] = useState(0);
  const [translations, setTranslations] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [completed, setCompleted] = useState(false);
  const textareaRef = useRef(null);

  const str = STRINGS[current];
  const translation = translations[str.id] || "";
  const feedback = feedbacks[str.id];
  const cat = CATEGORY_COLORS[str.category] || CATEGORY_COLORS["SYSTEM"];
  const charCount = translation.length;
  const overLimit = charCount > str.maxChars;

  useEffect(() => {
    setShowPanel(!!feedbacks[str.id]);
  }, [current, feedbacks]);

  async function evaluate() {
    if (!translation.trim()) return;
    setLoading(true);
    setShowPanel(false);

    const prompt = `You are an expert video game localization evaluator. A student translated the following English string into Latin American Spanish for a Fantasy RPG game.

STRING ID: ${str.id}
CATEGORY: ${str.category}
CONTEXT: ${str.context}
NOTE FOR TRANSLATOR: ${str.note}
CHARACTER: ${str.characterName || "N/A (UI text)"}
MAX CHARACTERS ALLOWED: ${str.maxChars}

ORIGINAL (English): ${str.source}
STUDENT TRANSLATION: ${translation}
CHARACTER COUNT: ${charCount} / ${str.maxChars}

Evaluate the translation using this rubric (respond ONLY in JSON, no markdown, no preamble):
{
  "scores": {
    "variables": <0-20, full points if all variables like {0}, %s, %d, [JUMP] are preserved exactly>,
    "charLimit": <0-15, 15 if within limit, 10 if 1-5 chars over, 0 if more than 5 over>,
    "register": <0-25, based on tone, formality level appropriate to context and character>,
    "fluency": <0-25, natural Latin American Spanish, no calques, no peninsular terms>,
    "accuracy": <0-15, faithfulness to the source meaning>
  },
  "total": <sum of all scores, max 100>,
  "summary": "<2-3 sentence overall assessment in Spanish>",
  "strengths": ["<strength 1 in Spanish>", "<strength 2 in Spanish>"],
  "issues": ["<issue 1 in Spanish with suggested fix>", "<issue 2 in Spanish if any>"],
  "suggestedTranslation": "<your suggested translation for comparison>"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setFeedbacks(prev => ({ ...prev, [str.id]: parsed }));
      setShowPanel(true);
    } catch (e) {
      setFeedbacks(prev => ({ ...prev, [str.id]: { error: true } }));
      setShowPanel(true);
    }
    setLoading(false);
  }

  function next() {
    if (current < STRINGS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setCompleted(true);
    }
  }

  function prev() {
    if (current > 0) setCurrent(c => c - 1);
  }

  const progress = Object.keys(feedbacks).length;
  const avgScore = progress > 0
    ? Math.round(Object.values(feedbacks).filter(f => !f.error).reduce((acc, f) => acc + (f.total || 0), 0) / progress)
    : null;

  if (completed) {
    const evaluated = Object.values(feedbacks).filter(f => !f.error);
    const finalScore = evaluated.length > 0
      ? Math.round(evaluated.reduce((a, f) => a + f.total, 0) / evaluated.length)
      : 0;

    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a14",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 24
      }}>
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚔️</div>
          <h1 style={{ color: "#f8f4e8", fontSize: 28, marginBottom: 8, fontFamily: "Georgia, serif" }}>
            Ejercicio completado
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: 32 }}>
            Has localizado {evaluated.length} de {STRINGS.length} strings del juego
          </p>
          <div style={{
            background: "#12121f", border: "1px solid #2d2d4e",
            borderRadius: 12, padding: 32, marginBottom: 24
          }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: finalScore >= 80 ? "#4ade80" : finalScore >= 60 ? "#facc15" : "#f87171" }}>
              {finalScore}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>Puntuación promedio / 100</div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {RUBRIC_CRITERIA.map(c => {
                const avg = evaluated.length > 0
                  ? Math.round(evaluated.reduce((a, f) => a + (f.scores?.[c.key] || 0), 0) / evaluated.length)
                  : 0;
                return (
                  <div key={c.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#cbd5e1", fontSize: 13 }}>{c.label}</span>
                    </div>
                    <ScoreBar score={avg} max={c.max} />
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => { setCurrent(0); setCompleted(false); setTranslations({}); setFeedbacks({}); }}
            style={{
              background: "#4f46e5", color: "white", border: "none",
              padding: "12px 32px", borderRadius: 8, cursor: "pointer", fontSize: 15
            }}
          >
            Reiniciar ejercicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a14",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f8f4e8", display: "flex", flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        background: "#0d0d1a", borderBottom: "1px solid #1e1e3a",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚔️</span>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#c4b5fd", letterSpacing: 1 }}>
              LABORATORIO DE LOCALIZACIÓN
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Fantasy RPG · EN → ES Latino</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {avgScore !== null && (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Promedio: <span style={{ color: avgScore >= 80 ? "#4ade80" : "#facc15", fontWeight: 700 }}>{avgScore}</span>
            </div>
          )}
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            {progress}/{STRINGS.length} evaluados
          </div>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5 }}>
            {STRINGS.map((s, i) => (
              <div key={i} onClick={() => setCurrent(i)} style={{
                width: 10, height: 10, borderRadius: "50%", cursor: "pointer",
                background: feedbacks[s.id] ? (feedbacks[s.id].total >= 70 ? "#4ade80" : "#f87171")
                  : i === current ? "#818cf8" : "#2d2d4e",
                border: i === current ? "1px solid #c4b5fd" : "none",
                transition: "background 0.3s"
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 900, margin: "0 auto", width: "100%", padding: "24px 16px", gap: 20 }}>

        {/* String card */}
        <div style={{
          background: cat.bg, border: `1px solid ${cat.border}`,
          borderRadius: 12, padding: 20, position: "relative"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                background: cat.border, color: "#0a0a14", fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 4, letterSpacing: 1
              }}>{str.category}</span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{str.id}</span>
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Límite: {str.maxChars} caracteres</span>
          </div>

          {str.characterName && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Personaje: </span>
              <span style={{ fontSize: 13, color: cat.text, fontStyle: "italic" }}>{str.characterName}</span>
            </div>
          )}

          <div style={{
            background: "#00000040", borderRadius: 8, padding: "12px 16px",
            fontSize: 16, color: "#f8f4e8", lineHeight: 1.6, marginBottom: 12,
            fontFamily: "Georgia, serif"
          }}>
            {str.source}
          </div>

          <div style={{
            fontSize: 12, color: "#94a3b8", borderTop: `1px solid ${cat.border}30`,
            paddingTop: 10, display: "flex", gap: 16, flexWrap: "wrap"
          }}>
            <span>📖 <em>{str.context}</em></span>
          </div>
          {str.note && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#facc15" }}>
              ⚠️ Nota: {str.note}
            </div>
          )}
        </div>

        {/* Translation input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: "#94a3b8" }}>Tu traducción al español latino</label>
            <span style={{ fontSize: 12, color: overLimit ? "#f87171" : charCount > str.maxChars * 0.85 ? "#facc15" : "#64748b" }}>
              {charCount} / {str.maxChars}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={translation}
            onChange={e => setTranslations(prev => ({ ...prev, [str.id]: e.target.value }))}
            placeholder="Escribe aquí tu traducción..."
            style={{
              width: "100%", minHeight: 90, background: "#12121f",
              border: `1px solid ${overLimit ? "#f87171" : "#2d2d4e"}`,
              borderRadius: 8, color: "#f8f4e8", fontSize: 15, padding: "12px 14px",
              resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              lineHeight: 1.6
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={evaluate}
            disabled={loading || !translation.trim()}
            style={{
              flex: 1, minWidth: 160, background: loading ? "#2d2d4e" : "#4f46e5",
              color: "white", border: "none", padding: "12px 24px", borderRadius: 8,
              cursor: loading || !translation.trim() ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, transition: "background 0.2s",
              opacity: !translation.trim() ? 0.5 : 1
            }}
          >
            {loading ? "⏳ Evaluando..." : "✦ Evaluar traducción"}
          </button>

          <button onClick={prev} disabled={current === 0} style={{
            background: "transparent", color: current === 0 ? "#2d2d4e" : "#94a3b8",
            border: `1px solid ${current === 0 ? "#1e1e3a" : "#2d2d4e"}`,
            padding: "12px 20px", borderRadius: 8, cursor: current === 0 ? "not-allowed" : "pointer",
            fontSize: 14
          }}>← Anterior</button>

          <button onClick={next} style={{
            background: feedback ? "#0f2d1f" : "transparent",
            color: feedback ? "#4ade80" : "#94a3b8",
            border: `1px solid ${feedback ? "#4ade80" : "#2d2d4e"}`,
            padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14
          }}>
            {current === STRINGS.length - 1 ? "Ver resultados →" : "Siguiente →"}
          </button>
        </div>

        {/* Feedback panel */}
        {showPanel && feedback && !feedback.error && (
          <div style={{
            background: "#0d0d1a", border: "1px solid #2d2d4e",
            borderRadius: 12, padding: 20, animation: "fadeIn 0.3s ease"
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>PUNTUACIÓN TOTAL</div>
                <div style={{
                  fontSize: 42, fontWeight: 800,
                  color: feedback.total >= 80 ? "#4ade80" : feedback.total >= 60 ? "#facc15" : "#f87171"
                }}>
                  {feedback.total}<span style={{ fontSize: 18, color: "#64748b" }}>/100</span>
                </div>
              </div>
              <div style={{
                background: "#12121f", borderRadius: 8, padding: "12px 16px",
                maxWidth: 400, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6
              }}>
                {feedback.summary}
              </div>
            </div>

            {/* Rubric */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, letterSpacing: 1 }}>RÚBRICA DE EVALUACIÓN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {RUBRIC_CRITERIA.map(c => (
                  <div key={c.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{c.label}</span>
                    </div>
                    <ScoreBar score={feedback.scores?.[c.key] || 0} max={c.max} />
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & issues */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {feedback.strengths?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 8, letterSpacing: 1 }}>✓ FORTALEZAS</div>
                  {feedback.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #4ade8040" }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
              {feedback.issues?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#f87171", marginBottom: 8, letterSpacing: 1 }}>✗ ÁREAS DE MEJORA</div>
                  {feedback.issues.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #f8717140" }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested translation */}
            {feedback.suggestedTranslation && (
              <div style={{ background: "#12121f", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid #818cf8" }}>
                <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 6, letterSpacing: 1 }}>TRADUCCIÓN DE REFERENCIA</div>
                <div style={{ fontSize: 14, color: "#e2e8f0", fontFamily: "Georgia, serif" }}>
                  {feedback.suggestedTranslation}
                </div>
              </div>
            )}
          </div>
        )}

        {showPanel && feedback?.error && (
          <div style={{ background: "#2a1a1a", border: "1px solid #f87171", borderRadius: 8, padding: 16, color: "#f87171", fontSize: 14 }}>
            Error al conectar con la IA. Verifica tu conexión e intenta de nuevo.
          </div>
        )}
      </div>
    </div>
  );
}
