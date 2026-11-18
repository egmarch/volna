// Прокси заявок: сайт -> этот Worker -> Telegram.
// Токен бота и chat id хранятся в секретах Cloudflare (TG_TOKEN, TG_CHAT_ID) и в код/репозиторий не попадают.
// Разрешённые сайты задаются переменной ALLOWED_ORIGINS в wrangler.toml (через запятую).

const MAX_LEN = 3500

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || ''
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    const ok = allowed.includes(origin)
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    }
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405)
    if (!ok) return json({ ok: false, error: 'origin' }, 403)

    let body
    try { body = await req.json() } catch { return json({ ok: false, error: 'json' }, 400) }
    const text = String(body.text || '').trim().slice(0, MAX_LEN)
    if (!text || body.website) return json({ ok: false, error: 'empty' }, 400) // поле website — ловушка для ботов

    const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: '🔔 Новая заявка\n\n' + text, disable_web_page_preview: true }),
    })
    return json({ ok: r.ok }, r.ok ? 200 : 502)
  },
}
