export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Missing query' })

  try {
    // Translate query to German for better food photo results
    let searchQuery = query
    try {
      const translateRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          messages: [{ role: 'user', content: `Translate this recipe name to German for a photo search. Return ONLY the German translation, nothing else: "${query}"` }]
        })
      })
      const tData = await translateRes.json()
      const translated = tData.content?.[0]?.text?.trim()
      if (translated) searchQuery = translated
      console.log(`[recipe-image] original: "${query}" → translated: "${searchQuery}"`)
    } catch (e) {
      console.log(`[recipe-image] translation failed: ${e.message}, using original: "${query}"`)
    }

    console.log(`[recipe-image] searching Unsplash for: "${searchQuery}"`)
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=9&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    )
    const data = await response.json()
    console.log(`[recipe-image] found ${data.results?.length ?? 0} photos`)
    const photos = data.results?.map(p => ({
      url: p.urls.regular,
      thumb: p.urls.small,
      credit: p.user.name,
      credit_url: p.user.links.html,
    })) ?? []
    return res.status(200).json({ photos })
  } catch (err) {
    console.error('[recipe-image] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
