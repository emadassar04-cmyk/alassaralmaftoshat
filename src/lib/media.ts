/**
 * Art-direction manifest for editorial imagery. Every image here is currently a placeholder fabric texture
 * (`real: false`). To use real photography: drop the photo at the same path (WebP/JPG, ≥1600px wide;
 * branches 16:10 or 4:3) and set `real: true` — the "illustrative" label then disappears automatically.
 */
export type Media = { src: string; real: boolean; alt: string }

export const MEDIA = {
  hero: { src: '/img/h/hero.webp', real: false, alt: 'أقمشة ستائر بطيّات ناعمة وإضاءة دافئة' },
  heroMobile: { src: '/img/h/hero-m.webp', real: false, alt: 'أقمشة ستائر بطيّات ناعمة' },
  custom: { src: '/img/h/custom.webp', real: false, alt: 'قماش ستائر مفصّل على المقاس' },
  story: { src: '/img/h/story.webp', real: false, alt: 'نقشة قماش عربية' },
} satisfies Record<string, Media>

const BRANCH: Record<string, Media> = {
  'deir-al-balah': { src: '/img/b/deir-al-balah.webp', real: false, alt: 'فرع دير البلح' },
  nuseirat: { src: '/img/b/nuseirat.webp', real: false, alt: 'فرع النصيرات' },
}
export const branchMedia = (slug: string): Media => BRANCH[slug] ?? { src: '/img/b/deir-al-balah.webp', real: false, alt: '' }
