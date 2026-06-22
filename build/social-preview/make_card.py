#!/usr/bin/env python3
"""Compose a 1280x640 GitHub social-preview card for Claude Code Chat."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1280, 640
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ICON = os.path.join(ROOT, "icon.png")
OUT = os.path.join(ROOT, "social-preview.png")

# ---------- sample brand coral from the icon ----------
icon = Image.open(ICON).convert("RGBA")
rs = gs = bs = n = 0
for r, g, b, a in icon.getdata():
    if a < 200:
        continue
    mx, mn = max(r, g, b), min(r, g, b)
    if (mx - mn) < 45 or mx < 90:   # skip near-white/grey/dark
        continue
    rs += r; gs += g; bs += b; n += 1
coral = (rs // n, gs // n, bs // n) if n else (217, 119, 87)
CR, CG, CB = coral
print("sampled coral:", coral)

def mix(c1, c2, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))

# ---------- fonts ----------
def find_face(ttc_paths, style_kw, size):
    for p in ttc_paths:
        if not os.path.exists(p):
            continue
        for idx in range(0, 18):
            try:
                f = ImageFont.truetype(p, size, index=idx)
            except Exception:
                break
            try:
                fam, sty = f.getname()
            except Exception:
                sty = ""
            if style_kw.lower() in (sty or "").lower():
                return f
    return None

def font(style, size):
    # style in {"bold","medium","regular"}
    ttc = ["/System/Library/Fonts/HelveticaNeue.ttc",
           "/System/Library/Fonts/Avenir Next.ttc"]
    f = find_face(ttc, style, size)
    if f:
        return f
    fallback = {
        "bold": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "medium": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "regular": "/System/Library/Fonts/Supplemental/Arial.ttf",
    }[style]
    return ImageFont.truetype(fallback, size)

f_tag = font("regular", 37)
f_kick = font("bold", 27)
f_foot = font("medium", 26)

# ---------- background: warm dark vertical gradient ----------
top = mix((0, 0, 0), coral, 0.06)        # near-black, faintly warm
top = mix(top, (20, 16, 14), 0.6)
bot = mix((0, 0, 0), coral, 0.13)
bot = mix(bot, (28, 20, 16), 0.7)
bg = Image.new("RGB", (W, H))
bd = bg.load()
for y in range(H):
    t = y / (H - 1)
    c = mix(top, bot, t)
    for x in range(W):
        bd[x, y] = c
card = bg.convert("RGBA")

# ---------- soft coral glow behind the icon (left third) ----------
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gcx, gcy, gr = 360, 320, 300
gd.ellipse([gcx - gr, gcy - gr, gcx + gr, gcy + gr], fill=(CR, CG, CB, 90))
glow = glow.filter(ImageFilter.GaussianBlur(120))
card = Image.alpha_composite(card, glow)

draw = ImageDraw.Draw(card)

# ---------- icon with soft drop shadow ----------
TARGET = 380
ic = icon.copy()
ic.thumbnail((TARGET, TARGET), Image.LANCZOS)
iw, ih = ic.size
ix, iy = 95, (H - ih) // 2
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sh = Image.new("RGBA", ic.size, (0, 0, 0, 0))
sh.paste((0, 0, 0, 150), (0, 0), ic.split()[3])
shadow.paste(sh, (ix + 6, iy + 14), sh)
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
card = Image.alpha_composite(card, shadow)
card.paste(ic, (ix, iy), ic)
draw = ImageDraw.Draw(card)

# ---------- text column ----------
tx = ix + iw + 64
maxw = W - tx - 70
warm_grey = mix((255, 255, 255), coral, 0.18)
warm_grey = mix(warm_grey, (170, 165, 160), 0.55)

# kicker (letter-spaced)
kick = "VS CODE EXTENSION"
kx = tx + 4
ky = 150
for ch in kick:
    draw.text((kx, ky), ch, font=f_kick, fill=(CR, CG, CB, 255))
    kx += draw.textlength(ch, font=f_kick) + 6
# accent rule under kicker
draw.rounded_rectangle([tx + 4, ky + 46, tx + 4 + 70, ky + 50], radius=2, fill=(CR, CG, CB, 255))

# title (auto-fit to available width)
title = "Claude Code Chat"
ts = 96
while ts > 56:
    f_title = font("bold", ts)
    if draw.textlength(title, font=f_title) <= maxw:
        break
    ts -= 2
ty = ky + 70
tb = draw.textbbox((tx, ty), title, font=f_title)
draw.text((tx, ty), title, font=f_title, fill=(245, 243, 241, 255))

# tagline (word-wrapped)
tagline = "Beautiful Claude Code chat interface for VS Code"
words, line, lines = tagline.split(), "", []
for w in words:
    test = (line + " " + w).strip()
    if draw.textlength(test, font=f_tag) <= maxw:
        line = test
    else:
        lines.append(line); line = w
if line:
    lines.append(line)
gy = tb[3] + 34
for ln in lines:
    draw.text((tx, gy), ln, font=f_tag, fill=warm_grey)
    gy += 50

# footer mark
draw.text((tx, H - 92), "github.com/andrepimenta/claude-code-chat",
          font=f_foot, fill=mix(warm_grey, (120, 116, 112), 0.5))

# ---------- save ----------
card.convert("RGB").save(OUT, "PNG", optimize=True)
sz = os.path.getsize(OUT)
print(f"wrote {OUT}  ({W}x{H}, {sz/1024:.0f} KB)")
