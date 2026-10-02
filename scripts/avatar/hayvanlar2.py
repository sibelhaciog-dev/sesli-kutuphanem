# 12 hayvan dostu + rehber eşyaları + mevsimlikler + gizli hayvanlar — önizleme.
import math
from esyalar import CAP, UMBRELLA
from hayvanlar import svg, W, eyes, cheeks, bg, smile, tilki, ayi, baykus, tavsan, kirpi, kaplumbaga, kedi

# ---------- yeni hayvanlar ----------
def kopek(extra=""):
    c, e = "#e7c59b", "#9a6542"
    b = bg("#d6e4f0")
    b += W(f'<ellipse cx="100" cy="106" rx="52" ry="52" fill="{c}"/>')
    b += W(f'<path d="M54 64 C34 70 30 110 42 134 C52 128 58 108 60 84 Z" fill="{e}"/><path d="M146 64 C166 70 170 110 158 134 C148 128 142 108 140 84 Z" fill="{e}"/>')
    b += W('<ellipse cx="100" cy="134" rx="22" ry="17" fill="#f7e6cc"/><ellipse cx="122" cy="96" rx="14" ry="12" fill="#c9905f"/>', .85)
    b += eyes(102, 20) + '<ellipse cx="100" cy="126" rx="9" ry="6.5" fill="#2e2420" filter="url(#pencil)"/>' + smile(137, 7)
    b += '<g filter="url(#pencil)"><path d="M96 142 Q100 154 104 142 Z" fill="#e5737c"/></g>' + cheeks(124, 34)
    return b + extra

def penguen(extra=""):
    k = "#2f3a4a"
    b = bg("#d3e8ee")
    b += W(f'<path d="M100 40 C146 40 160 84 156 124 C152 162 128 182 100 182 C72 182 48 162 44 124 C40 84 54 40 100 40 Z" fill="{k}"/>')
    b += W('<path d="M100 66 C128 66 140 90 136 118 C132 146 118 166 100 168 C82 166 68 146 64 118 C60 90 72 66 100 66 Z" fill="#f8f5ee"/>', .95)
    b += eyes(102, 17) + '<path d="M90 118 L110 118 L100 132 Z" fill="#f0a23a" filter="url(#pencil)"/>' + cheeks(122, 28)
    return b + extra

def ahtapot(extra=""):
    c = "#b07cc6"
    tent = ''.join(f'<path d="M{x} 140 C{x-6} 160 {x+10} 170 {x+2} 190" stroke="{c}" stroke-width="15" fill="none" stroke-linecap="round"/>' for x in (56, 78, 100, 122, 144))
    b = bg("#cfe7e6")
    b += W(tent, .9)
    b += W(f'<path d="M100 36 C146 36 160 80 156 112 C152 138 132 150 100 150 C68 150 48 138 44 112 C40 80 54 36 100 36 Z" fill="{c}"/>')
    b += W('<g fill="#d6a9e4"><circle cx="76" cy="66" r="6"/><circle cx="124" cy="60" r="5"/><circle cx="104" cy="52" r="4"/></g>', .8)
    b += eyes(102, 20) + smile(122, 9) + cheeks(116, 34)
    return b + extra

def fil(extra=""):
    c = "#a6adb8"
    b = bg("#f2dcc4")
    b += W(f'<path d="M58 70 C20 56 14 118 40 140 C52 146 62 132 66 116 Z" fill="{c}"/><path d="M142 70 C180 56 186 118 160 140 C148 146 138 132 134 116 Z" fill="{c}"/>')
    b += W('<path d="M52 82 C34 78 32 116 46 128 C54 124 58 110 60 96 Z" fill="#e8b8bf"/><path d="M148 82 C166 78 168 116 154 128 C146 124 142 110 140 96 Z" fill="#e8b8bf"/>', .7)
    b += W(f'<ellipse cx="100" cy="100" rx="46" ry="48" fill="{c}"/><path d="M88 120 C86 150 92 172 108 176 C116 178 120 170 112 166 C104 162 104 146 112 120 Z" fill="{c}"/>')
    b += eyes(98, 18) + cheeks(118, 30) + '<g filter="url(#pencil)" stroke="#7c838e" stroke-width="1.5" fill="none" opacity=".7"><path d="M92 140 q8 3 16 0"/><path d="M94 152 q7 3 14 0"/></g>'
    return b + extra

