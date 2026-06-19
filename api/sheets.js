export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxgcEcYwq81sNDOXLFSc9pjZnqMVo7Pq6bT4yEWjzQeHO7cESMynEdP7zPsQZlo_aro/exec";

  try {
    if (req.method === 'POST') {
      const response = await fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'GET') {
      const response = await fetch(SHEETS_URL + '?action=get');
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}
