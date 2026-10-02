# Okul ve Zor Konular eşyaları için yeni seçenekler.
from hayvanlar import svg, W, tilki, ayi

GLASSES = ('<g filter="url(#pencil)"><g fill="#fff" fill-opacity=".25" stroke="#3d5a80" stroke-width="3.2">'
           '<circle cx="80" cy="102" r="14"/><circle cx="120" cy="102" r="14"/></g>'
           '<path d="M94 100 Q100 95 106 100" stroke="#3d5a80" stroke-width="3" fill="none"/>'
           '<path d="M66 99 L52 94" stroke="#3d5a80" stroke-width="3"/><path d="M134 99 L148 94" stroke="#3d5a80" stroke-width="3"/></g>')

CAP = (W('<path d="M100 22 L156 40 L100 58 L44 40 Z" fill="#2f3a4a"/><path d="M70 49 L70 62 C82 70 118 70 130 62 L130 49 L100 58 Z" fill="#3b4859"/>', .97)
       + '<g filter="url(#pencil)"><path d="M100 40 L146 48 L146 74" stroke="#f0c341" stroke-width="2.6" fill="none"/>'
       + '<path d="M141 74 L151 74 L149 88 L143 88 Z" fill="#f0c341"/><circle cx="100" cy="40" r="3.5" fill="#f0c341"/></g>')

UMBRELLA = (W('<path d="M20 70 C24 34 60 14 100 14 C140 14 176 34 180 70 C168 62 156 62 146 70 C136 62 122 62 112 70 '
              'C100 62 86 62 76 70 C66 62 52 62 42 70 C34 62 26 62 20 70 Z" fill="#4f9fb5"/>', .93)
            + W('<path d="M60 64 C64 40 80 22 100 16 C88 30 82 46 82 66 Z" fill="#7cc0cf"/><path d="M140 64 C136 40 120 22 100 16 C112 30 118 46 118 66 Z" fill="#7cc0cf"/>', .7)
            + '<g filter="url(#pencil)"><path d="M100 14 L100 8" stroke="#5a4a3a" stroke-width="3" stroke-linecap="round"/>'
            + '<path d="M100 66 L100 70 M150 64 L164 176 Q166 190 154 190 Q146 189 147 181" stroke="#5a4a3a" stroke-width="4" fill="none" stroke-linecap="round"/></g>'
            + '<g filter="url(#soft)" opacity=".5" fill="#9fd0e0"><ellipse cx="30" cy="110" rx="2" ry="5"/><ellipse cx="22" cy="140" rx="2" ry="5"/><ellipse cx="184" cy="100" rx="2" ry="5"/></g>')

JAR = (W('<rect x="140" y="124" width="40" height="54" rx="12" fill="#e9f2ea" fill-opacity=".85" stroke="#9db8a6" stroke-width="2"/>'
         '<rect x="144" y="114" width="32" height="12" rx="3" fill="#b88a5a"/>', .95)
       + '<g filter="url(#soft)" opacity=".75"><circle cx="160" cy="152" r="18" fill="#fff3a6"/></g>'
       + '<g filter="url(#pencil)" fill="#f2c94c"><circle cx="152" cy="146" r="3.4"/><circle cx="166" cy="140" r="3"/>'
       + '<circle cx="162" cy="160" r="3.6"/><circle cx="170" cy="154" r="2.6"/><circle cx="150" cy="164" r="2.4"/></g>'
       + '<g filter="url(#pencil)" fill="#f6e27a" opacity=".9"><circle cx="128" cy="118" r="2.4"/><circle cx="186" cy="110" r="2"/></g>')

OPTS = [
    ("Okul", "Bilge gözlüğü", "Okumayı, düşünmeyi simgeler; yüzde hemen fark edilir.", tilki(GLASSES)),
    ("Okul", "Mezuniyet kepi", "Okulun en tanıdık simgesi; püskülüyle eğlenceli.", tilki(CAP)),
    ("Zor Konular", "Şemsiye", "Zor günlerde insanı korur, yağmur geçer.", ayi(UMBRELLA)),
    ("Zor Konular", "Ateş böceği kavanozu", "Karanlıkta yolunu aydınlatan küçük ışıklar.", tilki(JAR)),
]

cards = ''.join(f'<figure><div class="av">{svg(body, 700+i, name)}</div><figcaption><span class="tag">{g}</span>{name}<small>{why}</small></figcaption></figure>'
                for i, (g, name, why, body) in enumerate(OPTS))
html = f"""<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yeni Eşya Seçenekleri</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{--bg:#fbf7f0;--ink:#2f2a26;--muted:#7a6f66;--card:#fffdf9;--line:#ece3d6}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 'DM Sans',system-ui,sans-serif}}
main{{max-width:900px;margin:0 auto;padding:40px 16px 56px}} h1{{font:600 30px Fraunces,serif;margin:0 0 6px}} p{{color:var(--muted);margin:0 0 22px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px}}
figure{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:12px;text-align:center}}
.av svg{{width:100%;height:auto;border-radius:16px;display:block}}
figcaption{{font:600 18px Fraunces,serif;margin-top:8px}} figcaption small{{display:block;font:400 13px/1.4 'DM Sans',sans-serif;color:var(--muted);margin-top:4px}}
.tag{{display:block;font:500 12px 'DM Sans',sans-serif;color:#b0532c;letter-spacing:.04em;text-transform:uppercase;margin-bottom:2px}}
</style></head><body><main><h1>Okul ve Zor Konular için yeni eşyalar</h1>
<p>Her rehber için iki seçenek. Beğendiğini seç, diğerini çıkarırım.</p><div class="grid">{cards}</div></main></body></html>"""
