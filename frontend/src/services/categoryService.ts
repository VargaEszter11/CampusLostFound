import { apiFetch, throwIfNotOk } from '../api/http'

export async function suggestCategory(itemName: string, itemDescription: string): Promise<string> {
  const res = await apiFetch('/api/categories/suggest', {
    method: 'POST',
    body: JSON.stringify({ itemName, itemDescription: itemDescription || undefined }),
  })
  await throwIfNotOk(res)
  const data = (await res.json()) as { category: string }
  return data.category
}
