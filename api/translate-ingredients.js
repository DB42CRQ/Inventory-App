export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ingredients } = req.body
  if (!ingredients?.length) return res.status(400).json({ error: 'Missing ingredients' })

  try {
    const list = ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Translate these ingredient names to German and Spanish. Return ONLY a JSON array with objects like {"de": "...", "es": "..."}. One object per ingredient, in the same order. No markdown, no extra text.\n\nIngredients:\n${list}`
        }]
      })
    })

    const data = await response.json()
    const rawText = data.content?.find(c => c.type === 'text')?.text?.trim()
    const start = rawText?.indexOf('[')
    const end = rawText?.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON array found')
    const parsed = JSON.parse(rawText.slice(start, end + 1))
    return res.status(200).json({ translations: parsed })
  } catch (err) {
    console.error('[translate-ingredients] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
