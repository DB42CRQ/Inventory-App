import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image } = req.body
  if (!image) return res.status(400).json({ error: 'Missing image' })

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: 'What is the barcode number in this image? Reply with ONLY the number, nothing else. If there is no barcode, reply with "none".' }
        ]
      }]
    })
    const barcode = response.content[0]?.text?.trim()
    return res.status(200).json({ barcode })
  } catch (err) {
    console.error('[scan-barcode] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
