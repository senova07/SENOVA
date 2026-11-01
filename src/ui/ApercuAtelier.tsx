import type { CSSProperties, ReactNode, Ref } from 'react'
import { ArrowsHorizontal, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { zoomMoins, zoomPlus, type ModeZoom } from '@/ui/AtelierFonctions'
import './Atelier.css'

/* ───── BarreApercu ───── */

interface BarreApercuProps {
  zoom: ModeZoom
  /** Échelle effective (celle de `useEchelleApercu`), pour le pourcentage et les pas. */
  echelle: number
  onZoom(zoom: ModeZoom): void
  /** À gauche des contrôles de zoom : par ex. un `ControleSegmente`. */
  gauche?: ReactNode
  /** Après `gauche`, avant le zoom (à droite) : par ex. « Page 1 sur 2 ». */
  children?: ReactNode
  /** À droite : par ex. « Modifier l'apparence ». */
  droite?: ReactNode
}

export function BarreApercu({ zoom, echelle, onZoom, gauche, children, droite }: BarreApercuProps) {
  return (
    <div className="barre-apercu">
      {gauche}
      {children ? <span className="barre-apercu__info">{children}</span> : null}
      <span className="barre-apercu__espace" />
      <div className="zoom" role="group" aria-label="Zoom de l’aperçu">
        <button type="button" className="zoom__ajuster" aria-pressed={zoom === 'ajuster'} onClick={() => onZoom('ajuster')} title="Ajuster à la largeur">
          <ArrowsHorizontal size={15} aria-hidden="true" /> Ajuster
        </button>
        <span className="zoom__sep" aria-hidden="true" />
        <button type="button" className="zoom__icone" onClick={() => onZoom(zoomMoins(echelle))} aria-label="Dézoomer">
          <MagnifyingGlassMinus size={16} aria-hidden="true" />
        </button>
        <span className="zoom__pct num" aria-live="polite">
          {Math.round(echelle * 100)} %
        </span>
        <button type="button" className="zoom__icone" onClick={() => onZoom(zoomPlus(echelle))} aria-label="Zoomer">
          <MagnifyingGlassPlus size={16} aria-hidden="true" />
        </button>
      </div>
      {droite}
    </div>
  )
}

/* ───── ZoneApercu ───── */

interface ZoneApercuProps {
  echelle: number
  /** `zoneRef` de `useEchelleApercu`. */
  ref?: Ref<HTMLDivElement>
  /** La page, à dimensionner avec `var(--echelle)` ou la valeur de `echelle`. */
  children: ReactNode
}

/** Fond gris défilant qui centre la page. Seule la variable `--echelle` est posée en ligne. */
export function ZoneApercu({ echelle, ref, children }: ZoneApercuProps) {
  return (
    <div className="zone-apercu" ref={ref} style={{ '--echelle': echelle } as CSSProperties}>
      {children}
    </div>
  )
}

/* ───── PiedAtelier ───── */

interface PiedAtelierProps {
  /** Texte du statut, fourni par l'appelant : « Enregistré il y a 5 s ». */
  statut: ReactNode
  ton?: 'enregistre' | 'en-cours' | 'non-enregistre'
  /** Boutons, alignés à droite. */
  children: ReactNode
}

export function PiedAtelier({ statut, ton = 'enregistre', children }: PiedAtelierProps) {
  return (
    <div className="pied-atelier">
      <span className="pied-atelier__statut" data-ton={ton} role="status">
        <span className="pied-atelier__pastille" aria-hidden="true" />
        {statut}
      </span>
      <div className="pied-atelier__actions">{children}</div>
    </div>
  )
}
