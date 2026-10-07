"""Generates the Android launcher icons: an HSRP plate inside yellow viewfinder corners.

Run from the project root: python3 scripts/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASPHALT = '#1E2328'
MARKING = '#F2C230'
PLATE = '#F7F7F2'
INK = '#111316'
IND_BLUE = '#1F4AA8'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'

RES = Path('android/app/src/main/res')
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
S = 1080  # master canvas for one 108dp adaptive layer; 10 px per dp
ART_SCALE = 0.78


def foreground() -> Image.Image:
    """Artwork kept inside the 66dp adaptive-icon safe zone (centre 660 px)."""
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2

    # Viewfinder corners.
    half, arm, w = 300, 110, 34
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = c + sx * half, c + sy * half
            d.line([(x, y - sy * arm), (x, y), (x - sx * arm, y)], fill=MARKING, width=w, joint='curve')

    # Plate.
    pw, ph = 540, 210
    box = (c - pw / 2, c - ph / 2, c + pw / 2, c + ph / 2)
    d.rounded_rectangle(box, radius=24, fill=PLATE, outline=INK, width=16)
    strip = (box[0] + 16, box[1] + 16, box[0] + 86, box[3] - 16)
    d.rounded_rectangle(strip, radius=8, fill=IND_BLUE)
    font = ImageFont.truetype(FONT, 150)
    text = 'ANPR'
    tw = d.textlength(text, font=font)
    text_cx = (strip[2] + box[2]) / 2
    d.text((text_cx - tw / 2, c), text, font=font, fill=INK, anchor='lm')

    # Some launchers (e.g. ColorOS) crop well inside the 66dp safe zone, so shrink the artwork
    # until the viewfinder corners survive their mask.
    art = img.resize((round(S * ART_SCALE),) * 2, Image.LANCZOS)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    offset = (S - art.width) // 2
    out.alpha_composite(art, (offset, offset))
    return out


def legacy(fg: Image.Image, round_icon: bool) -> Image.Image:
    """Pre-Android 8 icon: the artwork on an asphalt tile, cropped to the visible 72dp."""
    tile = Image.new('RGBA', (S, S), ASPHALT)
    tile.alpha_composite(fg)
    inset = (S - 720) // 2
    tile = tile.crop((inset, inset, S - inset, S - inset))
    mask = Image.new('L', tile.size, 0)
    md = ImageDraw.Draw(mask)
    if round_icon:
        md.ellipse((0, 0, *tile.size), fill=255)
    else:
        md.rounded_rectangle((0, 0, *tile.size), radius=130, fill=255)
    out = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    out.paste(tile, mask=mask)
    return out


def main() -> None:
    fg = foreground()
    square, circle = legacy(fg, False), legacy(fg, True)
    for name, scale in DENSITIES.items():
        folder = RES / f'mipmap-{name}'
        fg.resize((round(108 * scale),) * 2, Image.LANCZOS).save(folder / 'ic_launcher_foreground.png')
        square.resize((round(48 * scale),) * 2, Image.LANCZOS).save(folder / 'ic_launcher.png')
        circle.resize((round(48 * scale),) * 2, Image.LANCZOS).save(folder / 'ic_launcher_round.png')


if __name__ == '__main__':
    main()
