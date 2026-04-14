export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Missing query' })

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    )
    const data = await response.json()
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
