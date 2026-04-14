import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // GET: fetch recipe by token
  if (req.method === 'GET') {
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Missing token' })

    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('share_token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Recipe not found' })
    return res.status(200).json(data)
  }

  // POST: generate share token
  if (req.method === 'POST') {
    const { recipe_id } = req.body
    if (!recipe_id) return res.status(400).json({ error: 'Missing recipe_id' })

    // Generate token
    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('recipes')
      .update({ share_token: token })
      .eq('id', recipe_id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ token })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
