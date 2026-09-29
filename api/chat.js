export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const message = req.query.message || (req.body && req.body.message);

  if (!message) {
    return res.status(400).send('Parameter "message" wajib diisi.');
  }

  try {
    const baseUrl = process.env.CUSTOM_ENDPOINT || 'https://xyloapi.qzz.io/api/ai-chat/deepseek-r1';
    const fullPrompt = `System instructions: Kamu adalah AI asisten yang cerdas. Kamu WAJIB berpikir (reasoning) dan memberikan jawaban akhir SELALU dalam Bahasa Indonesia.\n\nUser request: ${message}`;

    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('prompt', fullPrompt);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    let data = await response.json();

    // Jika data berupa string JSON, parse sampai jadi Objek murni
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    // Rekursif / Cari properti teks di dalam Objek
    function findText(obj) {
      if (typeof obj === 'string') return obj;
      if (!obj || typeof obj !== 'object') return '';
      
      // Prioritas kunci yang sering dipakai API AI
      const priorityKeys = ['result', 'response', 'message', 'data', 'output', 'text', 'content'];
      for (const key of priorityKeys) {
        if (obj[key]) {
          const found = findText(obj[key]);
          if (found) return found;
        }
      }

      // Jika tidak ada di priority keys, ambil value pertama yang bertipe string
      for (const key in obj) {
        if (typeof obj[key] === 'string') return obj[key];
        if (typeof obj[key] === 'object') {
          const found = findText(obj[key]);
          if (found) return found;
        }
      }
      return '';
    }

    let rawText = findText(data) || JSON.stringify(data);

    // Hapus tag <think>...</think> jika ada
    let cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (!cleanText) cleanText = rawText;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(cleanText);

  } catch (error) {
    return res.status(500).send(error.message || 'Gagal terhubung ke endpoint.');
  }
}
