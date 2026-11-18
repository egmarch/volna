import { useState } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import Modal from './Modal'
import { ARTICLES } from '../data/content'

export default function LibraryModal() {
  const [open, setOpen] = useState(null)
  const art = ARTICLES.find((a) => a.id === open)
  const accent = '#f5d77a'

  return (
    <Modal title="Библиотека · Статьи и бэкстейдж" accent={accent}>
      {art ? (
        <article>
          <button onClick={() => setOpen(null)} className="mb-4 flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft size={16} /> Ко всем статьям
          </button>
          <div className="mb-2 text-xs uppercase tracking-widest" style={{ color: accent }}>{art.tag}</div>
          <h3 className="mb-4 text-2xl font-semibold leading-tight">{art.title}</h3>
          <div className="space-y-4 text-[15px] leading-relaxed text-white/80">
            {art.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ARTICLES.map((a) => (
            <li key={a.id}>
              <button onClick={() => setOpen(a.id)} className="h-full w-full rounded-xl border border-white/10 p-4 text-left transition hover:border-white/30 hover:bg-white/5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="uppercase tracking-widest" style={{ color: accent }}>{a.tag}</span>
                  <span className="flex items-center gap-1 text-white/45"><Clock size={12} /> {a.read}</span>
                </div>
                <div className="font-medium leading-snug">{a.title}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
