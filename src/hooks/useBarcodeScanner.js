// Open Food Facts API abfragen
async function lookupBarcode(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1 && data.product) {
      const p = data.product
      return (
        p.product_name_de ||
        p.product_name ||
        p.abbreviated_product_name ||
        null
      )
    }
  } catch {}
  return null
}

// Fuzzy-Match gegen Inventar
function findMatch(productName, inventoryItems) {
  if (!productName) return null
  const lower = productName.toLowerCase()

  // 1. Exakter Match
  let match = inventoryItems.find(i => i.name.toLowerCase() === lower)
  if (match) return match

  // 2. Inventarname im Produktnamen enthalten
  match = inventoryItems.find(i => lower.includes(i.name.toLowerCase()))
  if (match) return match

  // 3. Produktname im Inventarnamen enthalten
  match = inventoryItems.find(i => i.name.toLowerCase().includes(lower))
  if (match) return match

  // 4. Wort-Match — ein Wort aus dem Inventarnamen kommt im Produktnamen vor
  match = inventoryItems.find(i => {
    const words = i.name.toLowerCase().split(/\s+/)
    return words.some(w => w.length > 3 && lower.includes(w))
  })
  return match || null
}

export async function processBarcode(barcode, inventoryItems) {
  const productName = await lookupBarcode(barcode)
  const matchedItem = findMatch(productName || barcode, inventoryItems)

  return {
    barcode,
    productName: productName || barcode,
    matchedItem: matchedItem || null,
  }
}
