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
    // URL Base Endpoint XyloAPI (diambil dari Environment Variable Vercel atau fallback default)
    const baseUrl = process.env.CUSTOM_ENDPOINT || 'https://xyloapi.qzz.io/api/ai-chat/deepseek-r1';

    // 3. Sisipkan System Prompt Paksa Bahasa Indonesia ke dalam teks user
    const fullPrompt = `System instructions: Kamu adalah AI asisten yang cerdas. Kamu WAJIB berpikir (reasoning) dan memberikan jawaban akhir SELALU dalam Bahasa Indonesia, dan jago dalam death battle.\n\nUser request: ${message}`;

    // 4. Susun URL GET dengan parameter ?prompt=...
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('prompt', fullPrompt);

    // 5. Tembak ke XyloAPI via HTTP GET
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // 6. Kembalikan response hasil dari XyloAPI ke client
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal terhubung ke XyloAPI.'
    });
  }
}
