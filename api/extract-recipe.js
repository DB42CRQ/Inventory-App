const PROMPT = 'Extract the recipe. Return ONLY a JSON object with: {"name": "recipe name", "category": "category or null", "servings": number or null, "ingredients": [{"name": "ingredient", "quantity": number or null, "unit": "unit or null"}], "instructions": "step by step instructions as plain text, each step on a new line, or null if not available"}. No markdown, no extra text. If no recipe found, return {"error": "no recipe found"}.'

async function extractFromUrl(url) {
  // Try fetching with browser-like headers
  const fetchRes = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'de-DE,de;q=0.9',
    }
  })
  if (fetchRes.status === 403 || fetchRes.status === 401) {
    throw new Error(`Diese Website blockiert automatische Anfragen (${fetchRes.status}). Bitte kopiere das Rezept als Text oder mache ein Foto.`)
  }
  if (!fetchRes.ok) {
    throw new Error(`Seite konnte nicht geladen werden (${fetchRes.status}). Bitte versuche es mit einem Foto oder gib das Rezept manuell ein.`)
  }
  const html = await fetchRes.text()

  // Try JSON-LD structured data first (most recipe sites have this)
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim()
      const data = JSON.parse(jsonStr)
      const recipes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      const recipe = recipes.find(r => r['@type'] === 'Recipe' || (Array.isArray(r['@type']) && r['@type'].includes('Recipe')))
      if (recipe) {
        return {
          name: recipe.name || null,
          category: recipe.recipeCategory || null,
          servings: parseInt(recipe.recipeYield) || null,
          ingredients: (recipe.recipeIngredient || []).map(ing => {
            // Parse "200g Mehl" into quantity+unit+name
            const match = ing.match(/^([\d.,]+)\s*(g|kg|ml|l|EL|TL|Stück|Prise|Bund|Dose|Packung|Scheibe|Zehe|Becher|cup|tbsp|tsp|oz|lb|piece|clove|bunch|can|slice)?\s*(.+)$/i)
            if (match) return { name: match[3].trim(), quantity: parseFloat(match[1].replace(',', '.')), unit: match[2] || null }
            return { name: ing, quantity: null, unit: null }
          })
        }
      }
    } catch {}
  }

  // Fallback: send stripped HTML to Claude
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 6000)

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
      messages: [{ role: 'user', content: `URL: ${url}\n\nPage content:\n${stripped}\n\n${PROMPT}` }]
    })
  })
  const data = await response.json()
  const text = data.content?.find(c => c.type === 'text')?.text?.trim()
  const start = text?.indexOf('{')
  const end = text?.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No recipe found on page')
  return JSON.parse(text.slice(start, end + 1))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { image, url, text } = req.body
  if (!image && !url && !text) return res.status(400).json({ error: 'Missing input' })

  try {
    let result

    if (url) {
      result = await extractFromUrl(url)
    } else {
      let userContent
      if (image) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: PROMPT }
        ]
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
          messages: [{ role: 'user', content: userContent }]
        })
      })
      const data = await response.json()
      const rawText = data.content?.find(c => c.type === 'text')?.text?.trim()
      const start = rawText?.indexOf('{')
      const end = rawText?.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON found in response')
      result = JSON.parse(rawText.slice(start, end + 1))
    }

    if (result.error) return res.status(400).json({ error: result.error })
    return res.status(200).json(result)
  } catch (err) {
    console.error('[extract-recipe] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
