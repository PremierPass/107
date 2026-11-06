"""Helpers for replacing text regions on the raster charts.

Each edit paints a box with a background color sampled from the box's own
border (so gradients and panel tints are matched), then draws new text in a
condensed sans (TeX Gyre Heros Cn) close to the posters' original type.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import statistics

FONT_DIR = '/usr/share/texmf/fonts/opentype/public/tex-gyre/'
FONTS = {'bold': FONT_DIR + 'texgyreheroscn-bold.otf', 'reg': FONT_DIR + 'texgyreheroscn-regular.otf'}


def font(style, size):
    return ImageFont.truetype(FONTS[style], size)


def border_color(im, box, pad=2):
    """Median color along a ring just inside the box edges."""
    x0, y0, x1, y1 = box
    px = []
    for x in range(x0, x1, 2):
        px.append(im.getpixel((x, y0 + pad)))
        px.append(im.getpixel((x, y1 - pad)))
    for y in range(y0, y1, 2):
        px.append(im.getpixel((x0 + pad, y)))
        px.append(im.getpixel((x1 - pad, y)))
    return tuple(int(statistics.median(c[i] for c in px)) for i in range(3))


def fill(im, box, color=None):
    color = color or border_color(im, box)
    ImageDraw.Draw(im).rectangle(box, fill=color)
    return color


def text_block(im, box, lines, style='reg', size=16, color=(20, 20, 20), align='center',
               spacing=None, valign='middle', bg=None, fill_box=True):
    """lines: list of str or (str, style, size, color) tuples."""
    if fill_box:
        fill(im, box, bg)
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = box
    rows = []
    for ln in lines:
        if isinstance(ln, str):
            ln = (ln, style, size, color)
        t, st, sz, col = ln
        f = font(st, sz)
        bb = d.textbbox((0, 0), t, font=f)
        rows.append((t, f, col, bb[2] - bb[0], sz))
    gap = spacing if spacing is not None else 0.28
    heights = [int(r[4] * (1 + gap)) for r in rows]
    total = sum(heights)
    y = y0 + (y1 - y0 - total) // 2 if valign == 'middle' else y0
    for (t, f, col, w, sz), h in zip(rows, heights):
        if align == 'center':
            x = x0 + (x1 - x0 - w) // 2
        elif align == 'left':
            x = x0
        else:
            x = x1 - w
        d.text((x, y), t, font=f, fill=col)
        y += h
    return im


def fit_check(lines, width, style='reg', size=16):
    """Return the widest rendered line width, to confirm text fits a box."""
    d = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    out = 0
    for ln in lines:
        t, st, sz = (ln, style, size) if isinstance(ln, str) else ln[:3]
        bb = d.textbbox((0, 0), t, font=font(st, sz))
        out = max(out, bb[2] - bb[0])
    return out <= width, out


def inpaint(im, box, thr, dark_text=True, grow=3, radius=5):
    """Remove text inside box by masking text pixels and inpainting (keeps texture/gradients)."""
    import numpy as np, cv2
    a = np.array(im)
    x0, y0, x1, y1 = box
    sub = cv2.cvtColor(a[y0:y1, x0:x1], cv2.COLOR_RGB2GRAY)
    m = (sub < thr) if dark_text else (sub > thr)
    mask = np.zeros(a.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = m.astype(np.uint8) * 255
    if grow:
        mask = cv2.dilate(mask, np.ones((grow * 2 + 1, grow * 2 + 1), np.uint8))
        mask[:y0, :] = 0; mask[y1:, :] = 0; mask[:, :x0] = 0; mask[:, x1:] = 0
    out = cv2.inpaint(a, mask, radius, cv2.INPAINT_TELEA)
    im.paste(Image.fromarray(out))
    return im


def draw_lines(im, box, lines, style='bold', size=16, color=(20, 20, 20), align='left', spacing=0.25, valign='middle'):
    return text_block(im, box, lines, style, size, color, align, spacing, valign, fill_box=False)


def inpaint_rect(im, box, radius=7):
    """Inpaint an entire rectangle from its surroundings (for removing graphics on plain backgrounds)."""
    import numpy as np, cv2
    a = np.array(im)
    mask = np.zeros(a.shape[:2], np.uint8)
    x0, y0, x1, y1 = box
    mask[y0:y1, x0:x1] = 255
    im.paste(Image.fromarray(cv2.inpaint(a, mask, radius, cv2.INPAINT_TELEA)))
    return im
