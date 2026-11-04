export type Social = { facebook?: string; instagram?: string; tiktok?: string; youtube?: string }
const P: Record<keyof Social, string> = {
  facebook: 'M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z',
  instagram: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4.2c2.5 0 2.8 0 3.8.1 2.6.1 3.8 1.4 3.9 3.9.1 1 .1 1.3.1 3.8s0 2.8-.1 3.8c-.1 2.5-1.3 3.8-3.9 3.9-1 .1-1.3.1-3.8.1s-2.8 0-3.8-.1c-2.6-.1-3.8-1.4-3.9-3.9-.1-1-.1-1.3-.1-3.8s0-2.8.1-3.8C4.4 5.7 5.6 4.4 8.2 4.3c1-.1 1.3-.1 3.8-.1Z',
  tiktok: 'M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z',
  youtube: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
}
export const SOCIAL_NAME: Record<keyof Social, string> = { facebook: 'فيسبوك', instagram: 'إنستغرام', tiktok: 'تيك توك', youtube: 'يوتيوب' }
export const socialLinks = (s: Social) => (Object.keys(P) as (keyof Social)[]).filter((k) => s[k] && /^https:\/\//.test(s[k]!)).map((k) => ({ key: k, url: s[k]!, name: SOCIAL_NAME[k] }))
export function SocialIcon({ k, size = 18 }: { k: keyof Social; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={P[k]} /></svg>
}
