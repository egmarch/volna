import { ArrowLeft } from 'lucide-react'
import { useStore, openModal, getState, rt } from '../store'
import TouchControls from './TouchControls'
import { ZONES } from '../world'
import { flyTo } from '../PlayerController'
import { BRAND } from '../data/content'

export default function HUD() {
  const nearby = useStore((s) => s.nearby)
  const locked = useStore((s) => s.locked)
  const near = nearby ? ZONES[nearby] : null

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* прицел */}
      {locked && <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />}

      <a href={BRAND.siteUrl} className="glass pointer-events-auto absolute left-4 top-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/80 hover:text-white">
        <ArrowLeft size={14} /> На сайт
      </a>
      {!locked && !rt.touch && (
        <div className="glass absolute right-4 top-4 hidden rounded-xl px-3 py-2 text-xs text-white/70 sm:block">
          Кликните по сцене, чтобы управлять мышью · WASD · Shift — бег
        </div>
      )}
      {locked && !rt.touch && (
        <div className="glass absolute right-4 top-4 hidden rounded-xl px-3 py-2 text-xs text-white/70 sm:block">Esc — освободить курсор</div>
      )}

      {/* подсказка */}
      {near && (
        <div className={`absolute left-1/2 -translate-x-1/2 ${rt.touch ? 'bottom-16' : 'bottom-24'}`}>
          <button
            onClick={() => openModal(near.modal)}
            className="glass pointer-events-auto rounded-full px-5 py-2.5 text-sm shadow-lg"
            style={{ borderColor: near.color + '88' }}
          >
            {rt.touch ? (
              <>Открыть: <span style={{ color: near.color }}>{near.label}</span></>
            ) : (
              <><span style={{ color: near.color }}>{near.label}</span> · Нажмите <kbd className="rounded bg-white/15 px-1.5">E</kbd> или кликните</>
            )}
          </button>
        </div>
      )}

      {/* быстрая навигация */}
      <nav className="glass pointer-events-auto absolute bottom-4 left-1/2 flex max-w-[96vw] -translate-x-1/2 gap-1 rounded-2xl p-1.5">
        {Object.entries(ZONES).map(([id, z]) => (
          <button
            key={id}
            onClick={() => { if (!getState().modal) flyTo(id) }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition hover:bg-white/10 sm:px-4 sm:text-sm"
          >
            <kbd className="rounded bg-white/10 px-1.5 text-[11px]" style={{ color: z.color }}>{z.key}</kbd>
            {z.label}
          </button>
        ))}
      </nav>
      {rt.touch && <TouchControls />}
    </div>
  )
}
