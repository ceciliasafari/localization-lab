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

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  const rubricLines = CRITERIA.map(c =>
    `${c.label}: ${scores[c.key] || "—"}/5 (${SCORE_LABELS[scores[c.key]] || "—"})`
  ).join("\n");

  const translationLines = (translations || []).map(t =>
    `[${t.id}] ${t.category}\nOriginal: ${t.source}\nTu traducción: ${t.translation}`
  ).join("\n\n");

  const emailBody = `Hola ${studentName},

Tu instructora ha revisado tu ejercicio de localización y te envía la siguiente retroalimentación.

━━━━━━━━━━━━━━━━━━━━━━━━━━
PUNTUACIÓN INDIVIDUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━
${rubricLines}

Promedio: ${avg.toFixed(1)} / 5

━━━━━━━━━━━━━━━━━━━━━━━━━━
RETROALIMENTACIÓN GRUPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━
${groupFeedback}
${note ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nNOTA PERSONAL\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n${note}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━
TUS TRADUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━
${translationLines}

Saludos,
Tu instructora`;

  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId) {
      console.log("EmailJS not configured. Would send to:", studentEmail);
      console.log(emailBody);
      return res.status(200).json({ ok: true, note: "Email logged (EmailJS not configured)" });
    }

    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_name: studentName,
          to_email: studentEmail,
          rubric: rubricLines,
          average: avg.toFixed(1),
          group_feedback: groupFeedback,
          personal_note: note || "",
          translations: translationLines,
        },
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send email" });
  }
}
