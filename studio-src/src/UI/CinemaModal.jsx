import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'
import Modal from './Modal'
import { CINEMA_CATEGORIES } from '../data/content'

const watchUrl = (v) => v.watch || (v.yt ? `https://youtu.be/${v.yt}` : '')
const embedUrl = (v) => v.embed || (v.yt ? `https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0` : '')
const thumb = (v) => (v.yt ? `https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg` : '')
// YouTube не встраивается на страницах, открытых с диска (file://), — там открываем ролик в новой вкладке.
const canEmbed = () => location.protocol !== 'file:'

export default function CinemaModal() {
  const [cat, setCat] = useState(CINEMA_CATEGORIES[0].id)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const category = CINEMA_CATEGORIES.find((c) => c.id === cat)
  const video = category.videos[idx] ?? category.videos[0]
  const accent = '#f2a38a'

  const select = (c, i) => { setCat(c); setIdx(i); setPlaying(false) }
  const play = () => {
    if (!canEmbed() || !embedUrl(video)) window.open(watchUrl(video), '_blank', 'noopener')
    else setPlaying(true)
  }

  return (
    <Modal title="Кинотеатр · Шоурил" accent={accent} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {CINEMA_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => select(c.id, 0)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c.id ? 'border-transparent text-black' : 'border-white/15 text-white/75 hover:bg-white/10'}`}
            style={cat === c.id ? { background: accent } : undefined}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
            {playing ? (
              <iframe
                key={video.yt || video.embed}
                src={embedUrl(video)}
                title={video.title}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            ) : (
              <button onClick={play} className="group absolute inset-0 flex items-center justify-center" aria-label={`Смотреть: ${video.title}`}>
                {thumb(video) && <img src={thumb(video)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />}
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full text-black shadow-xl transition group-hover:scale-110" style={{ background: accent }}>
                  <Play size={26} fill="currentColor" />
                </span>
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-medium">{video.title}</h3>
              <p className="text-sm text-white/55">{video.desc}</p>
            </div>
            {watchUrl(video) && (
              <a href={watchUrl(video)} target="_blank" rel="noopener" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">
                Открыть на YouTube <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <ul className="scroll-thin max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {category.videos.map((v, i) => (
            <li key={v.title}>
              <button
                onClick={() => select(cat, i)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${i === idx ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
              >
                {thumb(v) && <img src={thumb(v)} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded-md object-cover" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{v.title}</span>
                  <span className="block truncate text-xs text-white/50">{v.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
