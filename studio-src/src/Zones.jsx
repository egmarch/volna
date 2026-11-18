import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALLS, PROPS, WALL_H, ZONES } from './world'

/* ======================= helpers ======================= */
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
    return { ctx, tex, t: 0, acc: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useFrame((_, dt) => {
    if (!fps) return
    ref.t += dt
    if (ref.t < 1 / fps) return
    ref.acc += ref.t
    ref.t = 0
    draw(ref.ctx, ref.acc, w, h)
    ref.tex.needsUpdate = true
  })
  return ref.tex
}

const Neon = ({ p, s, c, rot }) => (
  <mesh position={p} rotation={rot}>
    <boxGeometry args={s} />
    <meshBasicMaterial color={c} toneMapped={false} />
  </mesh>
)

const Box = ({ p, s, c, r = 0.7, m = 0.1, rot }) => (
  <mesh position={p} rotation={rot}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={r} metalness={m} />
  </mesh>
)

const Cyl = ({ p, r = 0.05, h = 1, c, rough = 0.6, metal = 0.2, rot, seg = 16 }) => (
  <mesh position={p} rotation={rot}>
    <cylinderGeometry args={[r, r, h, seg]} />
    <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
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

/* ======================= мебель и приборы ======================= */
// Передняя сторона мебели смотрит в +Z локально; поворот — через rot (радианы вокруг Y).
function Armchair({ p, rot = 0, color = '#3a3d4c', w = 1 }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.25, 0]} s={[w, 0.3, 0.9]} c={color} r={0.85} />
      <Box p={[0, 0.65, -0.38]} s={[w, 0.8, 0.16]} c={color} r={0.85} />
      <Box p={[-w / 2 + 0.07, 0.45, 0]} s={[0.14, 0.3, 0.8]} c={color} r={0.85} />
      <Box p={[w / 2 - 0.07, 0.45, 0]} s={[0.14, 0.3, 0.8]} c={color} r={0.85} />
      <Box p={[0, 0.06, 0]} s={[w * 0.7, 0.12, 0.6]} c="#101218" />
    </group>
  )
}

function Chair({ p, rot = 0, color = '#2b2f45' }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.45, 0]} s={[0.5, 0.07, 0.5]} c={color} r={0.6} />
      <Box p={[0, 0.78, -0.22]} s={[0.5, 0.55, 0.06]} c={color} r={0.6} />
      <Cyl p={[0, 0.22, 0]} r={0.035} h={0.44} c="#9aa0b8" metal={0.8} rough={0.3} />
      <Cyl p={[0, 0.02, 0]} r={0.25} h={0.04} c="#14161d" />
    </group>
  )
}

function Sofa({ p, rot = 0, len = 2.6, color = '#3b2f3e' }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.25, 0]} s={[len, 0.4, 1]} c={color} r={0.9} />
      <Box p={[0, 0.7, -0.4]} s={[len, 0.6, 0.22]} c={color} r={0.9} />
      <Box p={[-len / 2 + 0.1, 0.5, 0]} s={[0.2, 0.3, 0.95]} c={color} r={0.9} />
      <Box p={[len / 2 - 0.1, 0.5, 0]} s={[0.2, 0.3, 0.95]} c={color} r={0.9} />
    </group>
  )
}

function Bench({ p, rot = 0, len = 2.4 }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.42, 0]} s={[len, 0.08, 0.6]} c="#6b4f3a" r={0.6} />
      <Box p={[-len / 2 + 0.2, 0.2, 0]} s={[0.08, 0.4, 0.5]} c="#14161d" />
      <Box p={[len / 2 - 0.2, 0.2, 0]} s={[0.08, 0.4, 0.5]} c="#14161d" />
    </group>
  )
}

