import { Play, Check, Phone, Send, ExternalLink } from 'lucide-react'
import Modal from './Modal'
import { YOUTUBE, BRAND } from '../data/content'

export default function YouTubeModal() {
  const accent = '#ff4d4d'
  return (
    <Modal title={YOUTUBE.title} accent={accent}>
      <p className="mb-5 text-[15px] leading-relaxed text-white/75">{YOUTUBE.lead}</p>

      <div className="grid gap-5 md:grid-cols-2">
        {YOUTUBE.cases.map((c) => (
          <div key={c.name} className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <Play size={14} style={{ color: accent }} /> Собственный канал
            </div>
            <h3 className="mt-1 text-lg font-semibold">{c.name}</h3>
            <p className="mt-2 text-sm text-white/70">{c.text}</p>
            <a href={c.url} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm" style={{ color: accent }}>
              Смотреть на YouTube <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-2 text-sm text-white/80">
        {YOUTUBE.packages.map((p) => (
          <li key={p} className="flex gap-2">
            <Check size={16} className="mt-0.5 shrink-0" style={{ color: accent }} />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={BRAND.youtubeUrl}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black hover:brightness-110"
          style={{ background: accent }}
        >
          Страница «YouTube для бизнеса»
        </a>
        <a href={BRAND.telegram} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm hover:bg-white/10">
          <Send size={15} /> Написать в Telegram
        </a>
        <a href={BRAND.phoneHref} className="flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm hover:bg-white/10">
          <Phone size={15} /> {BRAND.phone}
        </a>
      </div>
    </Modal>
  )
}
