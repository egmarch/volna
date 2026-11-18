import { useState } from 'react'
import { Play } from 'lucide-react'
import Modal from './Modal'
import { CINEMA_CATEGORIES } from '../data/content'

export default function CinemaModal() {
  const [cat, setCat] = useState(CINEMA_CATEGORIES[0].id)
  const category = CINEMA_CATEGORIES.find((c) => c.id === cat)
  const [idx, setIdx] = useState(0)
  const video = category.videos[idx] ?? category.videos[0]
  const accent = '#f2a38a'

  return (
    <Modal title="Кинотеатр · Шоурил" accent={accent} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {CINEMA_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCat(c.id); setIdx(0) }}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c.id ? 'border-transparent text-black' : 'border-white/15 text-white/75 hover:bg-white/10'}`}
            style={cat === c.id ? { background: accent } : undefined}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
            {video.embed ? (
              <iframe
                key={video.embed}
                src={video.embed}
                title={video.title}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/60">
                <Play size={44} style={{ color: accent }} />
                <p className="px-6 text-sm">
                  Здесь будет плеер (Kinescope / VK Видео / YouTube).<br />
                  Вставьте ссылку <code className="text-white/90">embed</code> в <code className="text-white/90">src/data/content.js</code>.
                </p>
              </div>
            )}
          </div>
          <h3 className="mt-3 text-base font-medium">{video.title}</h3>
          <p className="text-sm text-white/55">{video.desc}</p>
        </div>

        <ul className="space-y-2">
          {category.videos.map((v, i) => (
            <li key={v.title}>
              <button
                onClick={() => setIdx(i)}
                className={`w-full rounded-xl border p-3 text-left transition ${i === idx ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
              >
                <div className="text-sm font-medium">{v.title}</div>
                <div className="text-xs text-white/50">{v.desc}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
