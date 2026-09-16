import { describe, it, expect } from 'vitest'
import { textEquals, textIncludes } from './text-compare'

describe('textEquals', () => {
  it('matches identical strings when case sensitive', () => {
    expect(textEquals('hello', 'hello', true)).toBe(true)
  })

  it('rejects case differences when case sensitive', () => {
    expect(textEquals('Hello', 'hello', true)).toBe(false)
  })

  it('ignores case when case insensitive', () => {
    expect(textEquals('Hello World', 'hello world', false)).toBe(true)
  })

  it('rejects different strings when case insensitive', () => {
    expect(textEquals('hello', 'world', false)).toBe(false)
  })

  it('matches turkish dotted capital i when case insensitive', () => {
    expect(textEquals('İŞÇİ', 'işçi', false)).toBe(true)
  })

  it('matches turkish dotless i when case insensitive', () => {
    expect(textEquals('ÇAPKIN', 'çapkın', false)).toBe(true)
  })

  it('matches turkish sentence when case insensitive', () => {
    expect(textEquals('İşe giderken benzini bitmiş', 'işe gİderken benzİnİ bitmiş', false)).toBe(
      true
    )
  })

  it('rejects turkish case differences when case sensitive', () => {
    expect(textEquals('İŞÇİ', 'işçi', true)).toBe(false)
  })

  it('keeps distinct accented letters apart when case insensitive', () => {
    expect(textEquals('ördek', 'ordek', false)).toBe(false)
  })

  it('matches ascii capital i when case insensitive', () => {
    expect(textEquals('ISTANBUL', 'istanbul', false)).toBe(true)
  })

  it('matches ascii capital i against dotless i when case insensitive', () => {
    expect(textEquals('I', 'ı', false)).toBe(true)
  })

  it('matches ascii capital i against dotted i when case insensitive', () => {
    expect(textEquals('I', 'i', false)).toBe(true)
  })

  it('matches french accented letters when case insensitive', () => {
    expect(textEquals('ÉCOLE', 'école', false)).toBe(true)
  })

  it('matches german umlauts when case insensitive', () => {
    expect(textEquals('ÄPFEL', 'äpfel', false)).toBe(true)
  })

  it('matches greek letters when case insensitive', () => {
    expect(textEquals('ΣΊΣΥΦΟΣ', 'σίσυφος', false)).toBe(true)
  })

  it('matches polish letters when case insensitive', () => {
    expect(textEquals('ŁÓDŹ', 'łódź', false)).toBe(true)
  })

  it('keeps french accents meaningful when case insensitive', () => {
    expect(textEquals('école', 'ecole', false)).toBe(false)
  })
})

describe('textIncludes', () => {
  it('finds a substring when case sensitive', () => {
    expect(textIncludes('the cat sat on the mat', 'cat', true)).toBe(true)
  })

  it('rejects a case mismatch when case sensitive', () => {
    expect(textIncludes('The Silver moon', 'silver', true)).toBe(false)
  })

  it('finds a substring regardless of case when case insensitive', () => {
    expect(textIncludes('The Silver moon', 'silver', false)).toBe(true)
  })

  it('matches when case insensitive', () => {
    expect(textIncludes('Index', 'index', false)).toBe(true)
  })

  it('returns false when the term is absent', () => {
    expect(textIncludes('the cat sat', 'dog', false)).toBe(false)
  })

  it('returns true for an empty term', () => {
    expect(textIncludes('anything', '', false)).toBe(true)
  })

  it('finds turkish terms across lines when case insensitive', () => {
    const output = 'Şaşkın\nÖrdek\nİŞÇİ\nÇAPKIN\nışıksız'
    for (const term of ['şaşkın', 'ördek', 'işçi', 'çapkın', 'ışıksız']) {
      expect(textIncludes(output, term, false)).toBe(true)
    }
  })

  it('finds turkish terms preserving case when case sensitive', () => {
    const output = 'Şaşkın\nÖrdek\nİŞÇİ\nÇAPKIN\nışıksız'
    for (const term of ['Şaşkın', 'Ördek', 'İŞÇİ', 'ÇAPKIN', 'ışıksız']) {
      expect(textIncludes(output, term, true)).toBe(true)
    }
  })

  it('finds a term at the end of the haystack', () => {
    expect(textIncludes('gidiyor İŞÇİ', 'işçi', false)).toBe(true)
  })

  it('finds a multi word term when case insensitive', () => {
    expect(textIncludes('bugün İŞE GİDERKEN yağmur yağdı', 'işe giderken', false)).toBe(true)
  })

  it('finds an ascii term containing capital i when case insensitive', () => {
    expect(textIncludes('ISTANBUL airport', 'istanbul', false)).toBe(true)
  })

  it('rejects a turkish term stripped of its diacritics', () => {
    expect(textIncludes('İŞÇİ burada', 'isci', false)).toBe(false)
  })
})
