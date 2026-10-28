import { useEffect, useMemo, useRef } from 'react'
import { onScroll } from '../lib/motion'

// A bundle of fine gold threads that twist like a silk ribbon.
function bundle({ base, amp, freq, phase, count, spread, width = 1600, steps = 90 }) {
  return Array.from({ length: count }, (_, i) => {
    const k = i / (count - 1) - 0.5
    let d = ''
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const y = base
        + Math.sin(t * Math.PI * 2 * freq + phase + k * 1.1) * amp
        + k * spread * (1 + 0.55 * Math.sin(t * Math.PI * 2 * 0.55 + phase))
      d += `${s ? 'L' : 'M'}${(t * width).toFixed(1)} ${y.toFixed(1)}`
    }
    return { d, o: 0.12 + (1 - Math.abs(k) * 1.6) * 0.3, w: 0.6 + (1 - Math.abs(k) * 1.4) * 0.6 }
  })
}

const BUNDLES = [
  { id: 'a', speed: 0.05, anim: 'driftA', cfg: { base: 230, amp: 70, freq: 1.1, phase: 0, count: 10, spread: 80 } },
  { id: 'b', speed: 0.1, anim: 'driftB', cfg: { base: 600, amp: 95, freq: 0.8, phase: 2.2, count: 9, spread: 100 } },
  { id: 'c', speed: 0.16, anim: 'driftA', cfg: { base: 900, amp: 55, freq: 1.5, phase: 4.1, count: 7, spread: 50 } },
]

export default function ThreadBackground() {
  const layers = useRef([])
  const threads = useMemo(() => BUNDLES.map((b) => ({ ...b, lines: bundle(b.cfg) })), [])
  // Parallax: each bundle moves at a different speed as you scroll.
  useEffect(() => onScroll((y) => {
    layers.current.forEach((el, i) => el && el.setAttribute('transform', `translate(0 ${(-y * BUNDLES[i].speed).toFixed(1)})`))
  }), [])
  return (
    <svg className="threads" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="thread-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b8a47e" stopOpacity="0" />
          <stop offset=".25" stopColor="#d8c79f" stopOpacity="1" />
          <stop offset=".7" stopColor="#b8a47e" stopOpacity=".9" />
          <stop offset="1" stopColor="#b8a47e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {threads.map((b, i) => (
        <g key={b.id} ref={(el) => (layers.current[i] = el)}>
          <g className={`thread-g ${b.anim}`} style={{ animationDelay: `${i * -7}s` }}>
            {b.lines.map((l, j) => (
              <path key={j} d={l.d} fill="none" stroke="url(#thread-fade)" strokeWidth={l.w} strokeOpacity={l.o} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}
