export default async function handler(req, res) {
  // 1. Handle CORS Preflight Request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Ambil parameter 'message' dari Query URL (GET) atau JSON Body (POST)
  const message = req.query.message || (req.body && req.body.message);

  if (!message) {
    return res.status(400).json({
      error: 'Parameter "message" wajib diisi. Contoh: /api/chat?message=halo'
    });
  }

  try {
    const baseUrl = process.env.CUSTOM_ENDPOINT || 'https://xyloapi.qzz.io/api/ai-chat/deepseek-r1';

    // 3. Sisipkan System Prompt Paksa Bahasa Indonesia
    const fullPrompt = `System instructions: Kamu adalah AI asisten yang cerdas. Kamu WAJIB berpikir (reasoning) dan memberikan jawaban akhir SELALU dalam Bahasa Indonesia.\n\nUser request: ${message}`;

    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('prompt', fullPrompt);

    // 4. Tembak ke XyloAPI via HTTP GET
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // 5. Ekstrak jawaban teks bersih dari objek XyloAPI
    // Mengantisipasi berbagai kemungkinan struktur properti dari provider (result, message, output, response, dll)
    const replyText = 
      (typeof data === 'string' ? data : null) ||
      data.result || 
      data.response || 
      data.message || 
      data.data || 
      data.output ||
      JSON.stringify(data);

    // 6. Kembalikan balasan berupa teks bersih
    return res.status(200).json({
      success: true,
      result: replyText
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal terhubung ke XyloAPI.'
    });
  }
}
