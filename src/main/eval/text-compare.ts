const DOTTED_I_VARIANTS = ['en', 'tr'] as const

function lowercaseVariants(text: string): string[] {
  return DOTTED_I_VARIANTS.map((locale) => text.toLocaleLowerCase(locale))
}

export function textEquals(a: string, b: string, caseSensitive: boolean): boolean {
  if (caseSensitive) return a === b
  const variantsA = lowercaseVariants(a)
  const variantsB = lowercaseVariants(b)
  return variantsA.some((variant, index) => variant === variantsB[index])
}

export function textIncludes(haystack: string, needle: string, caseSensitive: boolean): boolean {
  if (caseSensitive) return haystack.includes(needle)
  const haystackVariants = lowercaseVariants(haystack)
  const needleVariants = lowercaseVariants(needle)
  return haystackVariants.some((variant, index) => variant.includes(needleVariants[index]))
}
