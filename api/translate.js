export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  console.log(`[translate] text length: ${text.length} preview: ${text.slice(0, 80).replace(/\n/g, ' ')}`)
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Detect the language of the text below and translate it into German, English, and Spanish. Return ONLY a JSON object like {"de": "...", "en": "...", "es": "..."}. No markdown, no extra text.\n\nText:\n${text}`
        }]
      })
    })

    const data = await response.json()
    const rawText = data.content?.[0]?.text?.trim()
    console.log(`[translate] response length: ${rawText?.length ?? 0} stop_reason: ${data.stop_reason}`)
    if (!rawText) throw new Error('No response from Claude')
    const start = rawText.indexOf('{')
    const end = rawText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found in response')
    const parsed = JSON.parse(rawText.slice(start, end + 1))
    console.log(`[translate] de length: ${parsed.de?.length} en length: ${parsed.en?.length}`)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error(`[translate] error: ${err.message}`)
    return res.status(500).json({ error: err.message })
  }
}
