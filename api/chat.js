export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const message = req.query.message || (req.body && req.body.message);

  if (!message) {
    return res.status(400).json({
      error: 'Parameter "message" wajib diisi.'
    });
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

    const data = await response.json();

    // Saring sampai benar-benar dapat teks murni
    let textOutput = '';

    if (typeof data === 'string') {
      textOutput = data;
    } else if (data && typeof data === 'object') {
      // Jika data.result bentuknya objek lagi (seperti { result: "jawaban" })
      if (data.result && typeof data.result === 'object') {
        textOutput = data.result.result || data.result.response || data.result.message || JSON.stringify(data.result);
      } else {
        textOutput = data.result || data.response || data.message || data.data || data.output;
      }
    }

    if (!textOutput) {
      textOutput = typeof data === 'object' ? JSON.stringify(data) : String(data);
    }

    // Kembalikan langsung sebagai teks/string mentah agar UI chatbot tidak bingung
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(textOutput);

  } catch (error) {
    return res.status(500).send(error.message || 'Gagal terhubung ke endpoint.');
  }
}
