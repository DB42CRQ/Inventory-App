export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image } = req.body
  if (!image) return res.status(400).json({ error: 'Missing image' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'What is the barcode number in this image? Reply with ONLY the number, nothing else. If there is no barcode, reply with "none".' }
          ]
        }]
      })
    })
    const data = await response.json()
    const barcode = data.content?.[0]?.text?.trim()
    console.log('[scan-barcode] result:', barcode)
    return res.status(200).json({ barcode })
  } catch (err) {
    console.error('[scan-barcode] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
