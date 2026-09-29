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
    
    // System prompt ketat agar reasoning juga diarahkan ke Bahasa Indonesia
    const fullPrompt = `System instructions: Kamu adalah AI asisten yang cerdas. Kamu WAJIB berpikir (reasoning) dan memberikan jawaban akhir SELALU dalam Bahasa Indonesia.\n\nUser request: ${message}`;

    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('prompt', fullPrompt);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();

    // 1. Ambil teks murni dari properti JSON XyloAPI
    let rawText = '';
    if (typeof data === 'string') {
      rawText = data;
    } else if (data && typeof data === 'object') {
      rawText = data.response || data.result || data.message || data.data || data.output || JSON.stringify(data);
    }

    // Jika rawText masih berformat JSON string, parsing sekali lagi
    if (typeof rawText === 'string' && rawText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawText);
        rawText = parsed.response || parsed.result || parsed.message || rawText;
      } catch (e) {
        // Biarkan jika gagal parse
      }
    }

    // 2. Bersihkan tag <think>...</think> milik DeepSeek R1 secara otomatis
    let cleanText = String(rawText)
      .replace(/<think>[\s\S]*?<\/think>/gi, '') // Hapus blok reasoning <think>
      .trim();

    // Fallback jika setelah di-strip teks jadi kosong
    if (!cleanText) {
      cleanText = String(rawText);
    }

    // 3. Kirim sebagai Plain Text bersih ke frontend
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(cleanText);

  } catch (error) {
    return res.status(500).send(error.message || 'Gagal terhubung ke endpoint.');
  }
}