function Plant({ p, s = 1 }) {
  return (
    <group position={[p[0], 0, p[1]]} scale={s}>
      <Cyl p={[0, 0.3, 0]} r={0.3} h={0.6} c="#2a2c36" rough={0.5} />
      <mesh position={[0, 1.0, 0]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#24523a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.18, 1.5, 0.05]}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#2d6a47" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function FloorLamp({ p, c = '#ffd9a8', h = 1.9 }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <Cyl p={[0, 0.02, 0]} r={0.2} h={0.04} c="#14161d" />
      <Cyl p={[0, h / 2, 0]} r={0.018} h={h} c="#2a2c36" metal={0.8} />
      <mesh position={[0, h + 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.32, 20, 1, true]} />
        <meshBasicMaterial color={c} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Pendant({ p, c = '#ffd9a8', r = 0.4 }) {
  const drop = WALL_H - p[1]
  return (
    <group position={p}>
      <Cyl p={[0, drop / 2, 0]} r={0.01} h={drop} c="#222" />
      <mesh>
        <coneGeometry args={[r, 0.3, 24, 1, true]} />
        <meshBasicMaterial color={c} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.95, 24]} />
        <meshBasicMaterial color="#fff6e6" toneMapped={false} />
      </mesh>
    </group>
  )
}

// Микрофон на журавле: стоит на столе, штанга уходит в сторону говорящего (dir = ±1 по Z).
function Mic({ p, dir = 1 }) {
  return (
    <group position={p} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <Cyl p={[0, 0.02, 0]} r={0.09} h={0.04} c="#14161d" metal={0.6} />
      <Cyl p={[0, 0.22, 0]} r={0.012} h={0.4} c="#9aa0b8" metal={0.9} rough={0.3} />
      <Box p={[0, 0.42, 0.2]} s={[0.02, 0.02, 0.42]} c="#9aa0b8" m={0.9} r={0.3} />
      <Cyl p={[0, 0.41, 0.42]} r={0.04} h={0.14} c="#0d0f14" rot={[Math.PI / 2, 0, 0]} rough={0.4} metal={0.5} />
      <mesh position={[0, 0.41, 0.5]}>
        <torusGeometry args={[0.04, 0.008, 8, 20]} />
        <meshBasicMaterial color="#ff6a5a" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Softbox({ p, rot = 0, c = '#fff1dc' }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Cyl p={[0, 0.8, 0]} r={0.025} h={1.6} c="#14161d" metal={0.6} />
      <Cyl p={[0, 0.02, 0]} r={0.28} h={0.04} c="#14161d" />
      <Box p={[0, 1.9, 0]} s={[0.9, 1.1, 0.3]} c="#101218" />
      <mesh position={[0, 1.9, 0.16]}>
        <planeGeometry args={[0.8, 1.0]} />
        <meshBasicMaterial color={c} toneMapped={false} />
      </mesh>
    </group>
  )
}

function CameraRig({ p, rot = 0 }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Cyl p={[0, 0.7, 0]} r={0.025} h={1.4} c="#14161d" metal={0.6} />
      {[0, 2.1, 4.2].map((a) => (
        <Box key={a} p={[Math.sin(a) * 0.25, 0.08, Math.cos(a) * 0.25]} s={[0.04, 0.04, 0.5]} c="#14161d" rot={[0, a, 0]} />
      ))}
      <Box p={[0, 1.5, 0]} s={[0.22, 0.2, 0.34]} c="#0d0f14" m={0.4} />
      <Cyl p={[0, 1.5, 0.24]} r={0.07} h={0.16} c="#1b1d27" rot={[Math.PI / 2, 0, 0]} metal={0.6} />
      <mesh position={[0.08, 1.62, 0.1]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#ff2a2a" toneMapped={false} />
      </mesh>
    </group>
  )
}

function WallPanels({ cols, rows, pos, rotY, w = 1.1 }) {
  const colors = ['#2a2430', '#3a2c2a', '#262a3a', '#30262a']
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {Array.from({ length: cols }).flatMap((_, i) =>
        Array.from({ length: rows }).map((__, j) => (
          <Box
            key={i + '_' + j}
            p={[(i - (cols - 1) / 2) * (w + 0.12), 1.0 + j * (w + 0.12), 0]}
            s={[w, w, 0.1]}
            c={colors[(i + j) % colors.length]}
            r={0.95}
          />
        )),
      )}
    </group>
  )
}

/* ======================= стены и коробки ======================= */
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
      {/* плинтус-подсветка по периметру */}
      <Neon p={[0, 0.05, -21.78]} s={[43, 0.04, 0.04]} c="#2b2f45" />
      <Neon p={[0, 0.05, 17.78]} s={[43, 0.04, 0.04]} c="#2b2f45" />
    </group>
  )
}

