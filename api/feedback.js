export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { studentName, studentEmail, scores, note, groupFeedback, translations } = req.body;

  const SCORE_LABELS = { 1: "Insuficiente", 2: "Regular", 3: "Aceptable", 4: "Bueno", 5: "Excelente" };
  const CRITERIA = [
    { key: "registro", label: "Registro, tono y vocabulario" },
    { key: "variables", label: "Variables y restricciones técnicas" },
    { key: "ortografia", label: "Ortografía y puntuación" },
    { key: "creatividad", label: "Creatividad y solución de problemas" },
  ];

  const vals = Object.values(scores).filter(Boolean);
  const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";

  const rubric = CRITERIA.map(c =>
    `${c.label}: ${scores[c.key] || "—"}/5 (${SCORE_LABELS[scores[c.key]] || "—"})`
  ).join("\n");

  const translationLines = (translations || []).map(t =>
    `[${t.id}] ${t.category}\nOriginal: ${t.source}\nTu traducción: ${t.translation}`
  ).join("\n\n");

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_he3d758",
        template_id: "template_jie7jqr",
        user_id: "sP8EkbLzGvKFklM64",
        template_params: {
          to_name: studentName,
          to_email: studentEmail,
          rubric,
          average: avg,
          group_feedback: groupFeedback || "",
          personal_note: note ? `Nota de tu instructora:\n${note}` : "",
          translations: translationLines,
        },
      }),
    });

    if (response.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}
