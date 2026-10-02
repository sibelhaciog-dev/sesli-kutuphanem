# Harf rozetleri + suluboya hayvan dostları — önizleme sayfası.
import hashlib

def wc_filter(fid, seed, scale=7):
    return f"""<filter id="{fid}" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="{seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="{scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.6" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{seed}" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.12" result="ga"/>
    <feComposite in="b" in2="ga" operator="in" result="tex"/>
    <feMorphology in="tex" operator="erode" radius="1.4" result="inner"/>
    <feComposite in="tex" in2="inner" operator="out" result="edge"/>
    <feColorMatrix in="edge" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 0.55 0" result="ed"/>
    <feMerge><feMergeNode in="tex"/><feMergeNode in="ed"/></feMerge></filter>"""

COMMON = """<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6"/><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="9" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4"/></filter>
<radialGradient id="paper" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f6efe2"/></radialGradient>"""

def svg(body, seed, label, vb="0 0 200 200"):
    return (f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">'
            f'<defs>{COMMON}{wc_filter("w"+str(seed), seed)}</defs>{body.replace("WC", "w"+str(seed))}</svg>')

def W(content, op=0.92):
    return f'<g filter="url(#WC)" opacity="{op}">{content}</g>'

def eyes(y=104, dx=18, cx=100, r=5.5, ink="#2e2420"):
    s = '<g filter="url(#pencil)">'
    for x in (cx - dx, cx + dx):
        s += f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*1.2}" fill="{ink}"/><circle cx="{x+1.8}" cy="{y-2.4}" r="1.8" fill="#fff"/>'
    return s + '</g>'

def cheeks(y=122, dx=30, c="#f08a7e"):
    return f'<g filter="url(#soft)" opacity=".5"><ellipse cx="{100-dx}" cy="{y}" rx="10" ry="6.5" fill="{c}"/><ellipse cx="{100+dx}" cy="{y}" rx="10" ry="6.5" fill="{c}"/></g>'

def bg(c):
    return f'<rect width="200" height="200" fill="url(#paper)"/><g filter="url(#soft)" opacity=".5"><ellipse cx="100" cy="108" rx="80" ry="76" fill="{c}"/></g>'

def smile(y=128, w=9, c="#5a3b30"):
    return f'<path d="M{100-w} {y} Q100 {y+7} {100+w} {y}" stroke="{c}" stroke-width="2.2" fill="none" stroke-linecap="round" filter="url(#pencil)"/>'

# ---------- hayvanlar ----------
def tilki(extra=""):
    o, d = "#e8823f", "#5a3424"
    b = bg("#f6d9b8")
    b += W(f'<path d="M58 62 L48 22 L84 52 Z" fill="{o}"/><path d="M142 62 L152 22 L116 52 Z" fill="{o}"/>')
    b += W(f'<path d="M56 46 L50 26 L66 40 Z" fill="{d}"/><path d="M144 46 L150 26 L134 40 Z" fill="{d}"/>', .8)
    b += W(f'<path d="M100 48 C138 48 156 72 154 98 C152 124 128 150 100 160 C72 150 48 124 46 98 C44 72 62 48 100 48 Z" fill="{o}"/>')
    b += W('<path d="M48 104 C62 116 78 120 92 132 L100 160 C76 152 56 132 48 104 Z" fill="#fbf3e8"/><path d="M152 104 C138 116 122 120 108 132 L100 160 C124 152 144 132 152 104 Z" fill="#fbf3e8"/>', .95)
    b += eyes(102, 20) + f'<ellipse cx="100" cy="146" rx="7" ry="5" fill="{d}" filter="url(#pencil)"/>' + cheeks(124, 34)
    return b + extra

def ayi(extra=""):
    c, m = "#9a6a48", "#e6c9a6"
    b = bg("#d9e6c9")
    b += W(f'<circle cx="56" cy="58" r="20" fill="{c}"/><circle cx="144" cy="58" r="20" fill="{c}"/>')
    b += W('<circle cx="56" cy="58" r="10" fill="#e3b49a"/><circle cx="144" cy="58" r="10" fill="#e3b49a"/>', .8)
    b += W(f'<ellipse cx="100" cy="106" rx="56" ry="54" fill="{c}"/>')
    b += W(f'<ellipse cx="100" cy="132" rx="24" ry="18" fill="{m}"/>', .95)
    b += eyes(102, 20) + '<ellipse cx="100" cy="124" rx="8" ry="5.5" fill="#3a2620" filter="url(#pencil)"/>' + smile(134, 7) + cheeks(122, 36)
    return b + extra

