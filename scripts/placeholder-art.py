# Procedural fabric "art direction" placeholders in the Al-Assar ivory/champagne/brown palette.
# They are honest textures (no fake photos of products or branches) until real photography arrives.
import numpy as np, sys, os
from PIL import Image, ImageFilter
OUT = sys.argv[1]
rng = np.random.default_rng(1996)

def smooth_noise(h, w, scale, seed):
    r = np.random.default_rng(seed)
    gh, gw = max(2, h // scale + 2), max(2, w // scale + 2)
    g = r.random((gh, gw)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255

def grain(h, w, seed, amt=.035):
    return (np.random.default_rng(seed).random((h, w)).astype(np.float32) - .5) * amt

def weave(h, w, seed, period=3.0, amt=.05):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    n = smooth_noise(h, w, 40, seed) * 2
    return (np.sin(x / period * np.pi + n) * np.sin(y / period * np.pi) ) * amt

def light(h, w, cx, cy, rad, power=1.0):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x / w - cx) * 1.3) ** 2 + (y / h - cy) ** 2) / rad
    return np.clip(1 - d, 0, 1) ** power

def colorize(L, dark, mid, lite):
    L = np.clip(L, 0, 1)[..., None]
    dark, mid, lite = (np.array(c, np.float32) for c in (dark, mid, lite))
    a = np.clip(L * 2, 0, 1); b = np.clip(L * 2 - 1, 0, 1)
    c = np.where(L < .5, dark + (mid - dark) * a, mid + (lite - mid) * b)
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))

hex2 = lambda s: tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
PAL = {
    'ivory':  (hex2('#8C6E52'), hex2('#E4D7C4'), hex2('#FBF8F2')),
    'sand':   (hex2('#6F5038'), hex2('#CDB89A'), hex2('#F4ECDF')),
    'brown':  (hex2('#3A2A1C'), hex2('#8A6747'), hex2('#E6CFAE')),
    'olive':  (hex2('#3F4436'), hex2('#9A9A84'), hex2('#EEEADD')),
    'rose':   (hex2('#7A5A4E'), hex2('#D9C2B4'), hex2('#FAF3EC')),
}

def drapes(h, w, seed, folds=14):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    n = smooth_noise(h, w, 220, seed)
    ph = x / w * folds * 2 * np.pi + n * 3 + (y / h) * 0.8
    f = 0.5 + 0.5 * np.sin(ph) ** 3 * 0.6 + 0.25 * np.sin(ph * 2.1 + 1)
    return f

def quilt(h, w, seed, cell=110):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (x + y) / cell; v = (x - y) / cell
    du = np.abs(u - np.round(u)); dv = np.abs(v - np.round(v))
    d = np.minimum(du, dv) * 2  # 0 on seams
    puff = np.sqrt(np.clip(d, 0, 1))
    stitch = (np.sin((x + y) * 0.9) > 0.3) & (d < .05)
    return puff * 0.85 + 0.1 - stitch * 0.15

def satin(h, w, seed):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    n = smooth_noise(h, w, 300, seed)
    s = np.sin((x * .6 + y) / h * 7 + n * 4)
    return 0.55 + 0.35 * s ** 5 + 0.15 * s

