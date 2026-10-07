/**
 * "Sibel Hacıoğlu" → "Sibel". E-postalardaki "Merhaba Sibel," hitabı için
 * kayıtta ayrıca saklanıyor; Supabase e-posta şablonları metni bölemiyor.
 * Birden çok adı olanda yalnızca ilki alınır ("Ayşe Nur Yılmaz" → "Ayşe").
 */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}
