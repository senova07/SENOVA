import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { hexVersTsl, tslVersHex, tslVersRvb, type Tsl } from '../../../lib/couleur'
import { deplacerLuminosite, deplacerSurRoue, positionDepuisTeinte, tslDepuisClic } from './roue'

interface Props {
  libelle: string
  /** Couleur courante, « #RRGGBB ». */
  valeur: string
  onChange(hex: string): void
  taille?: number
}

/** Dessine la roue en luminosité moyenne : teinte autour du cercle, saturation du centre vers le bord. */
function dessinerRoue(canvas: HTMLCanvasElement, taille: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const px = Math.round(taille * Math.min(2, window.devicePixelRatio || 1))
  canvas.width = px
  canvas.height = px
  const image = ctx.createImageData(px, px)
  const r = px / 2
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const dx = x - r + 0.5
      const dy = y - r + 0.5
      const d = Math.hypot(dx, dy)
      if (d > r) continue
      const { t, s } = tslDepuisClic(dx, dy, r, 0.5)
      const { r: R, g: G, b: B } = tslVersRvb({ t, s, l: 0.5 })
      const i = (y * px + x) * 4
      image.data[i] = R
      image.data[i + 1] = G
      image.data[i + 2] = B
      image.data[i + 3] = d > r - 1 ? Math.round(255 * (r - d)) : 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

/**
 * Roue chromatique (d'après la maquette, en teinte / saturation / luminosité) : un point sur la roue règle la teinte et la
 * saturation, le curseur vertical la luminosité. Les deux sont des `slider` ARIA utilisables aux flèches (Maj : pas plus grand).
 */
export function RoueChromatique({ libelle, valeur, onChange, taille = 168 }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  // On garde la teinte même quand la couleur devient grise ou noire, sinon elle se perdrait à l'aller-retour hexadécimal.
  const [etat, setEtat] = useState<{ tsl: Tsl; hex: string }>(() => ({ tsl: hexVersTsl(valeur), hex: valeur.toUpperCase() }))
  if (valeur.toUpperCase() !== etat.hex) setEtat({ tsl: hexVersTsl(valeur), hex: valeur.toUpperCase() })
  const { tsl } = etat

  useEffect(() => {
    if (canvas.current) dessinerRoue(canvas.current, taille)
  }, [taille])

  const emettre = (suivant: Tsl) => {
    const hex = tslVersHex(suivant)
    setEtat({ tsl: suivant, hex })
    onChange(hex)
  }

  const surRoue = (e: PointerEvent<HTMLDivElement>) => {
    const zone = e.currentTarget.getBoundingClientRect()
    emettre(tslDepuisClic(e.clientX - zone.left - zone.width / 2, e.clientY - zone.top - zone.height / 2, zone.width / 2, tsl.l))
  }
  const surLuminosite = (e: PointerEvent<HTMLDivElement>) => {
    const zone = e.currentTarget.getBoundingClientRect()
    emettre({ ...tsl, l: Math.max(0, Math.min(1, 1 - (e.clientY - zone.top) / zone.height)) })
  }
  const glisser = (action: (e: PointerEvent<HTMLDivElement>) => void) => ({
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      action(e)
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.buttons) action(e)
    },
  })

  const clavierRoue = (e: KeyboardEvent) => {
    const suivant = deplacerSurRoue(tsl, e.key, e.shiftKey)
    if (!suivant) return
    e.preventDefault()
    emettre(suivant)
  }
  const clavierLuminosite = (e: KeyboardEvent) => {
    const l = deplacerLuminosite(tsl.l, e.key, e.shiftKey)
    if (l === null) return
    e.preventDefault()
    emettre({ ...tsl, l })
  }

  const repere = positionDepuisTeinte(tsl.t, tsl.s, taille / 2)
  const variables = {
    '--taille': `${taille}px`,
    '--c': valeur,
    '--x': `${repere.x}px`,
    '--y': `${repere.y}px`,
    '--l': 1 - tsl.l,
    '--teinte': tslVersHex({ ...tsl, l: 0.5 }),
  } as CSSProperties

  return (
    <div className="roue" style={variables}>
      <div
        className="roue__disque"
        role="slider"
        tabIndex={0}
        aria-label={`${libelle} : teinte et intensité`}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(tsl.t)}
        aria-valuetext={`Teinte ${Math.round(tsl.t)} degrés, intensité ${Math.round(tsl.s * 100)} %`}
        onKeyDown={clavierRoue}
        {...glisser(surRoue)}
      >
        <canvas ref={canvas} aria-hidden="true" />
        <span className="roue__repere" />
      </div>
      <div
        className="roue__luminosite"
        role="slider"
        tabIndex={0}
        aria-label={`${libelle} : luminosité`}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tsl.l * 100)}
        onKeyDown={clavierLuminosite}
        {...glisser(surLuminosite)}
      >
        <span className="roue__poignee" />
      </div>
    </div>
  )
}
