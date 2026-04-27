export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image } = req.body
  if (!image) return res.status(400).json({ error: 'Missing image' })

  console.log(`[scan-receipt] image size: ${image.length} chars base64`)

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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'This is a shopping receipt. Extract all purchased food/household items. Ignore prices, totals, store info, and non-product lines. Return ONLY a JSON array like [{"name": "item name", "quantity": number or null, "unit": "unit or null"}]. Keep item names in their original language. No markdown, no extra text.' }
          ]
        }]
      })
    })

    const data = await response.json()
    console.log(`[scan-receipt] status: ${response.status} stop_reason: ${data.stop_reason} error: ${data.error?.message}`)
    const rawText = data.content?.find(c => c.type === 'text')?.text?.trim()
    if (!rawText) throw new Error(`No response: ${data.error?.message || data.stop_reason}`)
    const start = rawText.indexOf('[')
    const end = rawText.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No items found on receipt')
    const items = JSON.parse(rawText.slice(start, end + 1))
    console.log(`[scan-receipt] found ${items.length} items`)
    return res.status(200).json({ items })
  } catch (err) {
    console.error(`[scan-receipt] error: ${err.message}`)
    return res.status(500).json({ error: err.message })
  }
}
