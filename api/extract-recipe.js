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
      // Use Claude with web_search to handle robots.txt blocked sites
      userContent = `Please search for and extract the recipe from this URL: ${url}\n\n${PROMPT}`
    } else {
      userContent = `Recipe text:\n${text}\n\n${PROMPT}`
    }

    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userContent }],
    }
    // Add web_search for URL extraction
    if (url) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    // Collect all text blocks (web_search returns multiple content blocks)
    const allText = data.content
      ?.filter(c => c.type === 'text')
      ?.map(c => c.text)
      ?.join('') ?? ''
    console.log('[extract-recipe] response text length:', allText.length)
    // Extract JSON - find first { to last }
    const start = allText.indexOf('{')
    const end = allText.lastIndexOf('}')
    if (start === -1 || end === -1) {
      console.error('[extract-recipe] no JSON in response:', allText.slice(0, 200))
      throw new Error('No JSON found in response')
    }
    const clean = allText.slice(start, end + 1)
    const parsed = JSON.parse(clean)
    if (parsed.error) return res.status(400).json({ error: parsed.error })
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[extract-recipe] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
