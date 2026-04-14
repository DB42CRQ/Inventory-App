export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image, url, text } = req.body
  if (!image && !url && !text) return res.status(400).json({ error: 'Missing input' })

  const PROMPT = 'Extract the recipe. Return ONLY a JSON object with: {"name": "recipe name", "category": "category or null", "servings": number or null, "ingredients": [{"name": "ingredient", "quantity": number or null, "unit": "unit or null"}]}. No markdown, no extra text. If no recipe found, return {"error": "no recipe found"}.'

  try {
    let userContent

    if (image) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: PROMPT }
      ]
    } else if (url) {
      // Fetch the URL content first
      const fetchRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
      })
      const html = await fetchRes.text()
      // Strip HTML tags roughly
      const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000)
      userContent = `URL: ${url}\n\nPage content:\n${stripped}\n\n${PROMPT}`
    } else {
      userContent = `Recipe text:\n${text}\n\n${PROMPT}`
    }

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
        messages: [{ role: 'user', content: userContent }],
      })
    })

    const data = await response.json()
    const rawText = data.content?.find(c => c.type === 'text')?.text?.trim()
    // Extract JSON - find first { to last }
    const start = rawText?.indexOf('{')
    const end = rawText?.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found in response')
    const clean = rawText.slice(start, end + 1)
    const parsed = JSON.parse(clean)
    if (parsed.error) return res.status(400).json({ error: parsed.error })
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[extract-recipe] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