def zurafa(extra=""):
    y, s = "#f0c869", "#c98a45"
    b = bg("#d9e8cc")
    b += W(f'<path d="M80 150 L84 200 L116 200 L120 150 Z" fill="{y}"/>')
    b += W(f'<rect x="76" y="24" width="7" height="26" rx="3" fill="{s}"/><rect x="117" y="24" width="7" height="26" rx="3" fill="{s}"/><circle cx="79.5" cy="24" r="7" fill="#8a5a33"/><circle cx="120.5" cy="24" r="7" fill="#8a5a33"/>')
    b += W(f'<ellipse cx="58" cy="72" rx="16" ry="8" fill="{y}" transform="rotate(-25 58 72)"/><ellipse cx="142" cy="72" rx="16" ry="8" fill="{y}" transform="rotate(25 142 72)"/>')
    b += W(f'<path d="M100 46 C132 46 146 70 144 98 C142 128 130 160 100 164 C70 160 58 128 56 98 C54 70 68 46 100 46 Z" fill="{y}"/>')
    b += W(f'<g fill="{s}"><ellipse cx="72" cy="80" rx="8" ry="6"/><ellipse cx="128" cy="76" rx="7" ry="6"/><ellipse cx="96" cy="58" rx="6" ry="4"/><ellipse cx="94" cy="186" rx="7" ry="6"/><ellipse cx="108" cy="172" rx="5" ry="5"/></g>', .75)
    b += W('<ellipse cx="100" cy="138" rx="26" ry="20" fill="#f7dfa3"/>', .9)
    b += eyes(100, 20) + '<g filter="url(#pencil)" fill="#7a4e2f"><circle cx="92" cy="136" r="2.6"/><circle cx="108" cy="136" r="2.6"/></g>' + smile(148, 7) + cheeks(118, 32)
    return b + extra

ANIMALS = [("Tilki", tilki), ("Ayı", ayi), ("Baykuş", baykus), ("Kirpi", kirpi),
           ("Kedi", kedi), ("Köpek", kopek), ("Tavşan", tavsan),
           ("Kaplumbağa", kaplumbaga), ("Penguen", penguen), ("Ahtapot", ahtapot),
           ("Fil", fil), ("Zürafa", zurafa)]

# ---------- rehber eşyaları ----------
ITEMS = [
    ("Duygu ve Davranış", "Kalp kolye",
     W('<path d="M70 150 Q100 176 130 150" stroke="#c9a14a" stroke-width="2.4" fill="none"/>', .9)
     + W('<path d="M100 186 C88 176 82 168 88 162 C93 157 99 160 100 165 C101 160 107 157 112 162 C118 168 112 176 100 186 Z" fill="#e0475a"/>', .95)),
    ("Sosyal İlişkiler", "Arkadaşlık bayrakları",
     W('<path d="M10 30 Q100 62 190 30" stroke="#8a6a50" stroke-width="1.6" fill="none"/>'
       + ''.join(f'<path d="M{x} {30+ (x-10)*(190-x)/1010} l12 2 l-6 14 Z" fill="{c}"/>' for x, c in [(22,"#e07a5f"),(46,"#e9b44c"),(70,"#81b29a"),(118,"#3d8fb5"),(142,"#9b7ec8"),(166,"#d9668c")]), .9)),
    ("Değişim", "Yolculuk çantası",
     W('<rect x="140" y="128" width="40" height="46" rx="10" fill="#4f86c6"/><rect x="146" y="140" width="28" height="12" rx="4" fill="#3c6ea8"/><path d="M146 128 Q160 112 174 128" stroke="#3c6ea8" stroke-width="4" fill="none"/>', .95)),
    ("Zor Konular", "Şemsiye", UMBRELLA),
    ("Özel İlgi", "Büyüteç",
     W('<circle cx="160" cy="150" r="17" fill="#d8ecf3" stroke="#7a5a3c" stroke-width="5"/><path d="M148 164 L130 188" stroke="#7a5a3c" stroke-width="8" stroke-linecap="round"/>', .95)),
    ("Eğlence", "Konfeti şapka",
     W('<path d="M80 50 L100 4 L120 50 Z" fill="#e86f86"/><g fill="#f6d36a"><circle cx="96" cy="34" r="3"/><circle cx="106" cy="22" r="3"/><circle cx="100" cy="44" r="3"/></g><circle cx="100" cy="6" r="6" fill="#f6d36a"/>', .95)
     + '<g filter="url(#pencil)"><rect x="40" y="30" width="5" height="9" fill="#3d8fb5" transform="rotate(20 42 34)"/><rect x="150" y="26" width="5" height="9" fill="#81b29a" transform="rotate(-20 152 30)"/><circle cx="160" cy="54" r="3" fill="#e07a5f"/><circle cx="36" cy="58" r="3" fill="#9b7ec8"/></g>'),
    ("Okul", "Mezuniyet kepi", CAP),
    ("Etkinlik", "Ressam beresi",
     W('<path d="M52 58 C56 30 140 22 152 52 C142 46 70 46 52 58 Z" fill="#c9414e"/><circle cx="104" cy="26" r="5" fill="#c9414e"/>', .95)
     + W('<g transform="rotate(30 40 150)"><rect x="36" y="120" width="6" height="52" rx="3" fill="#a9744c"/><path d="M34 120 C34 108 44 108 44 120 Z" fill="#3d8fb5"/></g>', .95)),
]

