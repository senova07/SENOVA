import { useId, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { ArrowsHorizontal, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { Icone } from '@/ui/Icone'
import { zoomMoins, zoomPlus, type ModeZoom } from '@/ui/AtelierFonctions'
import './Atelier.css'

/* ───── Atelier : deux colonnes + pied fixe ───── */

type Volet = 'modification' | 'apercu'

interface AtelierProps {
  /** En-tête de page (par ex. `EntetePage`). */
  entete?: ReactNode
  /** Colonne de gauche : les `SectionAtelier`. */
  formulaire: ReactNode
  /** Colonne de droite : `BarreApercu` + `ZoneApercu`. */
  apercu: ReactNode
  /** Barre d'actions fixe : `PiedAtelier`. */
  pied: ReactNode
  /** Volet visible sous 1200 px. Contrôlé si `volet` est fourni (utile pour revenir à « Modification » avant `allerASection`). */
  volet?: Volet
  onVolet?(volet: Volet): void
}

const VOLETS: readonly { id: Volet; libelle: string }[] = [
  { id: 'modification', libelle: 'Modification' },
  { id: 'apercu', libelle: 'Aperçu' },
]

/**
 * Mise en page des écrans « Nouveau devis » et « Apparence ». À poser directement dans `.page` :
 * elle prend la hauteur de la fenêtre, seule la colonne de gauche et l'aperçu défilent.
 */
export function Atelier({ entete, formulaire, apercu, pied, volet, onVolet }: AtelierProps) {
  const [voletInterne, setVoletInterne] = useState<Volet>('modification')
  const actif = volet ?? voletInterne
  const choisir = (v: Volet) => {
    setVoletInterne(v)
    onVolet?.(v)
  }
  const prefixe = useId()

  return (
    <div className="atelier">
      {entete}
      <div className="atelier__volets" role="tablist" aria-label="Affichage">
        {VOLETS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            id={`${prefixe}-${v.id}`}
            aria-selected={actif === v.id}
            aria-controls={`${prefixe}-panneau-${v.id}`}
            tabIndex={actif === v.id ? 0 : -1}
            onClick={() => choisir(v.id)}
            onKeyDown={(ev) => {
              if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return
              ev.preventDefault()
              const autre = VOLETS.find((o) => o.id !== v.id)!
              choisir(autre.id)
              document.getElementById(`${prefixe}-${autre.id}`)?.focus()
            }}
          >
            {v.libelle}
          </button>
        ))}
      </div>
      <div className="atelier__grille" data-volet={actif}>
        <div className="atelier__formulaire" id={`${prefixe}-panneau-modification`} role="tabpanel" aria-labelledby={`${prefixe}-modification`}>
          {formulaire}
        </div>
        <div className="atelier__apercu" id={`${prefixe}-panneau-apercu`} role="tabpanel" aria-labelledby={`${prefixe}-apercu`}>
          {apercu}
        </div>
      </div>
      {pied}
    </div>
  )
}

/* ───── SectionAtelier : carte numérotée repliable ───── */

interface SectionAtelierProps {
  /** Ancre : sert à `allerASection(id)` ; le corps a l'id `${id}-corps`. */
  id: string
  numero: number
  titre: string
  /** Résumé affiché à droite quand la section est repliée. */
  resume?: ReactNode
  statut?: 'fait' | 'alerte'
  /** Contrôlée si fournie (avec `onBasculer`) ; sinon la section gère son état. */
  ouverte?: boolean
  ouverteParDefaut?: boolean
  onBasculer?(ouverte: boolean): void
  children: ReactNode
}

export function SectionAtelier({
  id,
  numero,
  titre,
  resume,
  statut,
  ouverte,
  ouverteParDefaut = false,
  onBasculer,
  children,
}: SectionAtelierProps) {
  const [ouverteInterne, setOuverteInterne] = useState(ouverteParDefaut)
  const estOuverte = ouverte ?? ouverteInterne
  const basculer = () => {
    setOuverteInterne(!estOuverte)
    onBasculer?.(!estOuverte)
  }

  return (
    <section className="section-atelier" id={id} data-ouverte={estOuverte || undefined}>
      <button type="button" className="section-atelier__tete" aria-expanded={estOuverte} aria-controls={`${id}-corps`} onClick={basculer}>
        <span className="section-atelier__numero num" data-statut={statut}>
          {numero}
        </span>
        <span className="section-atelier__titre">{titre}</span>
        {!estOuverte && resume ? <span className="section-atelier__resume">{resume}</span> : null}
        <Icone nom="chevron_bas" taille={16} poids="bold" className="section-atelier__chevron" />
      </button>
      <div className="section-atelier__corps" id={`${id}-corps`} hidden={!estOuverte}>
        {children}
      </div>
    </section>
  )
}

/* ───── BarreApercu ───── */

interface BarreApercuProps {
  zoom: ModeZoom
  /** Échelle effective (celle de `useEchelleApercu`), pour le pourcentage et les pas. */
  echelle: number
  onZoom(zoom: ModeZoom): void
  /** À gauche des contrôles de zoom : par ex. un `ControleSegmente`. */
  gauche?: ReactNode
  /** Entre le zoom et l'action : par ex. « Page 1 sur 2 ». */
  children?: ReactNode
  /** À droite : par ex. « Modifier l'apparence ». */
  droite?: ReactNode
}

export function BarreApercu({ zoom, echelle, onZoom, gauche, children, droite }: BarreApercuProps) {
  return (
    <div className="barre-apercu">
      {gauche}
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
      {children ? <span className="barre-apercu__info">{children}</span> : null}
      <span className="barre-apercu__espace" />
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
