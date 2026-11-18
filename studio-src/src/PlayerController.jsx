import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rt, getState, setState, openModal } from './store'
import { COLLIDERS, BOUNDS, ZONES, SPAWN, zoneAt } from './world'

const R = 0.45
const EYE = 1.7
const WALK = 4.2
const RUN = 7.5

// Окружность игрока против AABB: выталкивание из стен и мебели.
function resolve(x, z) {
  x = THREE.MathUtils.clamp(x, BOUNDS.minX, BOUNDS.maxX)
  z = THREE.MathUtils.clamp(z, BOUNDS.minZ, BOUNDS.maxZ)
  for (const [x0, x1, z0, z1] of COLLIDERS) {
    const cx = THREE.MathUtils.clamp(x, x0, x1)
    const cz = THREE.MathUtils.clamp(z, z0, z1)
    const dx = x - cx
    const dz = z - cz
    const d2 = dx * dx + dz * dz
    if (d2 >= R * R) continue
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2)
      const k = (R - d) / d
      x += dx * k
      z += dz * k
    } else {
      const l = x - x0, r = x1 - x, t = z - z0, b = z1 - z
      const m = Math.min(l, r, t, b)
      if (m === l) x = x0 - R
      else if (m === r) x = x1 + R
      else if (m === t) z = z0 - R
      else z = z1 + R
    }
  }
  return [x, z]
}

export function flyTo(id) {
  const zn = ZONES[id]
  if (!zn) return
  if (document.pointerLockElement) document.exitPointerLock() // курсор освобождается
  rt.fly = { ...zn.fly }
}

export default function PlayerController() {
  const { camera, gl } = useThree()
  const pos = useRef({ x: SPAWN.x, z: SPAWN.z })
  const vel = useRef({ x: 0, z: 0 })
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  useEffect(() => {
    rt.yaw = SPAWN.yaw
    rt.pitch = 0
    const el = gl.domElement
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)

    const onKey = (e) => {
      const s = getState()
      if (e.type === 'keyup') { rt.keys.delete(e.code); return }
      if (!s.started || s.modal || typing(e)) return
      const k = e.code
      const zid = Object.keys(ZONES).find((id) => k === 'Digit' + ZONES[id].key || k === 'Numpad' + ZONES[id].key)
      if (zid) { if (!e.repeat) flyTo(zid); return }
      if (k === 'KeyE') { if (!e.repeat && s.nearby) openModal(ZONES[s.nearby].modal); return }
      rt.keys.add(k)
      if (/^(KeyW|KeyA|KeyS|KeyD|Arrow(Up|Down|Left|Right))$/.test(k)) rt.fly = null
    }
    const onMove = (e) => {
      if (document.pointerLockElement !== el) return
      rt.yaw -= e.movementX * 0.0022
      rt.pitch = THREE.MathUtils.clamp(rt.pitch - e.movementY * 0.0022, -1.35, 1.35)
      rt.fly = null
    }
    const onLockChange = () => {
      const locked = document.pointerLockElement === el
      setState({ locked })
      if (!locked) rt.keys.clear()
    }
    const onClick = () => {
      const s = getState()
      if (!s.started || s.modal || rt.touch) return
      if (document.pointerLockElement !== el) {
        const p = el.requestPointerLock?.()
        if (p && p.catch) p.catch(() => {})
        return
      }
      if (s.nearby) openModal(ZONES[s.nearby].modal)
    }
    // Тач: быстрый тап по центру экрана открывает ближайшую зону
    let tap = null
    const tDown = (e) => { if (e.pointerType === 'touch') tap = { x: e.clientX, y: e.clientY, t: performance.now() } }
    const tUp = (e) => {
      if (e.pointerType !== 'touch' || !tap) return
      const s = getState()
      const w = window.innerWidth
      const h = window.innerHeight
      const quick = performance.now() - tap.t < 400 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 14
      const center = Math.abs(e.clientX - w / 2) < w * 0.22 && Math.abs(e.clientY - h / 2) < h * 0.28
      tap = null
      if (quick && center && s.started && !s.modal && s.nearby && e.target === el) openModal(ZONES[s.nearby].modal)
    }
    const blur = () => rt.keys.clear()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', blur)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('pointerlockchange', onLockChange)
    el.addEventListener('click', onClick)
    el.addEventListener('pointerdown', tDown)
    window.addEventListener('pointerup', tUp)
    el.style.touchAction = 'none'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', blur)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('pointerlockchange', onLockChange)
      el.removeEventListener('click', onClick)
      el.removeEventListener('pointerdown', tDown)
      window.removeEventListener('pointerup', tUp)
    }
  }, [gl])

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const p = pos.current
    const v = vel.current
    const s = getState()
    const active = s.started && !s.modal
    let ix = 0
    let iz = 0
    if (active) {
      const k = rt.keys
      if (k.has('KeyW') || k.has('ArrowUp')) iz -= 1
      if (k.has('KeyS') || k.has('ArrowDown')) iz += 1
      if (k.has('KeyA')) ix -= 1
      if (k.has('KeyD')) ix += 1
      if (k.has('ArrowLeft')) rt.yaw += 1.8 * dt
      if (k.has('ArrowRight')) rt.yaw -= 1.8 * dt
      ix += rt.joy.x
      iz += rt.joy.y
      if (rt.look.x || rt.look.y) {
        rt.yaw -= rt.look.x * 2.4 * dt
        rt.pitch = THREE.MathUtils.clamp(rt.pitch - rt.look.y * 1.6 * dt, -1.35, 1.35)
        rt.fly = null
      }
      if (rt.joy.x || rt.joy.y) rt.fly = null
    }
    const speed = rt.keys.has('ShiftLeft') || rt.keys.has('ShiftRight') ? RUN : WALK
    const len = Math.hypot(ix, iz) || 1
    const mag = Math.min(1, len)
    const c = Math.cos(rt.yaw)
    const sn = Math.sin(rt.yaw)
    const tx = ((ix * c + iz * sn) / len) * speed * mag
    const tz = ((-ix * sn + iz * c) / len) * speed * mag
    const a = 1 - Math.exp(-12 * dt)
    v.x += (tx - v.x) * a
    v.z += (tz - v.z) * a

    if (rt.fly && s.started) {
      // плавный перелёт к зоне (damp)
      const f = rt.fly
      const k = 1 - Math.exp(-3.2 * dt)
      p.x += (f.x - p.x) * k
      p.z += (f.z - p.z) * k
      let dy = f.yaw - rt.yaw
      dy = Math.atan2(Math.sin(dy), Math.cos(dy))
      rt.yaw += dy * k
      rt.pitch += (0 - rt.pitch) * k
      v.x = v.z = 0
      if (Math.hypot(f.x - p.x, f.z - p.z) < 0.03 && Math.abs(dy) < 0.01) rt.fly = null
    } else {
      const [nx, nz] = resolve(p.x + v.x * dt, p.z + v.z * dt)
      p.x = nx
      p.z = nz
    }

    const bob = !rt.fly && Math.hypot(v.x, v.z) > 0.5 ? Math.sin(performance.now() * 0.009) * 0.025 : 0
    euler.current.set(rt.pitch, rt.yaw, 0)
    camera.quaternion.setFromEuler(euler.current)
    camera.position.set(p.x, EYE + bob, p.z)

    const near = active ? zoneAt(p.x, p.z) : null
    if (near !== s.nearby) setState({ nearby: near })
  })
  return null
}
