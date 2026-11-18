import { useSyncExternalStore } from 'react'

// Минимальный стор (без зависимостей). Мутабельные данные для useFrame лежат в `rt`,
// реактивные (UI) — в state.
const listeners = new Set()
let state = { started: false, modal: null, nearby: null, locked: false }

export const rt = {
  fly: null, // { x, z, yaw } — цель плавного перелёта
  keys: new Set(),
  yaw: 0,
  pitch: 0,
  joy: { x: 0, y: 0 }, // левый стик: ходьба (-1..1)
  look: { x: 0, y: 0 }, // правый стик: обзор (-1..1)
  touch: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
}

export const getState = () => state
export const setState = (patch) => {
  const next = { ...state, ...patch }
  if (Object.keys(patch).every((k) => state[k] === next[k])) return
  state = next
  listeners.forEach((l) => l())
}
export const useStore = (sel) =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => sel(state),
  )

export function exitPointerLock() {
  if (document.pointerLockElement) document.exitPointerLock()
}

export function openModal(id) {
  exitPointerLock()
  rt.keys.clear()
  rt.fly = null
  setState({ modal: id })
}
export function closeModal() {
  setState({ modal: null })
}
