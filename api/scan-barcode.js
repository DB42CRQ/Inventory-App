export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image, inventoryItems } = req.body
  if (!image) return res.status(400).json({ error: 'Missing image' })

  try {
    const itemList = inventoryItems?.map(i => i.name).join(', ') || ''

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: `Look at this product. What is the product name? 

My inventory contains: ${itemList}

Reply with a JSON object: {"productName": "the product name from the image", "matchedItem": "the best matching item from my inventory or null"}

Reply with ONLY the JSON, no other text.` }
          ]
        }]
      })
    })
    const data = await response.json()
    const text = data.content?.[0]?.text?.trim()
    console.log('[scan-barcode] raw:', text)
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[scan-barcode] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
