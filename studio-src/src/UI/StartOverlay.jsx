import { setState, rt } from '../store'
import { BRAND } from '../data/content'

export default function StartOverlay() {
  const enter = () => setState({ started: true })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080c]/90 p-4 backdrop-blur-md">
      <div className="glass w-full max-w-lg rounded-2xl p-7 text-center">
        <div className="wave-text text-4xl font-light tracking-[0.35em]">VOLNA</div>
        <div className="mt-1 text-xs uppercase tracking-[0.5em] text-white/50">film · 3D-студия</div>
        <p className="mt-5 text-sm text-white/70">Прогуляйтесь по студии: кинотеатр с шоурилом, библиотека со статьями и отдел продаж со сметой.</p>
        {rt.touch ? (
          <div className="mt-5 grid grid-cols-2 gap-2 text-left text-xs text-white/75">
            <div className="rounded-lg bg-white/5 p-3"><b>Левый стик</b><br />ходить</div>
            <div className="rounded-lg bg-white/5 p-3"><b>Правый стик</b><br />осмотреться</div>
            <div className="rounded-lg bg-white/5 p-3"><b>Тап по центру</b><br />или кнопка «Открыть» у зоны</div>
            <div className="rounded-lg bg-white/5 p-3"><b>Кнопки внизу</b><br />быстрый перелёт по зонам</div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2 text-left text-xs text-white/75">
            <div className="rounded-lg bg-white/5 p-3"><b>WASD / стрелки</b><br />ходить · Shift — бег</div>
            <div className="rounded-lg bg-white/5 p-3"><b>Мышь</b><br />осмотр (клик по сцене), Esc — выйти</div>
            <div className="rounded-lg bg-white/5 p-3"><b>E или клик</b><br />открыть зону рядом</div>
            <div className="rounded-lg bg-white/5 p-3"><b>1 · 2 · 3 · 4</b><br />быстрый перелёт по зонам</div>
          </div>
        )}
        <button onClick={enter} className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110" style={{ background: 'linear-gradient(90deg,#fbfd76,#f2a38a,#8a93ff)' }}>
          Войти в студию
        </button>
        <a href={BRAND.siteUrl} className="mt-3 inline-block text-xs text-white/45 hover:text-white">← Вернуться на обычный сайт</a>
      </div>
    </div>
  )
}
