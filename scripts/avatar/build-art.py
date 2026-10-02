# Avatar çizimlerini (suluboya hayvanlar + eşyalar) src/lib/avatar-art.ts dosyasına üretir.
# Çizimler hayvanlar.py, hayvanlar2.py ve esyalar.py içinde (onaylanan önizleme tasarımları).
# Çalıştırma: python3 scripts/avatar/build-art.py
import json, re, sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hayvanlar as build2, hayvanlar2 as build3, esyalar as build4

ANIMALS = {
    'tilki': build2.tilki, 'ayi': build2.ayi, 'baykus': build2.baykus, 'kirpi': build2.kirpi,
    'kedi': build2.kedi, 'kopek': build3.kopek, 'tavsan': build2.tavsan, 'kaplumbaga': build2.kaplumbaga,
    'penguen': build3.penguen, 'ahtapot': build3.ahtapot, 'fil': build3.fil, 'zurafa': build3.zurafa,
}
SECRETS = {
    'kelaynak': build3.kelaynak, 'akdeniz-foku': build3.fok, 'caretta': build3.caretta,
    'kirmizi-panda': build3.kirmizi_panda,
    'anadolu-parsi': lambda: build3.leopar("#e7b75a", "#6a4a24", "#efe0c0"),
    'pangolin': build3.pangolin,
    'kar-leopari': lambda: build3.leopar("#e4e3dc", "#5d6168", "#dde7ef"),
}
items = {g: art for g, _, art in build3.ITEMS}
seasons = {s: art for s, _, _, art in build3.SEASONS}
special = {d: art for d, _, _, art in build3.SPECIAL}
W = build2.W
ITEMS = {
    'kalp-kolye': items['Duygu ve Davranış'],
    'arkadaslik-bayraklari': items['Sosyal İlişkiler'],
    'yolculuk-cantasi': items['Değişim'],
    'semsiye': items['Zor Konular'],
    'buyutec': items['Özel İlgi'],
    'konfeti-sapka': items['Eğlence'],
    'mezuniyet-kepi': items['Okul'],
    'ressam-beresi': items['Etkinlik'],
    'yaprak-atki': seasons['Sonbahar'],
    'kis-beresi': seasons['Kış'],
    'cicek-taci': seasons['İlkbahar'],
    # Hasır şapka önizlemede kaplumbağanın alçak başına göre çizilmişti; diğer hayvanlar için yukarı taşındı.
    'hasir-sapka': '<g transform="translate(0 -70)">' + seasons['Yaz'] + '</g>',
    'balon': special['23 Nisan'],
    'altin-ayrac': special['Kütüphaneler Haftası'],
    'okul-cantasi': special['Okula dönüş'],
}
out = {
    'animals': {k: f() for k, f in ANIMALS.items()},
    'secrets': {k: f() for k, f in SECRETS.items()},
    'items': ITEMS,
}
for group in out.values():
    for k, v in group.items():
        group[k] = re.sub(r'\s+', ' ', v)
# Filtre tanımları: WC = suluboya, pencil, soft, paper. Kimlikler bileşende her çizime özel yapılır.
wc = build2.wc_filter('WC', 7)
common = build2.COMMON
defs = re.sub(r'\s+', ' ', wc + common)
ts = ['// Bu dosya scripts/avatar/build-art.py ile üretildi; elle düzenlemeyin.',
      '// Çizimlerdeki url(#WC|pencil|soft|paper) kimlikleri AvatarFigure içinde her örneğe özel adlarla değiştirilir.',
      '',
      f'export const ART_DEFS = {json.dumps(defs, ensure_ascii=False)}',
      '',
      f'export const ANIMAL_ART: Record<string, string> = {json.dumps(out["animals"], ensure_ascii=False, indent=2)}',
      '',
      f'export const SECRET_ART: Record<string, string> = {json.dumps(out["secrets"], ensure_ascii=False, indent=2)}',
      '',
      f'export const ITEM_ART: Record<string, string> = {json.dumps(out["items"], ensure_ascii=False, indent=2)}',
      '']
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../src/lib/avatar-art.ts'), 'w').write('\n'.join(ts))
print({k: len(v) for k, v in out.items()}, sum(len(s) for g in out.values() for s in g.values()))
