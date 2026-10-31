"""Build before/after previews (docs/chart-previews) and resized .webp copies of corrected charts."""
from PIL import Image, ImageDraw, ImageFont
F = '/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyreheroscn-bold.otf'
CROPS = {
    'container_nonbulk': [(560, 240, 1000, 620)],
    'container_cargo_trucks': [(1130, 500, 1320, 850), (900, 950, 1340, 1024)],
    'container_ton': [(0, 290, 480, 360), (680, 560, 1024, 960), (0, 1080, 1024, 1510)],
    'container_intermodal': [(800, 140, 1480, 480), (760, 690, 1100, 750)],
}
PENDING = ('container_rail_cars class1_explosives class2_gases class3_flammable_liquids class4_flammable_solids '
           'class5_oxidizers class6_toxic class7_radioactive class8_corrosives class9_miscellaneous ppe_all '
           'ppe2_class2 ppe3_class3 ppe5_class5 ppe_respiratory ppe_selection').split()


def label(w, t):
    im = Image.new('RGB', (w, 40), (20, 20, 20))
    ImageDraw.Draw(im).text((12, 5), t, font=ImageFont.truetype(F, 28), fill=(255, 255, 255))
    return im


for n, boxes in CROPS.items():
    a = Image.open(f'images/{n}.png').convert('RGB')
    b = Image.open(f'images/{n}_corrected.png').convert('RGB')
    web = Image.open(f'images/{n}.webp')
    b.resize(web.size, Image.LANCZOS).save(f'images/{n}_corrected.webp', quality=86, method=6)
    w = 760; h = int(a.height * w / a.width)
    pair = Image.new('RGB', (w * 2 + 20, h + 40), (255, 255, 255))
    pair.paste(label(w, 'BEFORE (original)'), (0, 0)); pair.paste(a.resize((w, h), Image.LANCZOS), (0, 40))
    pair.paste(label(w, 'AFTER (corrected)'), (w + 20, 0)); pair.paste(b.resize((w, h), Image.LANCZOS), (w + 20, 40))
    pair.save(f'docs/chart-previews/{n}_before_after.jpg', quality=82)
    rows = []
    for bx in boxes:
        ca, cb = a.crop(bx), b.crop(bx)
        s = min(2.0, 700 / ca.width)
        ca = ca.resize((int(ca.width * s), int(ca.height * s)), Image.LANCZOS); cb = cb.resize(ca.size, Image.LANCZOS)
        r = Image.new('RGB', (ca.width * 2 + 20, ca.height), (255, 255, 255)); r.paste(ca, (0, 0)); r.paste(cb, (ca.width + 20, 0))
        rows.append(r)
    W = max(r.width for r in rows); H = sum(r.height for r in rows) + 20 * (len(rows) - 1) + 40
    z = Image.new('RGB', (W, H), (255, 255, 255)); z.paste(label(W, 'Changed areas: before (left) and after (right)'), (0, 0)); y = 40
    for r in rows:
        z.paste(r, (0, y)); y += r.height + 20
    z.save(f'docs/chart-previews/{n}_changes.jpg', quality=85)
for n in PENDING:
    a = Image.open(f'images/{n}.png').convert('RGB')
    a.resize((640, int(a.height * 640 / a.width)), Image.LANCZOS).save(f'docs/chart-previews/{n}_original.jpg', quality=78)
