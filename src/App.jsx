import { useState, useRef } from "react";

// ─── STRINGS ──────────────────────────────────────────────────────────────────
const STRINGS = [
  {
    id: "UI_001", category: "HUD",
    source: "Health: {0} / {1}", maxChars: 20,
    context: "Indicador de vida en combate. Aparece en la esquina superior izquierda durante batallas.",
    characterName: null,
    note: "Conserva las variables {0} y {1} exactamente como aparecen. Espacio muy limitado.",
    image: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&q=80",
    imageCaption: "Pantalla de combate — HUD activo",
  },
  {
    id: "DLG_002", category: "DIÁLOGO",
    source: "The cursed blade has awakened. You must not wield it, traveler — not until the prophecy is fulfilled.",
    maxChars: 120,
    context: "Un archimago anciano advierte al jugador sobre una espada legendaria. Registro formal y arcaico.",
    characterName: "Archimago Valdren",
    note: "Registro elevado y formal. El personaje habla como en textos medievales. Evita contracciones.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    imageCaption: "Torre del Archimago — escena de advertencia",
  },
  {
    id: "MNU_003", category: "MENÚ",
    source: "New Game", maxChars: 12,
    context: "Botón del menú principal para iniciar una nueva partida.",
    characterName: null,
    note: "Debe ser una frase nominal, no verbal. Muy corto.",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    imageCaption: "Menú principal del juego",
  },
  {
    id: "DLG_004", category: "DIÁLOGO",
    source: "I've been waiting for you, %s. The kingdom of Arathos needs its champion.",
    maxChars: 100,
    context: "Una NPC saluda al jugador usando su nombre elegido. Tono dramático y cinematográfico.",
    characterName: "Reina Seraphine",
    note: "La variable %s representa el nombre del jugador. No la traduzcas ni la muevas de lugar.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    imageCaption: "Sala del trono — primera audiencia con la Reina",
  },
  {
    id: "SYS_005", category: "SISTEMA",
    source: "Your companion has fallen. Return to a safe zone to revive them.",
    maxChars: 80,
    context: "Alerta en pantalla cuando un miembro del grupo cae derrotado en combate.",
    characterName: null,
    note: "Tono urgente pero informativo, no agresivo. Debe motivar acción.",
    image: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&q=80",
    imageCaption: "Combate — compañero derrotado",
  },
  {
    id: "ITM_006", category: "ÍTEM",
    source: "Elixir of Forgotten Shadows — Restores %d MP and grants invisibility for 30 seconds.",
    maxChars: 90,
    context: "Descripción de objeto en el inventario. Nombre poético seguido de efecto concreto.",
    characterName: null,
    note: "Traduce el nombre del ítem con estilo poético. Conserva %d para el valor de maná.",
    image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?w=800&q=80",
    imageCaption: "Inventario — ítems mágicos",
  },
  {
    id: "DLG_007", category: "DIÁLOGO",
    source: "Run! The dark fortress is collapsing — we have less than two minutes!",
    maxChars: 80,
    context: "Diálogo urgente durante una secuencia de escape con cuenta regresiva.",
    characterName: "Lyra (compañera)",
    note: "Transmite urgencia máxima. Corto y directo. El signo de exclamación es obligatorio.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    imageCaption: "Fortaleza oscura — secuencia de escape",
  },
  {
    id: "TUT_008", category: "TUTORIAL",
    source: "Press [JUMP] to leap over obstacles. Hold [JUMP] to glide.",
    maxChars: 60,
    context: "Indicación de tutorial en pantalla durante el primer nivel del juego.",
    characterName: null,
    note: "Conserva [JUMP] entre corchetes exactamente. No traduzcas los nombres de botones.",
    image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
    imageCaption: "Primer nivel — zona de tutorial",
  },
];

const CAT = {
  HUD:      { bg: "#0f2318", border: "#4ade80", text: "#4ade80" },
  DIÁLOGO:  { bg: "#12102b", border: "#818cf8", text: "#818cf8" },
  MENÚ:     { bg: "#1f0f0f", border: "#f87171", text: "#f87171" },
  SISTEMA:  { bg: "#0f1520", border: "#60a5fa", text: "#60a5fa" },
  ÍTEM:     { bg: "#1a0f25", border: "#c084fc", text: "#c084fc" },
  TUTORIAL: { bg: "#0f1e1e", border: "#34d399", text: "#34d399" },
};

function Badge({ cat }) {
  const s = CAT[cat] || CAT["SISTEMA"];
  return (
    <span style={{ background: s.border, color: "#080810", fontSize: 10, fontWeight: 800,
      padding: "3px 9px", borderRadius: 3, letterSpacing: 1.5 }}>{cat}</span>
  );
}