SEASONS = [
    ("Sonbahar", "Yaprak atkı", ayi,
     W('<path d="M56 150 C80 166 120 166 144 150 L148 162 C122 178 78 178 52 162 Z" fill="#d9783a"/><path d="M116 160 L128 194 L110 196 L104 164 Z" fill="#c4612b"/>', .95)
     + W('<g fill="#e5a93b"><path d="M70 156 q6 -10 12 0 q-6 6 -12 0z"/><path d="M118 156 q6 -10 12 0 q-6 6 -12 0z"/></g>', .9)),
    ("Kış", "Bere ve kardan adam", penguen,
     W('<path d="M54 64 C56 26 144 26 146 64 Z" fill="#4f86c6"/><rect x="50" y="58" width="100" height="14" rx="7" fill="#f2f0ea"/><circle cx="100" cy="22" r="10" fill="#f2f0ea"/>', .95)
     + W('<circle cx="166" cy="176" r="16" fill="#fbfbf8"/><circle cx="166" cy="150" r="11" fill="#fbfbf8"/><path d="M166 150 l8 2 l-8 2z" fill="#f0a23a"/>', .95)
     + '<g filter="url(#pencil)" fill="#2e2420"><circle cx="163" cy="147" r="1.4"/><circle cx="169" cy="147" r="1.4"/></g>'),
    ("İlkbahar", "Çiçek tacı", tavsan,
     W(''.join(f'<circle cx="{x}" cy="{70 - 14*math.sin((x-60)/80*math.pi)}" r="8" fill="{c}"/>' for x, c in [(60,"#f6a6b2"),(76,"#f6d36a"),(92,"#b9a6e8"),(108,"#f6a6b2"),(124,"#f6d36a"),(140,"#b9a6e8")])
       + '<g fill="#81b29a"><ellipse cx="68" cy="66" rx="5" ry="3"/><ellipse cx="132" cy="66" rx="5" ry="3"/></g>', .95)),
    ("Yaz", "Hasır şapka", kaplumbaga,
     W('<ellipse cx="100" cy="122" rx="56" ry="10" fill="#e9c77b"/><path d="M72 122 C72 98 128 98 128 122 Z" fill="#e9c77b"/><rect x="72" y="114" width="56" height="7" fill="#d9668c"/>', .95)),
]

SPECIAL = [
    ("23 Nisan", "Balon", kedi, W('<ellipse cx="164" cy="44" rx="20" ry="24" fill="#e0475a"/><path d="M164 68 Q156 100 150 150" stroke="#8a6a50" stroke-width="1.4" fill="none"/>', .95)),
    ("Kütüphaneler Haftası", "Altın kitap ayracı", baykus, W('<path d="M148 120 L172 120 L172 186 L160 174 L148 186 Z" fill="#e2b13c"/>', .95) + '<g filter="url(#pencil)"><circle cx="160" cy="132" r="4" fill="#fff3c4"/></g>'),
    ("Okula dönüş", "Okul çantası", kopek, W('<rect x="22" y="128" width="40" height="48" rx="10" fill="#e9b44c"/><rect x="28" y="142" width="28" height="12" rx="4" fill="#d39a2e"/><path d="M28 128 Q42 112 56 128" stroke="#d39a2e" stroke-width="4" fill="none"/>', .95)),
]

