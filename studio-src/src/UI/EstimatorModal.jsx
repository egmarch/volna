import { useMemo, useState } from 'react'
import { Send, Check, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import Modal from './Modal'
import { ESTIMATE, BRAND } from '../data/content'
import { sendLead } from '../lead'

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n / 1000) * 1000) + ' ₽'

export default function EstimatorModal() {
  const [type, setType] = useState(ESTIMATE.types[0].id)
  const [shifts, setShifts] = useState(ESTIMATE.shifts.min)
  const [opts, setOpts] = useState({})
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | fallback
  const accent = '#8a93ff'

  const { lo, hi, selected, t } = useMemo(() => {
    const t = ESTIMATE.types.find((x) => x.id === type)
    let sum = t.base + t.perShift * shifts
    const selected = ESTIMATE.options.filter((o) => opts[o.id])
    for (const o of selected) sum += o.price * (o.perShift ? shifts : 1)
    return { lo: sum * ESTIMATE.range[0], hi: sum * ESTIMATE.range[1], selected, t }
  }, [type, shifts, opts])

  const unit = type === 'podcast' ? 'Записей по 1,5 ч' : 'Съёмочные смены'

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    const text =
      `Имя: ${name}\nКонтакт: ${contact}\n` +
      `Тип: ${t.label}\n${unit}: ${shifts}\nОпции: ${selected.map((o) => o.label).join(', ') || '—'}\n` +
      `Ориентир: ${fmt(lo)} – ${fmt(hi)}`
    setStatus('sending')
    const ok = await sendLead(text).catch(() => false)
    if (ok) return setStatus('sent')
    // запасной путь: открываем Telegram с готовым текстом
    try { await navigator.clipboard.writeText(text) } catch { /* буфер недоступен */ }
    window.open(`${BRAND.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    setStatus('fallback')
  }

  const input = 'w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/50'

  return (
    <Modal title="Отдел продаж · Калькулятор сметы" accent={accent} wide>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-xs uppercase tracking-widest text-white/50">Тип ролика</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ESTIMATE.types.map((x) => (
                <button key={x.id} type="button" onClick={() => setType(x.id)}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${type === x.id ? 'border-transparent text-black' : 'border-white/15 hover:bg-white/10'}`}
                  style={type === x.id ? { background: accent } : undefined}>
                  {x.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex justify-between text-xs uppercase tracking-widest text-white/50">
              <span>{unit}</span><span className="text-white">{shifts}</span>
            </h3>
            <input type="range" min={ESTIMATE.shifts.min} max={ESTIMATE.shifts.max} step={1} value={shifts}
              onChange={(e) => setShifts(+e.target.value)} className="w-full" style={{ accentColor: accent }} />
            <div className="flex justify-between text-xs text-white/40">
              {Array.from({ length: ESTIMATE.shifts.max - ESTIMATE.shifts.min + 1 }, (_, i) => <span key={i}>{i + ESTIMATE.shifts.min}</span>)}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-widest text-white/50">Опции</h3>
            <div className="space-y-2">
              {ESTIMATE.options.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5">
                  <span className="flex items-center gap-3">
                    <input type="checkbox" checked={!!opts[o.id]} onChange={(e) => setOpts({ ...opts, [o.id]: e.target.checked })} style={{ accentColor: accent }} />
                    {o.label}
                  </span>
                  <span className="text-xs text-white/45">+{new Intl.NumberFormat('ru-RU').format(o.price)} ₽{o.perShift ? ' / ед.' : ''}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-xs uppercase tracking-widest text-white/50">Ориентировочная вилка</div>
            <div className="wave-text mt-1 text-3xl font-semibold leading-tight">{fmt(lo)} — {fmt(hi)}</div>
            <p className="mt-2 text-xs text-white/45">{ESTIMATE.disclaimer}</p>
            <a href={BRAND.calcUrl} className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/70 underline-offset-2 hover:text-white hover:underline">
              Подробный калькулятор на сайте <ExternalLink size={12} />
            </a>
          </div>

          {status === 'sent' && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
              <Check className="mt-0.5 shrink-0 text-emerald-300" size={18} />
              <span>Заявка отправлена. Продюсер свяжется с вами по указанному контакту.</span>
            </div>
          )}
          {status === 'fallback' && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={18} />
              <span>Не удалось отправить автоматически. Открыт Telegram — текст заявки уже скопирован, достаточно нажать «Отправить». Или позвоните: <a className="underline" href={BRAND.phoneHref}>{BRAND.phone}</a>.</span>
            </div>
          )}
          {(status === 'idle' || status === 'sending') && (
            <form onSubmit={submit} className="space-y-3">
              <input className={input} placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className={input} placeholder="Telegram или телефон" value={contact} onChange={(e) => setContact(e.target.value)} required />
              <button type="submit" disabled={status === 'sending'} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60" style={{ background: accent }}>
                {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}
