import { describe, expect, it } from 'vitest'
import { firstNameOf } from './names'

describe('firstNameOf', () => {
  it.each([
    ['Sibel Hacıoğlu', 'Sibel'],
    ['  Ayşe   Nur Yılmaz ', 'Ayşe'],
    ['Deniz', 'Deniz'],
    ['', ''],
    ['   ', ''],
  ])('%j → %j', (input, expected) => {
    expect(firstNameOf(input)).toBe(expected)
  })
})