/* ======================= Кинотеатр ======================= */
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
      {/* кресла: два ряда, второй на возвышении-ступени */}
      <Box p={[0, 0.1, -16.5]} s={[9, 0.2, 2.2]} c="#14161d" />
      {[-1, 0, 1].flatMap((i) => [-14, -16.5].map((z) => <Armchair key={i + '_' + z} p={[i * 2.6, z]} rot={0} w={1.6} color="#4a3340" />))}
      {/* подсветка прохода */}
      <Neon p={[-1.3, 0.02, -15.3]} s={[0.05, 0.02, 4.6]} c={c} />
      <Neon p={[1.3, 0.02, -15.3]} s={[0.05, 0.02, 4.6]} c={c} />
      {/* бра на боковых стенах */}
      {[-12, -16, -20].flatMap((z) => [-9.75, 9.75].map((x) => <Neon key={x + '_' + z} p={[x, 2.1, z]} s={[0.1, 0.5, 0.18]} c="#ffcfa0" />))}
      {/* проектор под потолком */}
      <Box p={[0, 3.95, -11.5]} s={[0.7, 0.25, 0.5]} c="#0d0f14" m={0.4} />
      <Neon p={[0, 3.95, -11.2]} s={[0.12, 0.12, 0.05]} c="#b8c4ff" />
      {/* световые рейки */}
      <Neon p={[0, 4.12, -14]} s={[8, 0.05, 0.08]} c="#ffe9d2" />
      <Neon p={[0, 4.12, -18]} s={[8, 0.05, 0.08]} c="#ffe9d2" />
      <pointLight position={[0, 3, -17]} intensity={55} distance={16} color={c} />
      <Label text="КИНОТЕАТР" color={c} position={[0, 3.6, -7.78]} width={4.4} />
    </group>
  )
}

