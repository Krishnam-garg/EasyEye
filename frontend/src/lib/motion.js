import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Set true to force full animation even if the OS has "reduce motion" switched on (e.g. for a demo).
export const FORCE_FULL_MOTION = false

const listeners = new Set()
let lenis = null

// Subscribe to scroll position (px). Returns an unsubscribe function.
export const onScroll = (fn) => { listeners.add(fn); fn(window.scrollY); return () => listeners.delete(fn) }
export const scrollToTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0))

export function initMotion() {
  if (lenis) return
  const root = document.documentElement
  if (FORCE_FULL_MOTION) root.dataset.motion = 'full'
  let queued = false
  window.addEventListener('scroll', () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; listeners.forEach((fn) => fn(window.scrollY)) })
  }, { passive: true })

  const reduced = !FORCE_FULL_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return                       // gentle fades only; no inertia scrolling
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 })
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf) }
  requestAnimationFrame(raf)
}
