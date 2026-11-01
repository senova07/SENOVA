import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { hexToHsv, hsvToHex } from './theme'

interface Props {
  value: string
  onChange: (hex: string) => void
  size?: number
  label: string
}

/**
 * Roue chromatique : la teinte tourne autour du cercle, la saturation va du centre (blanc) vers le bord.
 * Le curseur vertical règle la luminosité. Utilisable au clavier (flèches).
 */
export function ColorWheel({ value, onChange, size = 168, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const lastEmitted = useRef(value.toUpperCase())

  // Synchronise si la couleur change ailleurs (palette, saisie)
  useEffect(() => {
    if (value.toUpperCase() !== lastEmitted.current) {
      setHsv(hexToHsv(value))
      lastEmitted.current = value.toUpperCase()
    }
  }, [value])

  // Roue dessinée en pleine luminosité (plus lisible) ; le curseur vertical assombrit
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = Math.round(size * dpr)
    c.width = px; c.height = px
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(px, px)
    const r = px / 2
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const dx = x - r + 0.5, dy = y - r + 0.5
        const d = Math.sqrt(dx * dx + dy * dy)
        const i = (y * px + x) * 4
        if (d > r) { img.data[i + 3] = 0; continue }
        const h = (Math.atan2(dy, dx) * 180) / Math.PI + 180
        const hex = hsvToHex(h, Math.min(1, d / r), 1)
        img.data[i] = parseInt(hex.slice(1, 3), 16)
        img.data[i + 1] = parseInt(hex.slice(3, 5), 16)
        img.data[i + 2] = parseInt(hex.slice(5, 7), 16)
        img.data[i + 3] = d > r - 1 ? Math.round(255 * (r - d)) : 255 // bord adouci
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [size])

  const emit = (next: { h: number; s: number; v: number }) => {
    setHsv(next)
    const hex = hsvToHex(next.h, next.s, next.v)
    lastEmitted.current = hex
    onChange(hex)
  }

  const pickWheel = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - rect.left - rect.width / 2
    const dy = e.clientY - rect.top - rect.height / 2
    const h = (Math.atan2(dy, dx) * 180) / Math.PI + 180
    const s = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (rect.width / 2))
    emit({ ...hsv, h, s })
  }
  const pickV = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    emit({ ...hsv, v: Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)) })
  }
  const drag = (fn: (e: PointerEvent<HTMLDivElement>) => void) => ({
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); fn(e) },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => { if (e.buttons) fn(e) },
  })

  const wheelKeys = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 4
    if (e.key === 'ArrowLeft') emit({ ...hsv, h: (hsv.h - step + 360) % 360 })
    else if (e.key === 'ArrowRight') emit({ ...hsv, h: (hsv.h + step) % 360 })
    else if (e.key === 'ArrowUp') emit({ ...hsv, s: Math.min(1, hsv.s + 0.05) })
    else if (e.key === 'ArrowDown') emit({ ...hsv, s: Math.max(0, hsv.s - 0.05) })
    else return
    e.preventDefault()
  }
  const vKeys = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') emit({ ...hsv, v: Math.min(1, hsv.v + 0.04) })
    else if (e.key === 'ArrowDown') emit({ ...hsv, v: Math.max(0, hsv.v - 0.04) })
    else return
    e.preventDefault()
  }

  // Position du repère (angle 0 = gauche, sens horaire, comme le dessin)
  const angle = ((hsv.h - 180) * Math.PI) / 180
  const mx = size / 2 + Math.cos(angle) * hsv.s * (size / 2)
  const my = size / 2 + Math.sin(angle) * hsv.s * (size / 2)

  return (
    <div className="cwheel">
      <div
        className="cwheel__wheel"
        style={{ width: size, height: size }}
        role="slider"
        tabIndex={0}
        aria-label={`${label} : teinte et intensité`}
        aria-valuetext={value}
        onKeyDown={wheelKeys}
        {...drag(pickWheel)}
      >
        <canvas ref={canvasRef} style={{ width: size, height: size }} />
        <span className="cwheel__marker" style={{ left: mx, top: my, background: value }} />
      </div>
      <div
        className="cwheel__v"
        style={{ height: size, background: `linear-gradient(to bottom, ${hsvToHex(hsv.h, hsv.s, 1)}, #000)` }}
        role="slider"
        tabIndex={0}
        aria-label={`${label} : luminosité`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v * 100)}
        onKeyDown={vKeys}
        {...drag(pickV)}
      >
        <span className="cwheel__v-thumb" style={{ top: (1 - hsv.v) * size, background: value }} />
      </div>
    </div>
  )
}
