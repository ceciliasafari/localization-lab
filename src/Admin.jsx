import { useState, useEffect } from "react";

const CRITERIA = [
  { key: "registro", label: "Registro, tono y vocabulario" },
  { key: "variables", label: "Variables y restricciones técnicas" },
  { key: "ortografia", label: "Ortografía y puntuación" },
  { key: "creatividad", label: "Creatividad y solución de problemas" },
];

const SCORE_LABELS = { 1: "Insuficiente", 2: "Regular", 3: "Aceptable", 4: "Bueno", 5: "Excelente" };
const SCORE_COLORS = { 1: "#f87171", 2: "#fb923c", 3: "#facc15", 4: "#60a5fa", 5: "#4ade80" };

const ADMIN_PASSWORD = "loclab2025";
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxgcEcYwq81sNDOXLFSc9pjZnqMVo7Pq6bT4yEWjzQeHO7cESMynEdP7zPsQZlo_aro/exec";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupFeedback, setGroupFeedback] = useState("");
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState({});
  const [groupSaved, setGroupSaved] = useState(false);
  const [expanded, setExpanded] = useState(null);

  function login() {
    if (pwd === ADMIN_PASSWORD) { setAuth(true); loadSubmissions(); }
    else { setPwdError(true); setTimeout(() => setPwdError(false), 2000); }
  }

  async function loadSubmissions() {
    setLoading(true);
    try {
      if (SHEETS_URL !== "YOUR_GOOGLE_SHEETS_WEBAPP_URL") {
        const res = await fetch("/api/sheets");
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        // Demo data
        setSubmissions([
          {
            id: "demo-1",
            student: "Estudiante Demo",
            email: "demo@example.com",
            timestamp: new Date().toISOString(),
            translations: [
              { id: "UI_001", category: "HUD", source: "Health: {0} / {1}", translation: "Salud: {0} / {1}", aiScore: 95 },
              { id: "DLG_002", category: "DIÁLOGO", source: "The cursed blade has awakened...", translation: "La espada maldita ha despertado...", aiScore: 82 },
            ]
          }
        ]);
      }
    } catch { setSubmissions([]); }
    setLoading(false);
  }

  async function sendFeedback(sub) {
    setSending(p => ({ ...p, [sub.id]: true }));
    const studentScores = scores[sub.id] || {};
    const studentNote = notes[sub.id] || "";

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: sub.student,
          studentEmail: sub.email,
          scores: studentScores,
          note: studentNote,
          groupFeedback,
          translations: sub.translations,
        }),
      });
      setSent(p => ({ ...p, [sub.id]: true }));
    } catch {
      alert("Error al enviar. Intenta de nuevo.");
    }
    setSending(p => ({ ...p, [sub.id]: false }));
  }

  function setScore(subId, key, val) {
    setScores(p => ({ ...p, [subId]: { ...(p[subId] || {}), [key]: val } }));
  }

  function avgScore(subId) {
    const s = scores[subId] || {};
    const vals = Object.values(s);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }

  // ── LOGIN ──
  if (!auth) return (
    <div style={S.page}>
      <div style={S.loginCard}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h1 style={S.title}>Panel de revisión</h1>
          <p style={{ color: "#4b5563", fontSize: 13, marginTop: 6 }}>Laboratorio de Localización · Acceso instructor</p>
        </div>
        <input
          type="password"
          placeholder="Contraseña"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ ...S.input, borderColor: pwdError ? "#f87171" : "#1e2535" }}
        />
        {pwdError && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>Contraseña incorrecta</p>}
        <button style={{ ...S.btnPrimary, marginTop: 14, width: "100%" }} onClick={login}>
          Entrar
        </button>
      </div>
    </div>
  );

  // ── PANEL ──
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, letterSpacing: 1 }}>PANEL DE REVISIÓN</div>
            <div style={{ fontSize: 11, color: "#374151" }}>Laboratorio de Localización · Vista instructor</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#4b5563" }}>{submissions.length} entregas</span>
          <button onClick={loadSubmissions} style={S.btnSecondary}>↺ Actualizar</button>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px" }}>

        {/* Group feedback */}
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h2 style={S.sectionTitle}>Retroalimentación grupal</h2>
              <p style={{ color: "#4b5563", fontSize: 12, margin: 0 }}>
                Se enviará a todos los estudiantes junto con su puntuación individual.
              </p>
            </div>
            {groupSaved && <span style={{ fontSize: 12, color: "#4ade80" }}>✓ Guardado</span>}
          </div>
          <textarea
            value={groupFeedback}
            onChange={e => setGroupFeedback(e.target.value)}
            placeholder="Escribe aquí los puntos generales que quieres comunicar al grupo: errores comunes, aciertos, aspectos a reforzar..."
            style={{ ...S.textarea, minHeight: 120 }}
          />
          <button style={{ ...S.btnSecondary, marginTop: 10 }}
            onClick={() => { setGroupSaved(true); setTimeout(() => setGroupSaved(false), 3000); }}>
            Guardar borrador
          </button>
        </div>

        {/* Submissions */}
        <h2 style={{ ...S.sectionTitle, marginBottom: 16 }}>Entregas individuales</h2>

        {loading && <p style={{ color: "#4b5563", fontSize: 13 }}>Cargando entregas...</p>}

        {!loading && submissions.length === 0 && (
          <div style={{ ...S.section, textAlign: "center", color: "#4b5563", fontSize: 13 }}>
            No hay entregas todavía.
          </div>
        )}

        {submissions.map(sub => {
          const avg = avgScore(sub.id);
          const isExpanded = expanded === sub.id;
          const isSent = sent[sub.id];
          const isSending = sending[sub.id];
          const studentScores = scores[sub.id] || {};
          const allScored = CRITERIA.every(c => studentScores[c.key]);

          return (
            <div key={sub.id} style={{ ...S.section, marginBottom: 14 }}>
              {/* Student header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{sub.student}</div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>{sub.email} · {new Date(sub.timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {avg && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: avg >= 4 ? "#4ade80" : avg >= 3 ? "#facc15" : "#f87171" }}>{avg}</div>
                      <div style={{ fontSize: 10, color: "#4b5563" }}>promedio</div>
                    </div>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : sub.id)} style={S.btnSecondary}>
                    {isExpanded ? "Cerrar ▲" : "Revisar ▼"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 20 }}>
                  {/* Translations preview */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={S.sectionLabel}>TRADUCCIONES</div>
                    {(sub.translations || []).map(t => (
                      <div key={t.id} style={{ borderLeft: "2px solid #1e2535", paddingLeft: 12, marginBottom: 12 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#4b5563", background: "#12122a", padding: "2px 6px", borderRadius: 3 }}>{t.id}</span>
                          <span style={{ fontSize: 10, color: "#4b5563" }}>{t.category}</span>
                          {t.aiScore && <span style={{ fontSize: 10, color: "#818cf8", marginLeft: "auto" }}>IA: {t.aiScore}/100</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>{t.source}</div>
                        <div style={{ fontSize: 13, color: "#e2e8f0" }}>{t.translation}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rubric */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={S.sectionLabel}>RÚBRICA</div>
                    {CRITERIA.map(c => (
                      <div key={c.key} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{c.label}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[1, 2, 3, 4, 5].map(n => {
                            const selected = studentScores[c.key] === n;
                            return (
                              <button key={n} onClick={() => setScore(sub.id, c.key, n)} style={{
                                width: 44, height: 44, borderRadius: 8, border: "none",
                                background: selected ? SCORE_COLORS[n] : "#12122a",
                                color: selected ? "#080810" : "#4b5563",
                                fontWeight: selected ? 800 : 400,
                                cursor: "pointer", fontSize: 15,
                                outline: selected ? `2px solid ${SCORE_COLORS[n]}` : "none",
                                transition: "all 0.15s",
                              }} title={SCORE_LABELS[n]}>{n}</button>
                            );
                          })}
                          {studentScores[c.key] && (
                            <span style={{ fontSize: 12, color: SCORE_COLORS[studentScores[c.key]], alignSelf: "center", marginLeft: 4 }}>
                              {SCORE_LABELS[studentScores[c.key]]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Personal note */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={S.sectionLabel}>NOTA PERSONAL (opcional)</div>
                    <textarea
                      value={notes[sub.id] || ""}
                      onChange={e => setNotes(p => ({ ...p, [sub.id]: e.target.value }))}
                      placeholder="Comentario adicional para este estudiante..."
                      style={{ ...S.textarea, minHeight: 80 }}
                    />
                  </div>

                  {/* Send button */}
                  {!isSent ? (
                    <button
                      style={{ ...S.btnPrimary, opacity: (!allScored || isSending) ? 0.5 : 1, width: "100%" }}
                      disabled={!allScored || isSending || !groupFeedback.trim()}
                      onClick={() => sendFeedback(sub)}
                    >
                      {isSending ? "⏳ Enviando..." : !groupFeedback.trim() ? "Escribe primero el feedback grupal" : !allScored ? "Completa la rúbrica para enviar" : `✦ Enviar retroalimentación a ${sub.student.split(" ")[0]}`}
                    </button>
                  ) : (
                    <div style={{ textAlign: "center", color: "#4ade80", fontSize: 14, padding: 12 }}>
                      ✓ Retroalimentación enviada
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#080810", color: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { background: "#0a0a16", borderBottom: "1px solid #12122a", padding: "12px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  loginCard: { maxWidth: 380, margin: "80px auto", padding: "40px 36px", background: "#0d0d1e",
    border: "1px solid #12122a", borderRadius: 16 },
  title: { fontFamily: "Georgia, serif", fontSize: 22, color: "#f1f5f9", margin: 0 },
  section: { background: "#0d0d1e", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 22px", marginBottom: 20 },
  sectionTitle: { fontSize: 15, color: "#e2e8f0", fontWeight: 600, margin: "0 0 4px" },
  sectionLabel: { fontSize: 10, color: "#4b5563", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" },
  input: { width: "100%", background: "#080810", border: "1px solid #1e2535", borderRadius: 8,
    color: "#f1f5f9", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", background: "#080810", border: "1px solid #1e2535", borderRadius: 8,
    color: "#f1f5f9", fontSize: 14, padding: "12px 14px", resize: "vertical", outline: "none",
    fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" },
  btnPrimary: { background: "#4f46e5", color: "white", border: "none", padding: "12px 20px",
    borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSecondary: { background: "transparent", color: "#64748b", border: "1px solid #1e2535",
    padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 },
};
