import type { CSSProperties } from 'react'
import { Icone } from '@/ui/Icone'
import { PALETTES } from '../rendu'
import type { ModifierCharte } from './types'

interface Props {
  principale: string
  accent: string
  /** Palettes tirées du logo : [principale, accent, fond]. */
  palettesLogo: string[][]
  onCharte: ModifierCharte
}

const memes = (a: string, b: string) => a.toUpperCase() === b.toUpperCase()

/** Palettes proposées à partir du logo, puis palettes prêtes à l'emploi. */
export function PalettesCouleurs({ principale, accent, palettesLogo, onCharte }: Props) {
  const choisir = (p: string, a: string) => onCharte({ couleurPrincipale: p, couleurAccent: a })
  return (
    <>
      <div className="apparence-bloc">
        <span className="apparence-sous-titre" id="palettes-logo">Palettes proposées à partir de votre logo</span>
        <div className="palettes-logo" role="group" aria-labelledby="palettes-logo">
          {palettesLogo.map((p, i) => {
            const [p0 = principale, p1 = accent] = p
            const actif = memes(principale, p0) && memes(accent, p1)
            return (
              <button key={p.join()} type="button" className="palette-logo" aria-pressed={actif} aria-label={`Palette ${i + 1}`} onClick={() => choisir(p0, p1)}>
                {p.map((c) => <i key={c} style={{ '--c': c } as CSSProperties} />)}
                {actif ? <Icone nom="valider" taille={12} poids="bold" className="palette-logo__coche" /> : null}
              </button>
            )
          })}
        </div>
      </div>
      <div className="apparence-bloc">
        <span className="apparence-sous-titre" id="palettes-pretes">Palettes prêtes à l’emploi</span>
        <div className="palettes-pretes" role="group" aria-labelledby="palettes-pretes">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="palette-prete"
              aria-pressed={memes(principale, p.principale) && memes(accent, p.accent)}
              style={{ '--p': p.principale, '--a': p.accent } as CSSProperties}
              onClick={() => choisir(p.principale, p.accent)}
            >
              <span className="palette-prete__nom">{p.libelle}</span>
              <span className="palette-prete__apercu" aria-hidden="true">
                <span className="palette-prete__bandeau" />
                {[0, 1, 2].map((r) => (
                  <span key={r} className="palette-prete__rangee"><i /><b /><b /></span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