def tufts(h, w, seed, cell=150):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    gx = (x % cell) / cell - .5; gy = ((y + (x // cell % 2) * cell / 2) % cell) / cell - .5
    r = np.sqrt(gx ** 2 + gy ** 2)
    return np.clip(1 - r * 1.6, 0, 1) ** .6 * .75 + .2

def foam(h, w, seed):
    a = smooth_noise(h, w, 6, seed); b = smooth_noise(h, w, 14, seed + 1)
    cells = np.abs(a - b) * 2.5
    return 0.55 + np.clip(cells, 0, 1) * .4

def arabesque(h, w, seed, cell=120):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (x % cell) / cell - .5; v = (y % cell) / cell - .5
    star = np.maximum(np.abs(u) + np.abs(v), np.maximum(np.abs(u), np.abs(v)) * 1.41)
    line = np.exp(-((star - .42) / .02) ** 2) + np.exp(-((np.maximum(np.abs(u), np.abs(v)) - .28) / .015) ** 2) * .6
    return 0.62 - line * .28

def stripes(h, w, seed, step=46):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.abs(((y % step) / step) - .5) * 2
    stitch = (np.sin(x * 1.2) > .4) & (d > .93)
    return 0.45 + np.sqrt(1 - d) * .45 - stitch * .12

KIND = {'drapes': drapes, 'quilt': quilt, 'satin': satin, 'tufts': tufts, 'foam': foam, 'arabesque': arabesque, 'stripes': stripes}

def make(name, kind, pal, w, h, seed, lx=.25, ly=.2, vign=.55, blur=0.6):
    L = KIND[kind](h, w, seed)
    L = L * (0.55 + 0.6 * light(h, w, lx, ly, 1.25, 1.2)) + weave(h, w, seed) + grain(h, w, seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    vg = 1 - vign * (((x / w - .5) ** 2 + (y / h - .5) ** 2) * 1.6)
    L = (L * vg)
    L = (L - L.min()) / (np.ptp(L) + 1e-6) * .92 + .06
    im = colorize(L, *PAL[pal]).filter(ImageFilter.GaussianBlur(blur))
    os.makedirs(os.path.dirname(f'{OUT}/{name}'), exist_ok=True)
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=80, method=6)

# hero + editorial
make('h/hero', 'drapes', 'ivory', 2000, 1250, 1, lx=.3, ly=.15)
make('h/hero-m', 'drapes', 'ivory', 900, 1300, 2, lx=.3, ly=.1)
make('h/custom', 'drapes', 'sand', 1400, 1050, 3, lx=.7, ly=.2)
make('h/story', 'arabesque', 'sand', 1200, 1500, 4)
make('b/deir-al-balah', 'tufts', 'sand', 1600, 1000, 5, lx=.3)
make('b/nuseirat', 'arabesque', 'ivory', 1600, 1000, 6, lx=.7)
# categories (4:5)
cats = {'wajh-farsha': ('quilt', 'ivory'), 'pillows': ('tufts', 'rose'), 'sheets': ('satin', 'ivory'), 'curtains': ('drapes', 'sand'),
        'foam-mattresses': ('foam', 'ivory'), 'arabic-sofa': ('arabesque', 'brown'), 'arabic-majlis': ('arabesque', 'olive'), 'batana': ('stripes', 'sand')}
for i, (s, (k, p)) in enumerate(cats.items()):
    make(f'c/{s}', k, p, 900, 1125, 10 + i)
prods = {'wajh-farsha-qutn-malaki': ('quilt', 'ivory'), 'wajh-farsha-satan-mutarraz': ('quilt', 'sand'), 'makhadda-reesh-fakhira': ('tufts', 'ivory'),
         'makhadda-tibbiyya': ('tufts', 'olive'), 'taqm-makhaddat-zeena-makhmal': ('tufts', 'brown'), 'sharshaf-qutn-misri': ('satin', 'ivory'),
         'sharshaf-satan-harir': ('satin', 'rose'), 'sharshaf-battaniyya-shatwi': ('stripes', 'brown'), 'farsha-isfenj-tibbi-10': ('foam', 'ivory'),
         'farsha-isfenj-kathafa-15': ('foam', 'sand'), 'farsha-isfenj-atfal': ('foam', 'rose'), 'kanab-arabi-modern-malaki': ('arabesque', 'brown'),
         'kanab-arabi-bayt-kabeer': ('arabesque', 'sand'), 'misnad-arabi-munfarid': ('tufts', 'sand'), 'sataer-mufassala-makhmal': ('drapes', 'brown'),
         'sataer-mufassala-shifon': ('drapes', 'ivory'), 'farsh-arabi-mufassal': ('arabesque', 'olive'), 'batana-mufassala': ('stripes', 'ivory')}
for i, (s, (k, p)) in enumerate(prods.items()):
    make(f'p/{s}', k, p, 1000, 1000, 40 + i)
print('ok')