def baykus(extra=""):
    c, w = "#8d7a9e", "#f3ead8"
    b = bg("#f2dfb0")
    b += W(f'<path d="M62 52 L70 30 L84 50 Z" fill="{c}"/><path d="M138 52 L130 30 L116 50 Z" fill="{c}"/>')
    b += W(f'<path d="M100 44 C146 44 160 84 156 122 C152 158 128 176 100 176 C72 176 48 158 44 122 C40 84 54 44 100 44 Z" fill="{c}"/>')
    b += W(f'<ellipse cx="100" cy="146" rx="30" ry="26" fill="{w}"/>', .85)
    b += W('<circle cx="78" cy="96" r="20" fill="#fdf6e6"/><circle cx="122" cy="96" r="20" fill="#fdf6e6"/>', .95)
    b += eyes(96, 22, r=7.5) + '<path d="M94 112 L106 112 L100 124 Z" fill="#e9a23b" filter="url(#pencil)"/>'
    b += '<g filter="url(#pencil)" stroke="#a89184" stroke-width="1.6" fill="none" opacity=".7"><path d="M86 140 q4 4 8 0"/><path d="M106 140 q4 4 8 0"/><path d="M96 152 q4 4 8 0"/></g>'
    return b + extra

def tavsan(extra=""):
    c, p = "#ece6e0", "#f4b2b6"
    b = bg("#cfe3ef")
    b += W(f'<ellipse cx="78" cy="44" rx="13" ry="36" fill="{c}"/><ellipse cx="122" cy="44" rx="13" ry="36" fill="{c}"/>')
    b += W(f'<ellipse cx="78" cy="46" rx="6" ry="26" fill="{p}"/><ellipse cx="122" cy="46" rx="6" ry="26" fill="{p}"/>', .8)
    b += W(f'<ellipse cx="100" cy="114" rx="50" ry="48" fill="{c}"/>')
    b += eyes(108, 18) + f'<path d="M95 124 L105 124 L100 130 Z" fill="#e48a92" filter="url(#pencil)"/>' + smile(134, 6) + cheeks(126, 32, "#f39aa0")
    return b + extra

def kirpi(extra=""):
    s, f = "#7b5a43", "#efd6b8"
    spikes = ''.join(f'<path d="M{100+70*__import__("math").cos(a)} {112+66*__import__("math").sin(a)} L{100+92*__import__("math").cos(a+0.12)} {112+86*__import__("math").sin(a+0.12)} L{100+70*__import__("math").cos(a+0.24)} {112+66*__import__("math").sin(a+0.24)} Z" fill="{s}"/>' for a in [x*0.24 - 3.3 for x in range(14)])
    b = bg("#f5d0c8")
    b += W(spikes + f'<ellipse cx="100" cy="112" rx="72" ry="66" fill="{s}"/>')
    b += W(f'<path d="M100 66 C134 66 150 92 148 116 C146 142 124 160 100 162 C76 160 54 142 52 116 C50 92 66 66 100 66 Z" fill="{f}"/>')
    b += eyes(108, 18) + '<ellipse cx="100" cy="128" rx="7" ry="5" fill="#3a2620" filter="url(#pencil)"/>' + smile(138, 6) + cheeks(126, 32)
    return b + extra

def kaplumbaga(extra=""):
    g, sh = "#8fbf7a", "#6d8f4e"
    b = bg("#f3e3b2")
    b += W(f'<path d="M30 150 C30 96 64 70 100 70 C136 70 170 96 170 150 Z" fill="{sh}"/>', .9)
    b += W('<g fill="#9cb86a"><circle cx="70" cy="118" r="14"/><circle cx="100" cy="100" r="14"/><circle cx="130" cy="118" r="14"/><circle cx="100" cy="134" r="12"/></g>', .75)
    b += W(f'<ellipse cx="100" cy="150" rx="40" ry="34" fill="{g}"/>')
    b += eyes(146, 16, r=5) + smile(164, 7) + cheeks(158, 26)
    return b + extra