# ---------- gizli hayvanlar ----------
def kelaynak():
    b = bg("#f3dcc7")
    b += W('<path d="M64 60 C52 40 70 30 80 44 C78 30 96 28 96 44 C100 30 118 34 112 50 Z" fill="#3d4a5c"/>', .9)
    b += W('<path d="M100 60 C140 60 156 98 150 132 C144 166 122 186 100 186 C78 186 56 166 50 132 C44 98 60 60 100 60 Z" fill="#3a4658"/>')
    b += W('<path d="M96 54 C120 54 130 78 126 100 C122 116 108 120 96 120 C80 120 70 110 70 92 C70 70 80 54 96 54 Z" fill="#d9746a"/>', .95)
    b += W('<path d="M118 98 C140 104 156 124 160 150 C150 132 136 118 116 110 Z" fill="#c4554c"/>', .95)
    b += '<g filter="url(#pencil)"><ellipse cx="104" cy="86" rx="5" ry="6" fill="#2e2420"/><circle cx="105.8" cy="83.6" r="1.6" fill="#fff"/></g>'
    b += W('<g fill="#5b7a68" opacity=".6"><path d="M60 140 q20 -14 40 0"/><path d="M100 150 q20 -14 40 0"/></g>', .5)
    return b

def fok():
    c = "#9aa4ab"
    b = bg("#cfe3ec")
    b += W(f'<path d="M100 44 C146 44 162 88 156 124 C150 158 128 176 100 176 C72 176 50 158 44 124 C38 88 54 44 100 44 Z" fill="{c}"/>')
    b += W('<ellipse cx="100" cy="128" rx="28" ry="20" fill="#c6cdd2"/><g fill="#7f888f"><circle cx="70" cy="80" r="4"/><circle cx="132" cy="74" r="5"/><circle cx="120" cy="150" r="4"/></g>', .85)
    b += eyes(100, 22, r=7) + '<ellipse cx="100" cy="120" rx="7" ry="5" fill="#2e2420" filter="url(#pencil)"/>' + smile(132, 6)
    b += '<g stroke="#5c646a" stroke-width="1.3" filter="url(#pencil)" opacity=".7"><path d="M80 126 L54 120"/><path d="M80 132 L54 136"/><path d="M120 126 L146 120"/><path d="M120 132 L146 136"/></g>'
    return b

def caretta():
    b = bg("#f1e2b5")
    b += W('<path d="M24 160 C24 104 60 78 100 78 C140 78 176 104 176 160 Z" fill="#8a5a33"/>', .9)
    b += W('<g fill="#b9834e"><path d="M70 100 l18 10 l-4 20 l-20 0 l-4 -20z"/><path d="M112 100 l18 10 l-4 20 l-20 0 l-4 -20z"/><path d="M90 124 l20 0 l6 18 l-16 12 l-16 -12z"/></g>', .8)
    b += W('<ellipse cx="100" cy="156" rx="38" ry="30" fill="#c9915a"/>')
    b += W('<g fill="#a8713f"><ellipse cx="86" cy="146" rx="6" ry="4"/><ellipse cx="114" cy="146" rx="6" ry="4"/><ellipse cx="100" cy="138" rx="5" ry="3"/></g>', .8)
    b += eyes(154, 16, r=5) + smile(170, 7) + cheeks(164, 24)
    return b

def kirmizi_panda():
    r = "#cf5f2e"
    b = bg("#e2ecd2")
    b += W(f'<path d="M52 64 L50 30 L82 50 Z" fill="{r}"/><path d="M148 64 L150 30 L118 50 Z" fill="{r}"/>')
    b += W('<path d="M56 56 L56 38 L72 50 Z" fill="#f6efe2"/><path d="M144 56 L144 38 L128 50 Z" fill="#f6efe2"/>', .9)
    b += W(f'<ellipse cx="100" cy="106" rx="56" ry="50" fill="{r}"/>')
    b += W('<path d="M64 86 C74 70 92 76 92 92 L88 120 C78 122 64 110 64 86 Z" fill="#f6efe2"/><path d="M136 86 C126 70 108 76 108 92 L112 120 C122 122 136 110 136 86 Z" fill="#f6efe2"/><ellipse cx="100" cy="134" rx="22" ry="16" fill="#f6efe2"/>', .95)
    b += W('<path d="M70 104 C74 118 82 128 88 132 L84 140 C74 134 66 120 66 106 Z" fill="#6b3420"/><path d="M130 104 C126 118 118 128 112 132 L116 140 C126 134 134 120 134 106 Z" fill="#6b3420"/>', .9)
    b += eyes(102, 18) + '<ellipse cx="100" cy="128" rx="7" ry="5" fill="#2e2420" filter="url(#pencil)"/>' + smile(138, 6)
    return b

