import Scene from './Scene'
import HUD from './UI/HUD'
import StartOverlay from './UI/StartOverlay'
import CinemaModal from './UI/CinemaModal'
import PodcastModal from './UI/PodcastModal'
import EstimatorModal from './UI/EstimatorModal'
import YouTubeModal from './UI/YouTubeModal'
import { useStore, rt } from './store'
import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'

function RotateHint() {
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const f = () => setPortrait(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  if (!rt.touch || !portrait) return null
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#07080c] p-8 text-center">
      <Smartphone size={48} className="rotate-90 text-white/70" />
      <p className="text-sm text-white/80">Поверните телефон горизонтально, чтобы пройтись по студии</p>
    </div>
  )
}

export default function App() {
  const started = useStore((s) => s.started)
  const modal = useStore((s) => s.modal)
  return (
    <>
      <Scene />
      {started && <HUD />}
      {!started && <StartOverlay />}
      {modal === 'cinema' && <CinemaModal />}
      {modal === 'podcast' && <PodcastModal />}
      <RotateHint />
      {modal === 'estimator' && <EstimatorModal />}
      {modal === 'youtube' && <YouTubeModal />}
    </>
  )
}