/* ======================= Подкаст-студия ======================= */
export function PodcastZone() {
  const c = ZONES.podcast.color
  const onAir = useCanvasTexture(
    512,
    200,
    (ctx, t, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#1a0a0a'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ff5a4a'
      ctx.lineWidth = 8
      ctx.strokeRect(10, 10, w - 20, h - 20)
      ctx.fillStyle = Math.floor(t * 1.4) % 2 ? '#ff5a4a' : '#ff9a8a'
      ctx.font = '800 96px "Segoe UI", Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ON AIR', w / 2, h / 2 + 4)
    },
    2,
  )
  const mon = useCanvasTexture(
    512,
    300,
    (ctx, t, w, h) => {
      ctx.fillStyle = '#0a0c12'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ff8a7a'
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let x = 0; x < w; x += 4) {
        const y = h / 2 + Math.sin(x * 0.05 + t * 3) * (30 + 25 * Math.sin(x * 0.01 + t))
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
    },
    8,
  )
  return (
    <group>
      {/* ковёр и стол */}
      <Box p={[-16, 0.01, 0]} s={[7, 0.02, 5.6]} c="#2a2430" r={1} />
      {/* четыре кресла вокруг стола */}
      <Armchair p={[-17.2, -1.9]} rot={0} color="#d96a58" />
      <Armchair p={[-14.8, -1.9]} rot={0} color="#d96a58" />
      <Armchair p={[-17.2, 1.9]} rot={Math.PI} color="#d96a58" />
      <Armchair p={[-14.8, 1.9]} rot={Math.PI} color="#d96a58" />
      {/* микрофоны на журавлях */}
      <Mic p={[-17.2, 0.42, -0.5]} dir={-1} />
      <Mic p={[-14.8, 0.42, -0.5]} dir={-1} />
      <Mic p={[-17.2, 0.42, 0.5]} dir={1} />
      <Mic p={[-14.8, 0.42, 0.5]} dir={1} />
      {/* ноутбук и стаканы на столе */}
      <Box p={[-16, 0.43, 0]} s={[0.36, 0.02, 0.26]} c="#9aa0b8" m={0.8} r={0.3} />
      <Cyl p={[-15.3, 0.47, 0.1]} r={0.04} h={0.1} c="#ffffff" rough={0.3} />
      <Cyl p={[-16.7, 0.47, -0.1]} r={0.04} h={0.1} c="#ffffff" rough={0.3} />
      {/* свет: софтбоксы, подвесы, камеры */}
      <Softbox p={[-19.6, -4.8]} rot={0.5} />
      <Softbox p={[-19.6, 4.8]} rot={Math.PI - 0.5} />
      <CameraRig p={[-11, -4]} rot={-Math.PI / 2 - 0.3} />
      <CameraRig p={[-11, 4]} rot={-Math.PI / 2 + 0.3} />
      <Pendant p={[-16, 2.9, -1.2]} c="#ffb3a0" />
      <Pendant p={[-16, 2.9, 1.2]} c="#ffb3a0" />
      {/* акустические панели */}
      <WallPanels cols={6} rows={2} pos={[-21.7, 0, 0]} rotY={Math.PI / 2} />
      <WallPanels cols={4} rows={2} pos={[-15, 0, -7.7]} rotY={0} />
      <WallPanels cols={4} rows={2} pos={[-15, 0, 7.7]} rotY={Math.PI} />
      {/* вывеска ON AIR */}
      <mesh position={[-21.6, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.94]} />
        <meshBasicMaterial map={onAir} toneMapped={false} />
      </mesh>
      {/* диван и столик в углу */}
      <Sofa p={[-20.4, 5.2]} rot={Math.PI / 2} />
      <Cyl p={[-19.1, 0.22, 5.2]} r={0.3} h={0.44} c="#6b4f3a" rough={0.5} />
      <Plant p={[-20.8, -6.8]} s={1.1} />
      <Plant p={[-9.2, 6.8]} />
      {/* монитор-тюнер у двери */}
      <mesh position={[-9.2, 1.8, -7.55]}>
        <planeGeometry args={[1.4, 0.82]} />
        <meshBasicMaterial map={mon} toneMapped={false} />
      </mesh>
      <Neon p={[-15, 4.12, 0]} s={[8, 0.05, 0.08]} c="#ffd9c8" />
      <pointLight position={[-15, 3, 0]} intensity={42} distance={14} color={c} />
      <Label text="ПОДКАСТ" color={c} position={[-7.78, 3.6, 0]} rotation={[0, Math.PI / 2, 0]} width={3.6} />
    </group>
  )
}

