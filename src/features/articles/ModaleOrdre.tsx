import { useState } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Icone } from '@/ui/Icone'
import { Dialogue } from '@/ui/Dialogue'
import { apiArticles } from '@/services/articlesApi'
import { useToast } from '@/store/toastContext'
import type { Article } from '@shared/articles'

interface Props {
  articles: Article[]
  onEnregistre(): void
  onFermer(): void
}

/** Ordre du catalogue : glisser-déposer, flèches, ou saisie du rang. */
export function ModaleOrdre({ articles, onEnregistre, onFermer }: Props) {
  const { notifier } = useToast()
  const [liste, setListe] = useState(() =>
    [...articles].sort((a, b) => a.ordre - b.ordre || Number(a.id) - Number(b.id)),
  )
  const [tenu, setTenu] = useState<number | null>(null)
  const [survol, setSurvol] = useState<number | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const initial = [...articles].sort((a, b) => a.ordre - b.ordre || Number(a.id) - Number(b.id))
  const change = liste.some((a, i) => a.id !== initial[i]?.id)

  const deplacer = (depuis: number, vers: number) => {
    const cible = Math.min(liste.length - 1, Math.max(0, vers))
    if (cible === depuis) return
    const suite = [...liste]
    const [element] = suite.splice(depuis, 1)
    if (element) suite.splice(cible, 0, element)
    setListe(suite)
  }

  const lacher = () => {
    if (tenu !== null && survol !== null) deplacer(tenu, survol)
    setTenu(null)
    setSurvol(null)
  }

  const enregistrer = async () => {
    setEnCours(true)
    setErreur('')
    try {
      await apiArticles.ordonner(liste.map((a) => a.id))
      notifier('Ordre enregistré', { ton: 'succes' })
      onEnregistre()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Dialogue
      ouvert
      onFermer={onFermer}
      titre="Ordre des articles"
      soustitre="Glissez un article, utilisez les flèches ou tapez son rang."
      pied={
        <>
          <Bouton onClick={onFermer} disabled={enCours}>
            Annuler
          </Bouton>
          <Bouton
            variante="primaire"
            onClick={() => void enregistrer()}
            disabled={enCours || !change}
          >
            Enregistrer l’ordre
          </Bouton>
        </>
      }
    >
      {erreur ? (
        <p className="alerte-form" role="alert">
          {erreur}
        </p>
      ) : null}
      <ol className="ordre">
        {liste.map((a, rang) => (
          <li
            key={a.id}
            className={[
              'ordre__ligne',
              tenu === rang ? 'ordre__ligne--tenue' : '',
              survol === rang && tenu !== rang ? 'ordre__ligne--cible' : '',
            ].join(' ')}
            draggable
            onDragStart={() => setTenu(rang)}
            onDragOver={(e) => {
              e.preventDefault()
              setSurvol(rang)
            }}
            onDrop={lacher}
            onDragEnd={() => {
              setTenu(null)
              setSurvol(null)
            }}
          >
            <Icone nom="glisser" taille={20} className="ordre__poignee" />
            <input
              key={`${a.id}-${rang}`}
              className="champ__saisie ordre__rang"
              type="number"
              min={1}
              max={liste.length}
              defaultValue={rang + 1}
              aria-label={`Rang de ${a.nom}`}
              onBlur={(e) => deplacer(rang, Number(e.target.value) - 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  deplacer(rang, Number(e.currentTarget.value) - 1)
                }
              }}
            />
            <span className="ordre__nom">{a.nom}</span>
            <Bouton
              variante="fantome"
              icone="haut"
              aria-label={`Monter ${a.nom}`}
              disabled={rang === 0}
              onClick={() => deplacer(rang, rang - 1)}
            />
            <Bouton
              variante="fantome"
              icone="bas"
              aria-label={`Descendre ${a.nom}`}
              disabled={rang === liste.length - 1}
              onClick={() => deplacer(rang, rang + 1)}
            />
          </li>
        ))}
      </ol>
    </Dialogue>
  )
}