def leopar(base, spot, bgc):
    b = bg(bgc)
    b += W(f'<circle cx="56" cy="62" r="15" fill="{base}"/><circle cx="144" cy="62" r="15" fill="{base}"/>')
    b += W(f'<ellipse cx="100" cy="108" rx="54" ry="50" fill="{base}"/>')
    rosettes = [(68, 80), (132, 76), (100, 64), (60, 112), (140, 110), (84, 70), (118, 66), (72, 136), (128, 136)]
    b += W(''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="none" stroke="{spot}" stroke-width="3.2" stroke-dasharray="7 4"/>' for x, y in rosettes), .85)
    b += W('<ellipse cx="100" cy="132" rx="22" ry="16" fill="#f8efe0"/>', .9)
    b += eyes(104, 20, ink="#3c3a22") + '<path d="M94 124 L106 124 L100 131 Z" fill="#c9746e" filter="url(#pencil)"/>' + smile(138, 6)
    return b

def pangolin():
    s = "#a5774d"
    b = bg("#ead8c6")
    scales = ''.join(f'<path d="M{x} {y} q12 -14 24 0 q-12 10 -24 0z" fill="{s}"/>' for y in (60, 76, 92, 108, 124, 140, 156) for x in range(40 + (y // 16 % 2) * 12, 160, 24))
    b += W(f'<path d="M100 44 C150 44 168 92 162 130 C156 166 128 184 100 184 C72 184 44 166 38 130 C32 92 50 44 100 44 Z" fill="#8a6040"/>' + scales, .9)
    b += W('<path d="M100 88 C124 88 134 110 130 134 C126 158 112 172 100 176 C88 172 74 158 70 134 C66 110 76 88 100 88 Z" fill="#e8c9a6"/>')
    b += eyes(124, 13, r=4.5) + '<ellipse cx="100" cy="156" rx="5" ry="3.6" fill="#2e2420" filter="url(#pencil)"/>' + smile(164, 5) + cheeks(140, 22)
    return b

SECRET = [
    ("Kelaynak", kelaynak, "Doğada yaşayan çok az kelaynak kaldı. Türkiye'de Birecik'te koruma altında yaşatılıyor."),
    ("Akdeniz foku", fok, "Türkiye kıyılarının en nadir canlılarından. Sakin deniz mağaralarına ve temiz denize ihtiyacı var."),
    ("Caretta caretta", caretta, "Yumurtalarını kumsala bırakır. Temiz ve karanlık sahiller yavruların denize ulaşmasını sağlar."),
    ("Kırmızı panda", kirmizi_panda, "Himalayaların bambu ormanlarında yaşar. Ormanlar azaldıkça o da azalıyor."),
    ("Anadolu parsı", lambda: leopar("#e7b75a", "#6a4a24", "#efe0c0"), "Anadolu'nun büyük kedisi. O kadar az kaldı ki görenler bile çok nadir."),
    ("Pangolin", pangolin, "Pullarla kaplı tek memeli. Dünyada en çok yasa dışı avlanan hayvanlardan biri."),
    ("Kar leoparı", lambda: leopar("#e4e3dc", "#5d6168", "#dde7ef"), "Asya'nın karlı dağlarında yaşar. Üşüyünce kalın kuyruğuna sarınır."),
]

def card(inner, title, sub=""):
    sub = f'<small>{sub}</small>' if sub else ''
    return f'<figure><div class="av">{inner}</div><figcaption>{title}{sub}</figcaption></figure>'

def page():
    n = [600]
    def S(body, label):
        n[0] += 1
        return svg(body, n[0], label)
    animals = ''.join(card(S(fn(), name), name) for name, fn in ANIMALS)
    items = ''.join(card(S(tilki(art), f"{guide}: {name}"), name, guide) for guide, name, art in ITEMS)
    all_items = tilki(ITEMS[0][2] + ITEMS[2][2] + ITEMS[5][2] + ITEMS[4][2])
    seasons = ''.join(card(S(fn(art), f"{season}: {name}"), name, season) for season, name, fn, art in SEASONS)
    special = ''.join(card(S(fn(art), f"{day}: {name}"), name, day) for day, name, fn, art in SPECIAL)
    secret = ''.join(f'<figure class="s"><div class="av">{S(fn(), name)}</div><figcaption>{name}<small>{fact}</small></figcaption></figure>' for name, fn, fact in SECRET)
    return f"""<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hayvan Dostları</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{--bg:#fbf7f0;--ink:#2f2a26;--muted:#7a6f66;--card:#fffdf9;--line:#ece3d6;--accent:#d9663a;--deep:#2f4b3f}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 'DM Sans',system-ui,sans-serif}}
main{{max-width:1000px;margin:0 auto;padding:40px 16px 64px}}
h1{{font:600 34px/1.15 Fraunces,serif;margin:0 0 6px}} h2{{font:600 24px Fraunces,serif;margin:48px 0 4px}}
p{{color:var(--muted);margin:0 0 18px;max-width:680px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}}
figure{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:10px 10px 10px;text-align:center}}
.av svg{{width:100%;height:auto;border-radius:16px;display:block}}
figcaption{{font:600 16px Fraunces,serif;margin-top:6px}} figcaption small{{display:block;font:400 13px/1.4 'DM Sans',sans-serif;color:var(--muted);margin-top:2px}}
.hero{{display:grid;grid-template-columns:220px 1fr;gap:22px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:18px}}
.hero h3{{font:600 24px Fraunces,serif;margin:0 0 6px}} .hero ul{{margin:0;padding-left:18px;color:var(--muted)}}
.secret{{background:var(--deep);color:#fdf8ee;border-radius:26px;padding:26px 20px 22px;margin-top:12px}}
.secret h3{{font:600 28px Fraunces,serif;margin:0 0 4px;text-align:center}} .secret p{{color:#d8e4dc;text-align:center;margin:0 auto 20px}}
.secret .grid{{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}}
.secret figure{{background:#fffdf9;color:var(--ink);cursor:pointer;transition:transform .15s}} .secret figure:hover{{transform:translateY(-3px)}}
@media (max-width:560px){{.hero{{grid-template-columns:1fr}} .hero .av{{max-width:220px;margin:0 auto}}}}
</style></head><body><main>
<h1>Hayvan dostları</h1>
<p>Çocuk 12 dosttan birini seçer. Okudukça dostuna eşyalar açılır; 50. kitapta da gizli bir dost seçme hakkı kazanır.</p>

<h2>12 dost</h2>
<div class="grid">{animals}</div>

<h2>Rehber eşyaları</h2>
<p>Her gelişim rehberinden 3 kitap okununca o rehberin eşyası açılır. Farklı türlerde kitap okumak böylece ödüllendirilir.</p>
<div class="grid">{items}</div>

<h2>Birden fazla eşya birlikte</h2>
<div class="hero"><div class="av">{S(all_items, "Eşyalı tilki")}</div><div><h3>Nisan'ın tilkisi</h3>
<ul><li>Duygu ve Davranış'tan 3 kitap: kalp kolye</li><li>Değişim'den 3 kitap: yolculuk çantası</li><li>Eğlence'den 3 kitap: konfeti şapka</li><li>Özel İlgi'den 3 kitap: büyüteç</li></ul></div></div>

<h2>Mevsimlik eşyalar</h2>
<p>Yalnızca o mevsim okunan kitaplarla kazanılır, sonra hep çocukta kalır.</p>
<div class="grid">{seasons}</div>

<h2>Özel günler</h2>
<div class="grid">{special}</div>

<h2>50. kitap: gizli dost</h2>
<div class="secret"><h3>Tebrikler, 50 kitap!</h3><p>Doğada korunmaya ihtiyacı olan bir dost seni bekliyor. Hangisini seçersin? 100. kitapta bir tane daha seçebilirsin.</p>
<div class="grid">{secret}</div></div>
</main></body></html>"""

