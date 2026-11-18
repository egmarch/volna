import { Mic, Check, Phone, Send } from 'lucide-react'
import Modal from './Modal'
import { PODCAST, BRAND } from '../data/content'
import { openModal } from '../store'

export default function PodcastModal() {
  const accent = '#ff8a7a'
  return (
    <Modal title={PODCAST.title} accent={accent}>
      <p className="mb-5 text-[15px] leading-relaxed text-white/75">{PODCAST.lead}</p>

      <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <Mic size={14} style={{ color: accent }} /> Минимальный выпуск
          </div>
          <div className="wave-text mt-1 text-4xl font-semibold">от {PODCAST.from}</div>
          <p className="mt-1 text-sm text-white/55">{PODCAST.fromNote}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {PODCAST.features.map((f) => (
              <li key={f} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: accent }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-widest text-white/50">Тарифы</h3>
          <ul className="space-y-2">
            {PODCAST.tiers.map((t) => (
              <li key={t.label} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm">
                <span>{t.label}</span>
                <b style={{ color: accent }}>{t.price}</b>
              </li>
            ))}
          </ul>
          {PODCAST.embed && (
            <div className="relative mt-4 aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
              <iframe src={PODCAST.embed} title="Пример выпуска" className="absolute inset-0 h-full w-full" allowFullScreen loading="lazy" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => openModal('estimator')}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black hover:brightness-110"
          style={{ background: accent }}
        >
          Рассчитать смету
        </button>
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