/* ======================= Отдел продаж ======================= */
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
  const board = useCanvasTexture(1024, 400, (ctx, _t, w) => {
    ctx.fillStyle = '#e9ecf5'
    ctx.fillRect(0, 0, w, 400)
    ctx.fillStyle = '#1b1d27'
    ctx.font = '700 48px "Segoe UI", Arial, sans-serif'
    ctx.fillText('Бриф → Смета → Съёмка → Монтаж', 40, 80)
    ctx.strokeStyle = '#7276e1'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(40, 330)
    ;[[200, 260], [380, 290], [560, 190], [760, 210], [960, 110]].forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.stroke()
    ctx.fillStyle = '#f2a38a'
    for (let i = 0; i < 5; i++) ctx.fillRect(60 + i * 180, 340, 100, 20)
  })
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
      <Neon p={[16, 0.84, 0]} s={[1.2, 0.04, 1.2]} c={c} />
      {/* стулья вокруг стола */}
      {[-1.6, 0, 1.6].map((dx) => (
        <group key={dx}>
          <Chair p={[16 + dx, -1.9]} rot={0} />
          <Chair p={[16 + dx, 1.9]} rot={Math.PI} />
        </group>
      ))}
      <Chair p={[13.1, 0]} rot={Math.PI / 2} />
      <Chair p={[18.9, 0]} rot={-Math.PI / 2} />
      {/* ковёр и подвесы */}
      <Box p={[16, 0.01, 0]} s={[7.5, 0.02, 5]} c="#1d2033" r={1} />
      <Pendant p={[14.6, 3, 0]} c="#c4caff" r={0.35} />
      <Pendant p={[17.4, 3, 0]} c="#c4caff" r={0.35} />
      {/* доска со схемой */}
      <mesh position={[16, 2.1, -7.74]}>
        <planeGeometry args={[4.4, 1.72]} />
        <meshBasicMaterial map={board} toneMapped={false} />
      </mesh>
      <Neon p={[16, 3.0, -7.74]} s={[4.6, 0.04, 0.04]} c={c} />
      <Neon p={[16, 1.2, -7.74]} s={[4.6, 0.04, 0.04]} c={c} />
      {/* диван, стенд, растения */}
      <Sofa p={[20.8, -5.6]} rot={-Math.PI / 2} len={2.8} color="#2f3552" />
      <Box p={[12.4, 0.8, 6.4]} s={[0.9, 1.6, 0.9]} c="#1b1d27" m={0.4} />
      <Neon p={[12.4, 1.63, 6.4]} s={[0.92, 0.04, 0.92]} c={c} />
      <Plant p={[21, 6.8]} s={1.2} />
      <Plant p={[9, -7]} />
      <FloorLamp p={[9, 7]} c="#c4caff" />
      <FloorLamp p={[21, 0]} c="#c4caff" />
      <Neon p={[16, 4.12, 0]} s={[8, 0.05, 0.08]} c="#dfe3ff" />
      <Neon p={[21.7, 3, 0]} s={[0.05, 0.05, 11]} c={c} />
      <pointLight position={[16, 2.6, 0]} intensity={45} distance={14} color={c} />
      <Label text="СМЕТА" color={c} position={[7.78, 3.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={3.2} />
    </group>
  )
}

/* ======================= Холл и лобби ======================= */
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
      <Neon p={[-4.6, 0.012, 0]} s={[6, 0.02, 0.08]} c={ZONES.podcast.color} />
      <Neon p={[4.6, 0.012, 0]} s={[6, 0.02, 0.08]} c={ZONES.estimator.color} />
      {/* потолочные кольца */}
      <mesh position={[0, 4.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.05, 8, 64]} />
        <meshBasicMaterial color="#ffe9d2" toneMapped={false} />
      </mesh>
      <mesh position={[0, 4.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.4, 0.04, 8, 64]} />
        <meshBasicMaterial color="#cfd6ff" toneMapped={false} />
      </mesh>
      {/* мебель и свет */}
      <Plant p={[-7, -7]} s={1.2} />
      <Plant p={[7, -7]} s={1.2} />
      <Plant p={[-7, 7]} s={1.2} />
      <Plant p={[7, 7]} s={1.2} />
      <FloorLamp p={[-3.6, 4.2]} />
      <FloorLamp p={[3.6, 4.2]} />
      <Bench p={[-6, 3.4]} rot={Math.PI / 2} len={2.2} />
      <Bench p={[6, 3.4]} rot={Math.PI / 2} len={2.2} />
      {/* лобби и ресепшен */}
      <Bench p={[-12, 16.7]} len={3} />
      <Bench p={[12, 16.7]} len={3} />
      <FloorLamp p={[-16, 16.6]} />
      <FloorLamp p={[16, 16.6]} />
      <Plant p={[-19, 15.5]} s={1.3} />
      <Plant p={[19, 15.5]} s={1.3} />
      <Pendant p={[-2, 3.1, 16.4]} c="#ffd9a8" r={0.3} />
      <Pendant p={[0, 3.1, 16.4]} c="#ffd9a8" r={0.3} />
      <Pendant p={[2, 3.1, 16.4]} c="#ffd9a8" r={0.3} />
      <Label text="VOLNA FILM" color="#f4de8f" position={[0, 2.4, 17.75]} rotation={[0, Math.PI, 0]} width={4.4} />
      <pointLight position={[0, 3.5, 2]} intensity={26} distance={20} color="#ffe9d2" />
      <pointLight position={[0, 3.5, 13]} intensity={16} distance={18} color="#cfd6ff" />
    </group>
  )
}