def porsuk(extra=""):
    gr, k, w = "#9a9a96", "#3d3a38", "#f4f1ea"
    b = bg("#dcd3ea")
    b += W(f'<circle cx="54" cy="70" r="13" fill="{gr}"/><circle cx="146" cy="70" r="13" fill="{gr}"/>')
    b += W(f'<path d="M100 50 C140 50 156 82 152 112 C148 142 124 162 100 166 C76 162 52 142 48 112 C44 82 60 50 100 50 Z" fill="{w}"/>')
    b += W(f'<path d="M66 64 C76 58 84 60 88 70 L92 150 C80 146 70 132 64 116 C60 100 60 76 66 64 Z" fill="{k}"/><path d="M134 64 C124 58 116 60 112 70 L108 150 C120 146 130 132 136 116 C140 100 140 76 134 64 Z" fill="{k}"/>', .9)
    b += eyes(106, 20, ink="#f4f1ea").replace('fill="#fff"', 'fill="#2e2420"') + '<ellipse cx="100" cy="150" rx="7" ry="5" fill="#2e2420" filter="url(#pencil)"/>'
    return b + extra

def kedi(extra=""):
    c, s = "#f0b46a", "#d98a3a"
    b = bg("#f4cdd6")
    b += W(f'<path d="M54 74 L58 30 L90 58 Z" fill="{c}"/><path d="M146 74 L142 30 L110 58 Z" fill="{c}"/>')
    b += W(f'<path d="M62 64 L62 42 L80 58 Z" fill="#f6b2a6"/><path d="M138 64 L138 42 L120 58 Z" fill="#f6b2a6"/>', .8)
    b += W(f'<ellipse cx="100" cy="110" rx="56" ry="50" fill="{c}"/>')
    b += W(f'<g fill="{s}"><path d="M92 62 L100 82 L108 62 Z"/><path d="M48 104 L66 108 L48 114 Z"/><path d="M152 104 L134 108 L152 114 Z"/></g>', .8)
    b += eyes(106, 20) + '<path d="M95 122 L105 122 L100 128 Z" fill="#d9707a" filter="url(#pencil)"/>' + smile(134, 6)
    b += '<g stroke="#6b4a36" stroke-width="1.4" filter="url(#pencil)" opacity=".7"><path d="M68 126 L44 122"/><path d="M68 132 L44 134"/><path d="M132 126 L156 122"/><path d="M132 132 L156 134"/></g>' + cheeks(124, 34)
    return b + extra

SCARF = W('<path d="M58 150 C80 166 120 166 142 150 L146 162 C122 178 78 178 54 162 Z" fill="#d94f5c"/><path d="M118 160 L132 194 L114 196 L106 164 Z" fill="#c2414e"/>', .95)
CROWN = W('<path d="M70 52 L74 24 L88 40 L100 18 L112 40 L126 24 L130 52 Z" fill="#f0c341"/>', .95) + '<g filter="url(#pencil)"><circle cx="100" cy="30" r="3.5" fill="#d94f5c"/></g>'
BAG = W('<rect x="140" y="128" width="40" height="46" rx="10" fill="#4f86c6"/><rect x="146" y="140" width="28" height="12" rx="4" fill="#3c6ea8"/>', .95)

ANIMALS = [("Tilki", tilki), ("Ayı", ayi), ("Baykuş", baykus), ("Tavşan", tavsan),
           ("Kirpi", kirpi), ("Kaplumbağa", kaplumbaga), ("Porsuk", porsuk), ("Kedi", kedi)]

# ---------- harf rozetleri ----------
PALETTE = ["#e07a5f", "#3d8fb5", "#81b29a", "#e9b44c", "#9b7ec8", "#d9668c", "#5aa59a", "#c98a4b"]
def color_for(name):
    return PALETTE[int(hashlib.md5(name.encode()).hexdigest(), 16) % len(PALETTE)]

def initial(name):
    return name[0]

def badge(name, seed):
    c = color_for(name)
    body = (f'<g filter="url(#WC)" opacity=".85"><circle cx="100" cy="100" r="78" fill="{c}"/></g>'
            f'<g filter="url(#soft)" opacity=".35"><circle cx="78" cy="76" r="30" fill="#fff"/></g>'
            f'<text x="100" y="100" text-anchor="middle" dominant-baseline="central" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="96" fill="#fffdf8" filter="url(#pencil)">{initial(name)}</text>')
    return svg(body, seed, name)

NAMES = ["Nisan", "Agah", "Ada", "Aras", "Çağan", "Şule", "Ömer", "İpek", "Ülkü"]

