// Generates luxury placeholder images (WebP) in the "night & copper" palette. Replace with real photos later.
import sharp from 'sharp'
import fs from 'node:fs'

const palettes = {
  'wajh-farsha': ['#3b2a1c', '#b08a55'], pillows: ['#2e3a2f', '#c8a36a'], sheets: ['#2a2420', '#d9c7a3'],
  curtains: ['#3a1f1f', '#c8a36a'], 'foam-mattresses': ['#1f2a33', '#a89c8a'], 'arabic-sofa': ['#4a2c1a', '#e6c48e'],
  'arabic-majlis': ['#2e3a2f', '#e6c48e'], batana: ['#33271d', '#b08a55'],
}
const pattern = {
  'wajh-farsha': 'quilt', pillows: 'damask', sheets: 'weave', curtains: 'stripes',
  'foam-mattresses': 'weave', 'arabic-sofa': 'quilt', 'arabic-majlis': 'damask', batana: 'weave',
}
function svg(w, h, [a, b], kind, seed) {
  const rot = (seed * 37) % 360
  const pats = {
    weave: `<pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0H8M0 4H8" stroke="${b}" stroke-opacity=".10"/><path d="M0 0V8M4 0V8" stroke="${b}" stroke-opacity=".07"/></pattern>`,
    stripes: `<pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="22" height="46" fill="${b}" fill-opacity=".10"/><rect x="22" width="2" height="46" fill="${b}" fill-opacity=".25"/></pattern>`,
    quilt: `<pattern id="p" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M35 0L70 35L35 70L0 35Z" fill="none" stroke="${b}" stroke-opacity=".22" stroke-width="1.5"/><circle cx="35" cy="35" r="3" fill="${b}" fill-opacity=".3"/></pattern>`,
    damask: `<pattern id="p" width="90" height="120" patternUnits="userSpaceOnUse"><path d="M45 8C70 30 70 60 45 80C20 60 20 30 45 8Z" fill="${b}" fill-opacity=".12" stroke="${b}" stroke-opacity=".25"/><circle cx="45" cy="100" r="6" fill="${b}" fill-opacity=".18"/></pattern>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" gradientTransform="rotate(${rot % 90 + 20})"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="#0E0B09"/></linearGradient>
  <radialGradient id="l" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="${b}" stop-opacity=".45"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
  <radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>${pats[kind]}</defs>
  <rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>
  <rect width="100%" height="100%" fill="url(#l)"/><rect width="100%" height="100%" fill="url(#v)"/></svg>`
}
async function out(file, w, h, pal, kind, seed) {
  await sharp(Buffer.from(svg(w, h, pal, kind, seed))).webp({ quality: 62 }).toFile(file)
}
const sql = fs.readFileSync('supabase/migrations/0003_seed.sql', 'utf8')
const rows = [...sql.matchAll(/\('([a-z0-9-]+)','[^']+','([a-z-]+)',/g)].map((m) => ({ slug: m[1], cat: m[2] }))
let i = 0
for (const [cat, pal] of Object.entries(palettes)) await out(`public/img/c/${cat}.webp`, 800, 1000, pal, pattern[cat], i++)
for (const r of rows) if (palettes[r.cat] && !r.slug.includes(' ')) await out(`public/img/p/${r.slug}.webp`, 900, 900, palettes[r.cat], pattern[r.cat], i++)
await out('public/img/h/hero.webp', 1600, 1000, ['#4a2c1a', '#e6c48e'], 'weave', 3)
await out('public/img/h/hero-m.webp', 800, 1200, ['#4a2c1a', '#e6c48e'], 'weave', 3)
await out('public/img/h/custom.webp', 1200, 900, ['#2e3a2f', '#e6c48e'], 'stripes', 5)
await sharp(Buffer.from(svg(1200, 630, ['#4a2c1a', '#e6c48e'], 'quilt', 9))).jpeg({ quality: 70 }).toFile('public/img/og.jpg')
console.log('generated', rows.length, 'products')
