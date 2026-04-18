export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  try {
    async function translate(targetLang) {
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
            content: `Translate the following text to ${targetLang}. Return ONLY the translated text. No explanations, notes, parentheses, or comments. If input is one word, return one word.\n\n${text}`
          }]
        })
      })
      const data = await response.json()
      return data.content?.[0]?.text ?? text
    }

    const [de, en, es] = await Promise.all([
      translate('German'),
      translate('English'),
      translate('Spanish'),
    ])

    return res.status(200).json({ de, en, es })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