def page():
    badges = ''.join(f'<figure class="b"><div class="bd">{badge(n, 100+i)}</div><figcaption>{n}</figcaption></figure>' for i, n in enumerate(NAMES))
    animals = ''.join(f'<figure><div class="av">{svg(fn(), 200+i, name)}</div><figcaption>{name}</figcaption></figure>' for i, (name, fn) in enumerate(ANIMALS))
    dressed = ''.join(f'<figure><div class="av">{svg(fn(extra), 300+i, label)}</div><figcaption>{label}<small>{note}</small></figcaption></figure>'
                      for i, (fn, extra, label, note) in enumerate([
                          (tilki, '', 'Başlangıç', 'ilk gün'),
                          (tilki, SCARF, 'Atkı', '3 yıldız'),
                          (tilki, SCARF + BAG, 'Sırt çantası', '6 yıldız'),
                          (tilki, SCARF + BAG + CROWN, 'Taç', '12 yıldız')]))
    nisan_badge, agah_badge = badge("Nisan", 400), badge("Agah", 401)
    return f"""<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Harf ve Hayvan Dostları</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{--bg:#fbf7f0;--ink:#2f2a26;--muted:#7a6f66;--card:#fffdf9;--line:#ece3d6;--accent:#d9663a}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 'DM Sans',system-ui,sans-serif}}
main{{max-width:980px;margin:0 auto;padding:40px 16px 64px}}
h1{{font:600 34px/1.15 Fraunces,serif;margin:0 0 6px}} h2{{font:600 24px Fraunces,serif;margin:44px 0 4px}}
p{{color:var(--muted);margin:0 0 18px;max-width:660px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:18px}}
.bgrid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:14px}}
figure{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:12px 12px 10px;text-align:center}}
figure.b{{border-radius:18px;padding:10px}}
.av svg{{width:100%;height:auto;border-radius:16px;display:block}} .bd svg{{width:100%;height:auto;display:block}}
figcaption{{font:600 17px Fraunces,serif;margin-top:6px}} figcaption small{{display:block;font:400 13px 'DM Sans',sans-serif;color:var(--muted)}}
.bar{{display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px}}
.chip{{display:inline-flex;align-items:center;gap:8px;padding:5px 16px 5px 5px;border-radius:999px;border:1px solid var(--line);font-weight:500}}
.chip.on{{background:var(--accent);color:#fff;border-color:var(--accent)}}
.mini svg{{width:36px;height:36px;display:block}}
.combo{{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:18px;margin-top:12px}}
.combo .av svg{{border-radius:18px}} .combo h3{{font:600 26px Fraunces,serif;margin:0}} .combo p{{margin:4px 0 0}}
@media (max-width:520px){{.combo{{grid-template-columns:100px 1fr}}}}
</style></head><body><main>
<h1>Harf rozetleri ve hayvan dostları</h1>
<p>Benzerlik beklentisi yaratmayan iki seçenek. Harf rozeti üst menüde sade bir kimlik olarak durur; hayvan dostu çocuğun kendi sayfasında okudukça süslenir.</p>

<h2>1. Harf rozetleri</h2>
<p>Ad yazılınca baş harf ve renk kendiliğinden gelir. Aynı harfle başlayan kardeşler (Ada, Aras) farklı renk alır; Ç, Ş, Ö, İ, Ü gibi harfler sorunsuz.</p>
<div class="bgrid">{badges}</div>
<h2>Üst menüde</h2>
<div class="bar"><span class="chip on"><span class="mini">{nisan_badge}</span>Nisan</span><span class="chip"><span class="mini">{agah_badge}</span>Agah</span></div>

<h2>2. Hayvan dostları</h2>
<p>Çocuk kendine bir dost seçer. Kimseye benzemesi gerekmez, çocuklar seçerken eğlenir.</p>
<div class="grid">{animals}</div>

<h2>Okudukça süslenir</h2>
<p>Kitap okudukça kazanılan yıldızlarla dostuna eşya açılır. Şu anki yıldız sistemiyle aynı mantık.</p>
<div class="grid">{dressed}</div>

<h2>İkisi birlikte: çocuğun sayfası</h2>
<div class="combo"><div class="av">{svg(tilki(SCARF + BAG), 500, "Nisan'ın tilkisi")}</div>
<div><h3>Nisan ve Tilki</h3><p>8 yaş · 14 kitap okundu · 9 yıldız</p><p>Üst menüde Nisan'ın harf rozeti, kendi sayfasında seçtiği tilki görünür.</p></div></div>
</main></body></html>"""

