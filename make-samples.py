#!/usr/bin/env python3
"""CoverCraft sample scenes: three painterly "photos" drawn procedurally with PIL.

Run once at build time:  python3 make-samples.py
Writes app/samples/sunset.jpg, app/samples/boulevard.jpg and app/samples/pier.jpg.
Every scene is original code-drawn art (gradients, silhouettes, glow and grain) —
no photographs, no borrowed assets — so the app can demo instantly, offline.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "samples")
W, H = 1200, 900


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(size, stops):
    """Vertical gradient image from [(pos0to1, (r,g,b)), ...]."""
    w, h = size
    img = Image.new("RGB", (1, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                px[0, y] = lerp(c0, c1, (t - p0) / max(1e-6, p1 - p0))
                break
        else:
            px[0, y] = stops[-1][1]
    return img.resize((w, h))


def grain(img, amount=9, seed=7):
    noise = Image.effect_noise(img.size, 14).convert("L")
    return Image.blend(img, Image.merge("RGB", (noise, noise, noise)), amount / 255 * 0.35)


def vignette(img, strength=0.42):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(120))
    black = Image.new("RGB", (w, h), (4, 2, 10))
    return Image.composite(img, Image.blend(img, black, strength), mask)


def glow(base, xy, r, color, alpha=140):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    d.ellipse([x - r, y - r, x + r, y + r], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    base.alpha_composite(layer)


def palm(d, x, y, s, color=(16, 8, 24), lean=0.35, seed=3):
    """A palm silhouette: curved trunk of stacked dots + seven fronds."""
    rnd = random.Random(seed)
    top_x, top_y = x + lean * s, y - s
    steps = 64
    for i in range(steps + 1):
        t = i / steps
        cx = x + (top_x - x) * t + math.sin(t * 2.2) * s * 0.05
        cy = y + (top_y - y) * t
        r = max(1.6, s * 0.028 * (1 - t * 0.55))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    for k in range(7):
        ang = math.pi * (0.06 + 0.88 * k / 6) + rnd.uniform(-0.06, 0.06)
        length = s * rnd.uniform(0.34, 0.5)
        pts = []
        for i in range(13):
            t = i / 12
            px = top_x + math.cos(ang) * length * t
            py = top_y - abs(math.sin(ang)) * length * t + (t * t) * s * 0.16
            pts.append((px, py))
        d.line(pts, fill=color, width=max(2, int(s * 0.022)))


def windows(d, x, y, w, h, rnd, lit=0.5):
    cols, rows = max(2, w // 16), max(3, h // 20)
    for cx in range(cols):
        for cy in range(rows):
            if rnd.random() < lit:
                c = rnd.choice([(255, 214, 130), (255, 240, 200), (140, 230, 255)])
                d.rectangle([x + 4 + cx * 16, y + 5 + cy * 20, x + 10 + cx * 16, y + 13 + cy * 20], fill=c)


# ---------------------------------------------------------------- sunset.jpg
def sunset():
    rnd = random.Random(11)
    img = vgrad((W, H), [(0.0, (24, 12, 48)), (0.3, (84, 26, 92)), (0.48, (178, 42, 99)),
                         (0.6, (255, 94, 58)), (0.66, (255, 168, 76)), (0.68, (58, 30, 84)),
                         (1.0, (14, 8, 30))]).convert("RGBA")
    horizon = 585
    glow(img, (640, 545), 300, (255, 140, 60), 120)
    d = ImageDraw.Draw(img, "RGBA")
    # sun disc with retro banding
    for i, yy in enumerate(range(430, 580, 10)):
        r = math.sqrt(max(0, 118 ** 2 - (yy + 5 - 505) ** 2))
        d.line([640 - r, yy, 640 + r, yy + 7], fill=(255, 205 + min(40, i * 3), 110, 235), width=8)
    # clouds
    for _ in range(16):
        cx, cy = rnd.randint(-80, W), rnd.randint(40, 400)
        cw, chh = rnd.randint(140, 380), rnd.randint(10, 26)
        d.ellipse([cx, cy, cx + cw, cy + chh], fill=(30, 12, 46, 110))
    # skyline silhouettes flanking the sun
    for side in (0, 1):
        bx = -10 if side == 0 else 760
        while (bx < 470) if side == 0 else (bx < W + 10):
            bw, bh = rnd.randint(46, 96), rnd.randint(90, 260)
            by = horizon - bh
            d.rectangle([bx, by, bx + bw, horizon], fill=(18, 9, 32, 255))
            windows(d, bx, by, bw, bh, rnd, 0.42)
            bx += bw + rnd.randint(2, 14)
    # sea sparkle under the sun
    for _ in range(340):
        yy = rnd.randint(horizon + 8, H - 26)
        spread = 40 + (yy - horizon) * 0.55
        xx = 640 + rnd.randint(-int(spread), int(spread))
        ln = rnd.randint(6, 42)
        d.line([xx, yy, xx + ln, yy], fill=(255, 176, 92, rnd.randint(60, 170)), width=2)
    # promenade + palms in the foreground
    d.rectangle([0, H - 92, W, H], fill=(10, 5, 20, 255))
    d.line([0, H - 92, W, H - 92], fill=(255, 120, 90, 160), width=3)
    palm(d, 120, H - 30, 330, seed=5)
    palm(d, 1095, H - 24, 380, lean=-0.3, seed=9)
    img = vignette(img.convert("RGB"))
    return grain(img)


# ------------------------------------------------------------- boulevard.jpg
def boulevard():
    rnd = random.Random(23)
    img = vgrad((W, H), [(0.0, (10, 32, 54)), (0.34, (66, 32, 84)), (0.5, (196, 62, 110)),
                         (0.58, (255, 126, 95)), (0.62, (40, 26, 52)), (1.0, (16, 12, 26))]).convert("RGBA")
    vx, vy = 600, 520  # vanishing point
    d = ImageDraw.Draw(img, "RGBA")
    # building wedges left and right
    for side in (-1, 1):
        for i in range(5):
            t0, t1 = i / 5, (i + 0.86) / 5
            x_top0 = vx + side * (30 + 560 * t0 ** 1.6)
            x_top1 = vx + side * (30 + 560 * t1 ** 1.6)
            x_bot0 = vx + side * (90 + 900 * t0 ** 1.35)
            x_bot1 = vx + side * (90 + 900 * t1 ** 1.35)
            h_top = 120 + 260 * t0
            poly = [(x_top0, vy - h_top), (x_top1, vy - (120 + 260 * t1)), (x_bot1, H), (x_bot0, H)]
            shade = (22 + i * 6, 14 + i * 3, 38 + i * 7, 255)
            d.polygon(poly, fill=shade)
            # neon sign glow on each block
            sx = (x_top0 + x_bot0) / 2 + side * 8
            sy = vy + 60 + i * 46
            neon = rnd.choice([(255, 60, 160), (40, 220, 255), (255, 170, 40), (150, 90, 255)])
            glow(img, (sx, sy), 42 + i * 8, neon, 120)
            d.rounded_rectangle([sx - 16 - i * 3, sy - 26, sx + 16 + i * 3, sy + 26], radius=6,
                                outline=neon + (255,), width=3)
    # road
    d.polygon([(vx - 26, vy), (vx + 26, vy), (W - 60, H), (60, H)], fill=(24, 20, 34, 255))
    for i in range(9):
        t = i / 9
        yy = vy + (H - vy) * t ** 1.7
        half = 4 + 300 * t ** 1.7
        d.line([vx - half * 0.16, yy, vx + half * 0.16, yy], fill=(255, 214, 120, 200), width=max(1, int(2 + 5 * t)))
    # palms marching to the vanishing point
    for i in range(6):
        t = i / 6
        s = 60 + 300 * t
        y = vy + 130 + (H - vy - 120) * t ** 1.4
        palm(d, int(vx - 120 - 380 * t ** 1.3), int(y), int(s), seed=20 + i)
        palm(d, int(vx + 130 + 380 * t ** 1.3), int(y), int(s), lean=-0.3, seed=40 + i)
    # low sports car silhouette, tail lights glowing
    cx, cy, cw = 600, 800, 330
    glow(img, (cx - 108, cy - 26), 42, (255, 40, 60), 170)
    glow(img, (cx + 108, cy - 26), 42, (255, 40, 60), 170)
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle([cx - cw / 2, cy - 58, cx + cw / 2, cy + 26], radius=22, fill=(12, 10, 20, 255))
    d.polygon([(cx - 108, cy - 56), (cx - 66, cy - 96), (cx + 74, cy - 96), (cx + 112, cy - 56)], fill=(14, 11, 24, 255))
    d.rectangle([cx - 128, cy - 38, cx - 84, cy - 24], fill=(255, 70, 80, 255))
    d.rectangle([cx + 84, cy - 38, cx + 128, cy - 24], fill=(255, 70, 80, 255))
    d.rectangle([cx - 60, cy + 8, cx + 60, cy + 16], fill=(200, 210, 220, 160))
    img = vignette(img.convert("RGB"), 0.38)
    return grain(img)


# ------------------------------------------------------------------ pier.jpg
def pier():
    rnd = random.Random(37)
    img = vgrad((W, H), [(0.0, (38, 22, 66)), (0.3, (146, 52, 84)), (0.48, (232, 96, 52)),
                         (0.56, (255, 190, 92)), (0.6, (44, 40, 84)), (1.0, (16, 18, 44))]).convert("RGBA")
    horizon = 520
    glow(img, (880, 470), 260, (255, 150, 70), 120)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([800, 396, 960, 540], fill=(255, 208, 120, 255))
    # ocean light streaks
    for _ in range(260):
        yy = rnd.randint(horizon + 6, H - 16)
        xx = rnd.randint(0, W)
        ln = rnd.randint(8, 60)
        warm = rnd.random() < 0.4
        d.line([xx, yy, xx + ln, yy], fill=(255, 190, 110, 120) if warm else (120, 160, 220, 70), width=2)
    # ferris wheel silhouette at the pier end
    wx, wy, wr = 300, 400, 148
    d.ellipse([wx - wr, wy - wr, wx + wr, wy + wr], outline=(20, 12, 30, 255), width=9)
    d.ellipse([wx - wr + 22, wy - wr + 22, wx + wr - 22, wy + wr - 22], outline=(20, 12, 30, 255), width=4)
    for k in range(8):
        a = k * math.pi / 4
        x2, y2 = wx + math.cos(a) * wr, wy + math.sin(a) * wr
        d.line([wx, wy, x2, y2], fill=(20, 12, 30, 255), width=4)
        d.ellipse([x2 - 9, y2 - 7, x2 + 9, y2 + 9], fill=(24, 14, 34, 255))
        glow(img, (x2, y2), 13, (255, 120, 170), 130)
    d.polygon([(wx - 12, wy), (wx - 66, horizon + 30), (wx - 30, horizon + 30)], fill=(20, 12, 30, 255))
    d.polygon([(wx + 12, wy), (wx + 66, horizon + 30), (wx + 30, horizon + 30)], fill=(20, 12, 30, 255))
    # pier deck from bottom-left to the wheel
    d = ImageDraw.Draw(img, "RGBA")
    d.polygon([(0, H), (470, horizon + 26), (560, horizon + 26), (330, H)], fill=(38, 24, 30, 255))
    for i in range(11):
        t = i / 10
        y0 = horizon + 26 + (H - horizon - 26) * t
        x0 = 470 - 470 * t ** 0.8
        x1 = 560 - 230 * t ** 0.8
        d.line([x0, y0, x1, y0], fill=(16, 10, 16, 200), width=3)
    d.line([470, horizon + 26, 0, H], fill=(12, 8, 14, 255), width=7)
    d.line([560, horizon + 26, 330, H], fill=(12, 8, 14, 255), width=7)
    # lamp posts with warm glow
    for i, t in enumerate((0.12, 0.42, 0.74)):
        lx = 505 - 300 * t
        ly = horizon + 20 + (H - horizon) * t
        lh = 120 - 60 * t
        d.line([lx, ly, lx, ly - lh], fill=(10, 8, 12, 255), width=5)
        glow(img, (lx, ly - lh), 26, (255, 190, 100), 170)
        d = ImageDraw.Draw(img, "RGBA")
        d.ellipse([lx - 6, ly - lh - 6, lx + 6, ly - lh + 6], fill=(255, 220, 150, 255))
    # gulls
    for _ in range(9):
        gx, gy, gs = rnd.randint(80, W - 120), rnd.randint(50, 300), rnd.randint(7, 14)
        d.arc([gx - gs, gy - gs // 2, gx, gy + gs // 2], 200, 320, fill=(24, 14, 30, 220), width=3)
        d.arc([gx, gy - gs // 2, gx + gs, gy + gs // 2], 220, 340, fill=(24, 14, 30, 220), width=3)
    img = vignette(img.convert("RGB"), 0.4)
    return grain(img)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in (("sunset", sunset), ("boulevard", boulevard), ("pier", pier)):
        path = os.path.join(OUT, name + ".jpg")
        fn().save(path, quality=86)
        print(path, os.path.getsize(path), "bytes")
