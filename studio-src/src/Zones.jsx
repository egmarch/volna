import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALLS, PROPS, WALL_H, ZONES } from './world'

/* ---------- helpers ---------- */
function useCanvasTexture(w, h, draw, fps = 0) {
  const ref = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    draw(ctx, 0, w, h)
    tex.needsUpdate = true
    return { ctx, tex, t: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useFrame((_, dt) => {
    if (!fps) return
    ref.t += dt
    if (ref.t < 1 / fps) return
    ref.acc = (ref.acc || 0) + ref.t
    ref.t = 0
    draw(ref.ctx, ref.acc, w, h)
    ref.tex.needsUpdate = true
  })
  return ref.tex
}

const Neon = ({ p, s, c }) => (
  <mesh position={p}>
    <boxGeometry args={s} />
    <meshBasicMaterial color={c} toneMapped={false} />
  </mesh>
)

function Label({ text, color, position, rotation = [0, 0, 0], width = 5 }) {
  const tex = useCanvasTexture(1024, 200, (ctx, _t, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = color
    ctx.font = '300 110px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '24px'
    ctx.fillText(text, w / 2, h / 2)
  })
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, width * (200 / 1024)]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/* ---------- стены и мебель (из world.js) ---------- */
export function Architecture() {
  return (
    <group>
      {WALLS.map(([x, z, w, d], i) => (
        <mesh key={'w' + i} position={[x, WALL_H / 2, z]}>
          <boxGeometry args={[w, WALL_H, d]} />
          <meshStandardMaterial color="#171a23" roughness={0.85} metalness={0.05} />
        </mesh>
      ))}
      {PROPS.map((o, i) => (
        <mesh key={'p' + i} position={o.p}>
          <boxGeometry args={o.s} />
          {o.e ? (
            <meshBasicMaterial color={o.c} toneMapped={false} />
          ) : (
            <meshStandardMaterial color={o.c} roughness={0.6} metalness={0.15} />
          )}
        </mesh>
      ))}
    </group>
  )
}

/* ---------- Кинотеатр ---------- */
export function CinemaZone() {
  const tex = useCanvasTexture(
    1280,
    576,
    (ctx, t, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#0b0d16')
      g.addColorStop(1, '#171a2c')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // «волны» — фирменный мотив VOLNA
      for (let i = 0; i < 14; i++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const y = h * 0.5 + Math.sin(x * 0.006 + t * 0.9 + i * 0.35) * (40 + i * 6) + (i - 7) * 18
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
        const lg = ctx.createLinearGradient(0, 0, w, 0)
        lg.addColorStop(0, '#fbfd76')
        lg.addColorStop(0.5, '#f2a38a')
        lg.addColorStop(1, '#6771d6')
        ctx.strokeStyle = lg
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 3
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(7,8,12,.72)'
      ctx.fillRect(w * 0.18, h * 0.38, w * 0.64, h * 0.24)
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '600 54px "Segoe UI", Arial, sans-serif'
      ctx.fillText('VOLNA film · Шоурил', w / 2, h * 0.46)
      ctx.font = '400 34px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#f2c9a8'
      ctx.fillText('Нажмите [E] или кликните, чтобы открыть', w / 2, h * 0.55)
    },
    10,
  )
  const c = ZONES.cinema.color
  return (
    <group>
      <mesh position={[0, 3.1, -21.72]}>
        <planeGeometry args={[10, 4.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <Neon p={[0, 5.45, -21.7]} s={[10.4, 0.08, 0.08]} c={c} />
      <Neon p={[0, 0.82, -21.7]} s={[10.4, 0.08, 0.08]} c={c} />
      <Neon p={[-5.2, 3.13, -21.7]} s={[0.08, 4.7, 0.08]} c={c} />
      <Neon p={[5.2, 3.13, -21.7]} s={[0.08, 4.7, 0.08]} c={c} />
      {/* спинки кресел */}
      {[-1, 0, 1].flatMap((i) =>
        [-14, -16.5].map((z) => (
          <mesh key={i + '_' + z} position={[i * 2.6, 1.1, z + 0.45]}>
            <boxGeometry args={[1.7, 0.9, 0.25]} />
            <meshStandardMaterial color="#3a3d4c" roughness={0.7} />
          </mesh>
        )),
      )}
      <pointLight position={[0, 3, -17]} intensity={55} distance={16} color={c} />
      <Label text="КИНОТЕАТР" color={c} position={[0, 3.6, -7.78]} rotation={[0, 0, 0]} width={4.4} />
    </group>
  )
}

/* ---------- Библиотека / монтажка ---------- */
function Shelf({ position, rotation = [0, 0, 0], length = 11 }) {
  const books = useMemo(() => {
    const arr = []
    const pal = ['#f4de8f', '#f2a38a', '#b48da5', '#7276e1', '#8b8f9c', '#d8c3a5']
    for (let row = 0; row < 4; row++) {
      let x = -length / 2 + 0.3
      while (x < length / 2 - 0.4) {
        const w = 0.12 + Math.random() * 0.18
        const h = 0.4 + Math.random() * 0.35
        arr.push({ x: x + w / 2, y: 0.55 + row * 0.75 + h / 2, w, h, c: pal[Math.floor(Math.random() * pal.length)] })
        x += w + 0.02
      }
    }
    return arr
  }, [length])
  return (
    <group position={position} rotation={rotation}>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.42]}>
          <boxGeometry args={[b.w, b.h, 0.3]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export function LibraryZone() {
  const c = ZONES.library.color
  const screen = useCanvasTexture(
    512,
    300,
    (ctx, t, w, h) => {
      ctx.fillStyle = '#0a0c12'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ['#f2a38a', '#7276e1', '#f4de8f'][i % 3]
        const x = ((t * 30 + i * 90) % (w + 80)) - 40
        ctx.fillRect(x, 60 + i * 40, 70, 22)
      }
      ctx.fillStyle = '#ffffff55'
      ctx.fillRect(0, h - 44, w, 2)
      ctx.fillStyle = '#f5d77a'
      ctx.fillRect(((t * 40) % w), h - 52, 3, 20)
    },
    8,
  )
  return (
    <group>
      <Shelf position={[-20.6, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={12} />
      <Shelf position={[-15, 0, -6.4]} rotation={[0, 0, 0]} length={10} />
      <Shelf position={[-15, 0, 6.4]} rotation={[0, Math.PI, 0]} length={10} />
      {/* мониторы на монтажном столе */}
      {[-1.2, 0.2].map((dz, i) => (
        <group key={i} position={[-16.4, 1.35, dz]} rotation={[0, Math.PI / 2 - 0.12 + i * 0.24, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.72, 0.06]} />
            <meshStandardMaterial color="#0d0f14" />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[1.12, 0.64]} />
            <meshBasicMaterial map={screen} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
      <mesh position={[-15.1, 0.92, 0.1]}>
        <boxGeometry args={[0.9, 0.04, 0.3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Neon p={[-15, 3.4, 0]} s={[6, 0.06, 0.06]} c={c} />
      <pointLight position={[-15, 3, 0]} intensity={40} distance={14} color={c} />
      <Label text="БИБЛИОТЕКА" color={c} position={[-7.78, 3.6, 0]} rotation={[0, Math.PI / 2, 0]} width={4.4} />
    </group>
  )
}

/* ---------- Отдел продаж ---------- */
export function SalesZone() {
  const c = ZONES.estimator.color
  const holo = useRef()
  const ring = useRef()
  const tex = useCanvasTexture(
    512,
    512,
    (ctx, t, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = '#9aa6ff'
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, w - 40, h - 40)
      ctx.fillStyle = '#c9d0ff'
      ctx.textAlign = 'center'
      ctx.font = '700 120px "Segoe UI", Arial, sans-serif'
      ctx.fillText('₽ ' + (120 + Math.floor((Math.sin(t) + 1) * 40)) + 'К', w / 2, h / 2 + 10)
      ctx.font = '400 40px "Segoe UI", Arial, sans-serif'
      ctx.fillText('Смета', w / 2, h / 2 + 80)
      ctx.font = '400 28px "Segoe UI", Arial, sans-serif'
      ctx.fillText('[E] / клик', w / 2, h / 2 + 130)
      ctx.fillStyle = '#7276e1'
      for (let i = 0; i < 7; i++) ctx.fillRect(70 + i * 55, 120 - (Math.sin(t + i) + 1) * 30, 34, (Math.sin(t + i) + 1) * 30 + 6)
    },
    8,
  )
  useFrame((_, dt) => {
    if (holo.current) holo.current.rotation.y += dt * 0.6
    if (ring.current) ring.current.rotation.z += dt * 0.9
  })
  return (
    <group>
      <group position={[16, 1.9, 0]}>
        <mesh ref={holo}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshBasicMaterial color={c} wireframe toneMapped={false} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.95, 0.015, 8, 64]} />
          <meshBasicMaterial color="#b9c0ff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={tex} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      <Neon p={[16, 0.31, 0]} s={[1.2, 0.04, 1.2]} c={c} />
      <Neon p={[21.7, 3, 0]} s={[0.05, 0.05, 11]} c={c} />
      <pointLight position={[16, 2.6, 0]} intensity={45} distance={14} color={c} />
      <Label text="СМЕТА" color={c} position={[7.78, 3.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={3.2} />
    </group>
  )
}

/* ---------- Холл ---------- */
export function HallZone() {
  const tex = useCanvasTexture(1024, 256, (ctx, _t, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#fbfd76')
    g.addColorStop(0.5, '#f2a38a')
    g.addColorStop(1, '#7276e1')
    ctx.fillStyle = g
    ctx.font = '300 150px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '40px'
    ctx.fillText('VOLNA', w / 2, h / 2)
  })
  const beam = useRef()
  useFrame((s) => {
    if (beam.current) beam.current.position.y = 1.9 + Math.sin(s.clock.elapsedTime * 1.2) * 0.1
  })
  return (
    <group>
      <mesh ref={beam} position={[0, 1.9, 0]}>
        <planeGeometry args={[3.2, 0.8]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* световые направляющие в полу — к зонам */}
      <Neon p={[0, 0.012, -4.6]} s={[0.08, 0.02, 6]} c={ZONES.cinema.color} />
      <Neon p={[-4.6, 0.012, 0]} s={[6, 0.02, 0.08]} c={ZONES.library.color} />
      <Neon p={[4.6, 0.012, 0]} s={[6, 0.02, 0.08]} c={ZONES.estimator.color} />
      <pointLight position={[0, 3.5, 2]} intensity={26} distance={20} color="#ffe9d2" />
      <pointLight position={[0, 3.5, 13]} intensity={16} distance={18} color="#cfd6ff" />
    </group>
  )
}
