import { serverRpc } from './supabase'
type Cfg = { config: { enabled?: boolean; mode?: 'site' | 'n8n' }; secrets: Record<string, string> }
export async function botSettings() { const { data } = await serverRpc<Cfg>('bot_config', {}); return data?.config ?? {} }