export default function App() {
  const [step, setStep] = useState("register");
  const [student, setStudent] = useState({ name: "", email: "" });
  const [current, setCurrent] = useState(0);
  const [translations, setTranslations] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  const str = STRINGS[current];
  const cat = CAT[str?.category] || CAT["SISTEMA"];
  const allDone = STRINGS.every(s => (translations[s.id] || "").trim().length > 0);
  const doneCount = Object.keys(translations).filter(k => translations[k].trim()).length;

  const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxgcEcYwq81sNDOXLFSc9pjZnqMVo7Pq6bT4yEWjzQeHO7cESMynEdP7zPsQZlo_aro/exec";

  async function handleSubmit() {
    setLoading(true);
    let evals = [];
    try {
      const prompt = `Eres un revisor técnico de localización de videojuegos. Revisa ÚNICAMENTE aspectos técnicos y formales — NO evalúes decisiones de traducción, adaptaciones culturales ni estilo creativo.

Revisa solo estos criterios:
1. Ortografía y acentuación en español latino
2. Ortotipografía y puntuación (¿¡, comillas, puntos, comas)
3. Variables técnicas: {0}, {1}, %s, %d, [JUMP] deben aparecer exactamente igual que en el original
4. Consistencia interna de términos

NO comentes sobre: fidelidad al original, registro, tono, creatividad ni adaptación cultural.
Habla directamente al estudiante en segunda persona (tú), en español, de forma breve y constructiva.

${STRINGS.map((s, i) => "STRING " + (i+1) + ": " + s.id + " [" + s.category + "]\nOriginal: " + s.source + "\nTraducción: " + (translations[s.id] || "(vacío)")).join("\n\n")}

Responde ÚNICAMENTE con un array JSON sin markdown:
[{"issues":["problema técnico en segunda persona, si existe"], "ok": true}]
Si no hay problemas, devuelve "issues":[] y "ok":true.`;

      const res = await fetch("/api/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000,
          messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "[]";
      evals = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      evals = STRINGS.map(() => ({ ok: true, issues: [] }));
    }
    // Send to Google Sheets
    try {
      const rows = STRINGS.map((s, i) => ({
        timestamp: new Date().toISOString(),
        student: student.name,
        email: student.email,
        stringId: s.id,
        category: s.category,
        source: s.source,
        translation: translations[s.id] || "",
        aiScore: evals[i]?.ok ? "OK" : "Con observaciones",
        aiSummary: (evals[i]?.issues || []).join(" | "),
      }));
      await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
    } catch { /* sheets optional */ }

    setEvaluation(evals);
    setLoading(false);
    setStep("done");
  }

  // ── REGISTER ──
  if (step === "register") return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚔️</div>
          <h1 style={S.title}>Laboratorio de Localización</h1>
          <p style={{ color: "#818cf8", fontSize: 13, margin: "4px 0 0" }}>Fantasy RPG · Inglés → Español Latino</p>
          <p style={{ color: "#4b5563", fontSize: 13, marginTop: 12, lineHeight: 1.7 }}>
            Localizarás 8 strings de un videojuego de rol. Recibirás una evaluación preliminar automática y retroalimentación personalizada de tu instructora.
          </p>
        </div>
        <label style={S.label}>Nombre completo</label>
        <input style={S.input} placeholder="Tu nombre" value={student.name}
          onChange={e => setStudent(p => ({ ...p, name: e.target.value }))} />
        <label style={{ ...S.label, marginTop: 14 }}>Correo electrónico</label>
        <input style={S.input} type="email" placeholder="tu@correo.com" value={student.email}
          onChange={e => setStudent(p => ({ ...p, email: e.target.value }))} />
        <button style={{ ...S.btnPrimary, marginTop: 20, opacity: (!student.name || !student.email) ? 0.4 : 1 }}
          disabled={!student.name || !student.email}
          onClick={() => setStep("translate")}>Comenzar ejercicio →</button>
        <div style={{ ...S.notice, marginTop: 16 }}>
          ℹ️ Tus traducciones serán enviadas a tu instructora para revisión humana.
        </div>
      </div>
    </div>
  );

  // ── DONE ──
  if (step === "done") return (
    <div style={S.page}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px" }}>

        {/* Confirmation header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28,
          background: "#0d1f14", border: "1px solid #4ade8040", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>✓</div>
          <div>
            <h1 style={{ ...S.title, color: "#4ade80", fontSize: 18, margin: 0 }}>¡Ejercicio entregado!</h1>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
              Tus traducciones han sido registradas, <strong style={{ color: "#e2e8f0" }}>{student.name}</strong>.
              Tu instructora revisará tu trabajo y te enviará retroalimentación personalizada.
            </p>
          </div>
        </div>

        {/* AI notice */}
        <div style={{ ...S.notice, marginBottom: 20 }}>
          🤖 La revisión técnica de abajo es <strong>preliminar y automática</strong>. Solo cubre ortografía, puntuación y variables. No es la calificación final — tu instructora revisará tu trabajo completo.
        </div>

        {/* Per-string technical feedback */}
        {evaluation && STRINGS.map((s, i) => {
          const ev = evaluation[i] || {};
          const hasIssues = ev.issues && ev.issues.length > 0;
          return (
            <div key={s.id} style={{ ...S.evalCard, borderColor: hasIssues ? "#f8717140" : "#4ade8030" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge cat={s.category} />
                  <span style={{ color: "#4b5563", fontSize: 12 }}>{s.id}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700,
                  color: hasIssues ? "#f87171" : "#4ade80" }}>
                  {hasIssues ? "⚠ Revisar" : "✓ Sin observaciones técnicas"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: hasIssues ? 8 : 0 }}>
                {translations[s.id]}
              </div>
              {hasIssues && ev.issues.map((iss, j) => (
                <div key={j} style={{ fontSize: 12, color: "#fca5a5", borderLeft: "2px solid #f8717150",
                  paddingLeft: 10, marginTop: 6, lineHeight: 1.5 }}>⚠ {iss}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── REVIEW ──
  if (step === "review") return (
    <div style={S.page}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        <button onClick={() => setStep("translate")} style={{ background: "none", border: "none",
          color: "#64748b", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Seguir editando</button>
        <h2 style={{ ...S.title, marginBottom: 8 }}>Revisa tus traducciones</h2>
        <p style={{ color: "#4b5563", fontSize: 13, marginBottom: 24 }}>Verifica todo antes de enviar.</p>
        {STRINGS.map((s, i) => {
          const t = translations[s.id] || "";
          return (
            <div key={s.id} style={{ ...S.evalCard, borderColor: !t.trim() ? "#f87171" : "#1e2535" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8 }}><Badge cat={s.category} /><span style={{ color: "#4b5563", fontSize: 12 }}>{s.id}</span></div>
                <button onClick={() => { setCurrent(i); setStep("translate"); }}
                  style={{ background: "none", border: "1px solid #818cf830", color: "#818cf8",
                    padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Editar</button>
              </div>
              <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{s.source}</div>
              <div style={{ fontSize: 14, color: !t.trim() ? "#f87171" : "#e2e8f0" }}>
                {!t.trim() ? "⚠ Sin traducción" : t}
              </div>
            </div>
          );
        })}
        <div style={{ ...S.notice, margin: "20px 0" }}>
          🤖 Al enviar, la IA generará una evaluación preliminar. Tu instructora revisará tu trabajo y te enviará retroalimentación personalizada.
        </div>
        <button style={{ ...S.btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}
          disabled={loading || !allDone} onClick={handleSubmit}>
          {loading ? "⏳ Evaluando y enviando..." : "✦ Enviar ejercicio"}
        </button>
      </div>
    </div>
  );

  // ── TRANSLATE ──
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, letterSpacing: 1 }}>LABORATORIO DE LOCALIZACIÓN</div>
            <div style={{ fontSize: 11, color: "#374151" }}>Fantasy RPG · EN → ES Latino</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "#4b5563" }}>{doneCount} / {STRINGS.length} traducidos</span>
          <div style={{ display: "flex", gap: 4 }}>
            {STRINGS.map((s, i) => (
              <div key={i} onClick={() => setCurrent(i)} title={s.id} style={{
                width: 9, height: 9, borderRadius: "50%", cursor: "pointer",
                background: (translations[s.id]||"").trim() ? "#4ade80" : i === current ? "#818cf8" : "#1e2535",
                border: i === current ? "1px solid #c4b5fd" : "none",
              }} />
            ))}
          </div>
          {allDone && (
            <button onClick={() => setStep("review")} style={{ background: "#14532d", color: "#4ade80",
              border: "1px solid #4ade8040", padding: "7px 14px", borderRadius: 6,
              cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Revisar y enviar →</button>
          )}
        </div>
      </header>

      <div style={S.main}>
        {/* LEFT */}
        <div style={S.left}>
          <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
            <img src={str.image} alt={str.imageCaption} style={{ width: "100%", height: "100%",
              objectFit: "cover", filter: "brightness(0.65) saturate(0.8)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px",
              background: "linear-gradient(transparent, #080810bb)", display: "flex", alignItems: "center", gap: 8 }}>
              <Badge cat={str.category} />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{str.imageCaption}</span>
            </div>
            {str.characterName && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "#0a0a16aa",
                backdropFilter: "blur(4px)", border: "1px solid #818cf830", borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ fontSize: 10, color: "#818cf8" }}>PERSONAJE </span>
                <span style={{ fontSize: 13, color: "#e2e8f0", fontStyle: "italic" }}>{str.characterName}</span>
              </div>
            )}
          </div>

          <div style={{ padding: "18px 20px", borderTop: `2px solid ${cat.border}40`,
            background: cat.bg, borderBottom: "1px solid #12122a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#4b5563", letterSpacing: 1 }}>{str.id} · TEXTO ORIGINAL</span>
              <span style={{ fontSize: 11, color: "#4b5563" }}>Límite: {str.maxChars} car.</span>
            </div>
            <p style={{ fontSize: 17, color: "#f1f5f9", fontFamily: "Georgia, serif", lineHeight: 1.6, margin: 0 }}>
              {str.source}
            </p>
          </div>

          <div style={{ padding: "16px 20px", flex: 1, background: "#0a0a14" }}>
            <div style={{ fontSize: 11, color: "#4b5563", letterSpacing: 1, marginBottom: 6 }}>CONTEXTO</div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{str.context}</p>
            {str.note && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#1a1200",
                border: "1px solid #92400e40", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
                <span style={{ color: "#facc15" }}>⚠</span>{" "}
                <strong style={{ color: "#fbbf24" }}>Nota:</strong>{" "}
                <span style={{ color: "#d1a84b" }}>{str.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={S.right}>
          <div style={{ fontSize: 11, color: "#4b5563", letterSpacing: 1, marginBottom: 8 }}>
            STRING {current + 1} DE {STRINGS.length}
          </div>
          <h2 style={{ fontSize: 15, color: "#c4b5fd", fontWeight: 600, margin: "0 0 20px" }}>
            Tu traducción al español latino
          </h2>
          <textarea
            value={translations[str.id] || ""}
            onChange={e => setTranslations(p => ({ ...p, [str.id]: e.target.value }))}
            placeholder="Escribe aquí tu traducción..."
            style={S.textarea}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 28 }}>
            <span style={{ fontSize: 12, color: (translations[str.id]||"").length > str.maxChars ? "#f87171" :
              (translations[str.id]||"").length > str.maxChars * 0.85 ? "#facc15" : "#4b5563" }}>
              {(translations[str.id]||"").length} / {str.maxChars} caracteres
            </span>
            {(translations[str.id]||"").length > str.maxChars && (
              <span style={{ fontSize: 11, color: "#f87171" }}>⚠ Excede el límite</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
              style={{ background: "transparent", color: "#64748b", border: "1px solid #1e2535",
                padding: "12px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14,
                opacity: current === 0 ? 0.3 : 1 }}>← Anterior</button>
            <button onClick={() => current < STRINGS.length - 1 ? setCurrent(c => c + 1) : setStep("review")}
              style={S.btnPrimary}>
              {current === STRINGS.length - 1 ? "Revisar todo →" : "Siguiente →"}
            </button>
          </div>
          <div style={{ ...S.notice, marginTop: 28 }}>
            🤖 Al enviar, recibirás una evaluación preliminar automática. Tu instructora revisará cada traducción y te enviará retroalimentación personalizada.
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#080810", color: "#f1f5f9",
    fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { background: "#0a0a16", borderBottom: "1px solid #12122a", padding: "12px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap", gap: 12, position: "sticky", top: 0, zIndex: 10 },
  main: { display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 57px)" },
  left: { borderRight: "1px solid #12122a", display: "flex", flexDirection: "column" },
  right: { padding: "32px 28px", display: "flex", flexDirection: "column" },
  card: { maxWidth: 440, margin: "60px auto", padding: "40px 36px", background: "#0d0d1e",
    border: "1px solid #12122a", borderRadius: 16 },
  title: { fontFamily: "Georgia, serif", fontSize: 22, color: "#f1f5f9", margin: 0 },
  label: { display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, letterSpacing: 0.5 },
  input: { width: "100%", background: "#080810", border: "1px solid #1e2535", borderRadius: 8,
    color: "#f1f5f9", fontSize: 14, padding: "11px 14px", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", minHeight: 130, background: "#0d0d1e", border: "1px solid #1e2535",
    borderRadius: 8, color: "#f1f5f9", fontSize: 15, padding: "14px", resize: "vertical",
    outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" },
  btnPrimary: { flex: 1, background: "#4f46e5", color: "white", border: "none",
    padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  notice: { background: "#0d1117", border: "1px solid #1e2535", borderRadius: 8,
    padding: "12px 14px", fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  evalCard: { background: "#0d0d1e", border: "1px solid #1e2535", borderRadius: 10,
    padding: "16px 18px", marginBottom: 12 },
};
