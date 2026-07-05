export function matchesHfModelId(installedKey: string, hfModelId: string): boolean {
  console.log(installedKey, hfModelId)
  const key = installedKey.toLowerCase()
  const hf = hfModelId.toLowerCase()
  const hfParts = hf.split('/')
  const normalizedKey =
    hfParts.length >= 2 ? hfParts[hfParts.length - 1].replace(/-gguf$/i, '') : null

  return (
    key.includes(hf) ||
    (normalizedKey !== null && key === normalizedKey) ||
    (normalizedKey !== null && key.endsWith('/' + normalizedKey))
  )
}
