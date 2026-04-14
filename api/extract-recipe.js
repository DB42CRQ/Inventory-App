export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image, url, text } = req.body
  if (!image && !url && !text) return res.status(400).json({ error: 'Missing input' })

  try {
    let messages

    if (image) {
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: 'Extract the recipe from this image. Return ONLY a JSON object with: {"name": "recipe name", "category": "category or null", "servings": number, "ingredients": [{"name": "ingredient", "quantity": number or null, "unit": "unit or null"}]}. No markdown, no extra text.' }
        ]
      }]
    } else if (url) {
      messages = [{
        role: 'user',
        content: `Fetch and extract the recipe from this URL: ${url}\n\nReturn ONLY a JSON object with: {"name": "recipe name", "category": "category or null", "servings": number, "ingredients": [{"name": "ingredient", "quantity": number or null, "unit": "unit or null"}]}. No markdown, no extra text.`
      }]
    } else {
      messages = [{
        role: 'user',
        content: `Extract the recipe from this text:\n\n${text}\n\nReturn ONLY a JSON object with: {"name": "recipe name", "category": "category or null", "servings": number, "ingredients": [{"name": "ingredient", "quantity": number or null, "unit": "unit or null"}]}. No markdown, no extra text.`
      }]
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
        ...(url ? { tools: [{ type: 'web_search_20250305', name: 'web_search' }] } : {}),
        messages,
      })
    })

    const data = await response.json()
    const text_response = data.content?.find(c => c.type === 'text')?.text?.trim()
    const clean = text_response?.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[extract-recipe] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
