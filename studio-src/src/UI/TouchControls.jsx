import { useRef, useState } from 'react'
import { rt, getState } from '../store'

const SIZE = 120
const MAX = 42

// Один виртуальный стик. Пишет нормализованное значение (-1..1) в target.
function Stick({ target, side }) {
  const id = useRef(null)
  const origin = useRef([0, 0])
  const [knob, setKnob] = useState([0, 0])

  const set = (dx, dy) => {
    const d = Math.hypot(dx, dy)
    const k = d > MAX ? MAX / d : 1
    dx *= k
    dy *= k
    setKnob([dx, dy])
    target.x = Math.abs(dx / MAX) < 0.12 ? 0 : dx / MAX
    target.y = Math.abs(dy / MAX) < 0.12 ? 0 : dy / MAX
  }
  const reset = () => {
    id.current = null
    setKnob([0, 0])
    target.x = 0
    target.y = 0
  }
  const down = (e) => {
    if (id.current !== null || getState().modal) return
    id.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    origin.current = [r.left + r.width / 2, r.top + r.height / 2]
    set(e.clientX - origin.current[0], e.clientY - origin.current[1])
  }
  const move = (e) => {
    if (e.pointerId !== id.current) return
    set(e.clientX - origin.current[0], e.clientY - origin.current[1])
  }
  const up = (e) => {
    if (e.pointerId === id.current) reset()
  }

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto absolute bottom-16 touch-none rounded-full border border-white/20 bg-white/5 backdrop-blur-sm ${side === 'left' ? 'left-6' : 'right-6'}`}
      style={{ width: SIZE, height: SIZE }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-white/40 bg-white/25"
        style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
      />
    </div>
  )
}

export default function TouchControls() {
  return (
    <>
      <Stick target={rt.joy} side="left" />
      <Stick target={rt.look} side="right" />
    </>
  )
}
