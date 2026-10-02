import { describe, expect, it } from 'vitest'
import { ANIMAL_ART, ITEM_ART, SECRET_ART } from './avatar-art'
import {
  AVATAR_ANIMALS,
  AVATAR_ITEMS,
  SECRET_ANIMALS,
  availableAnimals,
  chooseSecret,
  chosenSecrets,
  getItem,
  itemStatus,
  resolveAnimalId,
  secretChoicesLeft,
  toggleItem,
  wornItems,
} from './avatar'

const noProgress = { booksRead: 0, readByArea: {} }

describe('avatar çizimleri', () => {
  it('her hayvanın ve eşyanın çizimi var', () => {
    for (const animal of AVATAR_ANIMALS) expect(ANIMAL_ART[animal.id]).toBeTruthy()
    for (const animal of SECRET_ANIMALS) expect(SECRET_ART[animal.id]).toBeTruthy()
    for (const item of AVATAR_ITEMS) expect(ITEM_ART[item.id]).toBeTruthy()
  })
})

describe('resolveAnimalId', () => {
  it('bilinen hayvanı olduğu gibi döndürür', () => {
    expect(resolveAnimalId('penguen')).toBe('penguen')
    expect(resolveAnimalId('kar-leopari')).toBe('kar-leopari')
  })

  it('eski insan karakterlerini bir hayvana çevirir', () => {
    expect(resolveAnimalId('k1')).toBe('tavsan')
    expect(resolveAnimalId('k8')).toBe('penguen')
  })

  it('bilinmeyen kimlikte tilkiye düşer', () => {
    expect(resolveAnimalId('yok')).toBe('tilki')
    expect(resolveAnimalId(null)).toBe('tilki')
  })
})

describe('itemStatus', () => {
  const kep = getItem('mezuniyet-kepi')!
  const atki = getItem('yaprak-atki')!
  const balon = getItem('balon')!

  it('rehber eşyası 3 kitapta açılır ve ilerlemeyi gösterir', () => {
    const two = itemStatus(kep, { booksRead: 2, readByArea: { okul: 2 } }, new Date(2026, 0, 1))
    expect(two.available).toBe(false)
    expect(two.progress).toEqual({ have: 2, need: 3 })
    const three = itemStatus(kep, { booksRead: 3, readByArea: { okul: 3 } }, new Date(2026, 0, 1))
    expect(three.available).toBe(true)
  })

  it('mevsim eşyası yalnızca o mevsimde açıktır', () => {
    expect(itemStatus(atki, noProgress, new Date(2026, 9, 2)).available).toBe(true)
    expect(itemStatus(atki, noProgress, new Date(2026, 1, 2)).available).toBe(false)
  })

  it('özel gün eşyası tarih aralığında açıktır', () => {
    expect(itemStatus(balon, noProgress, new Date(2026, 3, 23)).available).toBe(true)
    expect(itemStatus(balon, noProgress, new Date(2026, 4, 1)).available).toBe(false)
  })
})

describe('toggleItem', () => {
  it('aynı yuvadaki eşyanın yerine geçer', () => {
    expect(toggleItem(['mezuniyet-kepi', 'kalp-kolye'], 'konfeti-sapka')).toEqual([
      'kalp-kolye',
      'konfeti-sapka',
    ])
  })

  it('takılı eşyayı çıkarır', () => {
    expect(toggleItem(['kalp-kolye'], 'kalp-kolye')).toEqual([])
  })

  it('gizli hayvan kaydını korur, eski aksesuarları temizler', () => {
    expect(toggleItem(['gizli:pangolin', 's3'], 'kalp-kolye')).toEqual([
      'gizli:pangolin',
      'kalp-kolye',
    ])
  })
})

describe('wornItems', () => {
  it('bilinmeyenleri atlar ve arkadan öne sıralar', () => {
    expect(
      wornItems(['mezuniyet-kepi', 's1', 'arkadaslik-bayraklari', 'gizli:caretta']).map(
        (item) => item.id,
      ),
    ).toEqual(['arkadaslik-bayraklari', 'mezuniyet-kepi'])
  })
})

describe('gizli hayvanlar', () => {
  it('50. kitaptan önce seçilemez', () => {
    expect(chooseSecret([], 'pangolin', 49)).toEqual([])
  })

  it('50. kitapta bir, 100. kitapta ikinci hak doğar', () => {
    const first = chooseSecret([], 'pangolin', 50)
    expect(chosenSecrets(first)).toEqual(['pangolin'])
    expect(secretChoicesLeft(50, first)).toBe(0)
    expect(chooseSecret(first, 'caretta', 60)).toEqual(first)
    const second = chooseSecret(first, 'caretta', 100)
    expect(chosenSecrets(second)).toEqual(['pangolin', 'caretta'])
  })

  it('seçilen gizli hayvan hayvan listesine eklenir', () => {
    const ids = availableAnimals(['gizli:kelaynak']).map((animal) => animal.id)
    expect(ids).toHaveLength(13)
    expect(ids).toContain('kelaynak')
  })
})
