import { useEffect, useState } from 'react'
import { useListeClients } from './useListeClients'
import {
  COLONNES_CLIENT,
  compterClients,
  filtrerClients,
  paginer,
  tagsConnus,
  trierClients,
  triSuivant,
  type CleTriClient,
  type ColonneClient,
  type OngletClients,
  type TriClient,
} from './vueClients'

const PAR_PAGE = 12

/**
 * État de la liste : recherche (serveur), filtres, tri, colonnes et page.
 * `version` change = rechargement des listes.
 */
export function useVueClients(onglet: OngletClients, version: number) {
  const [saisie, setSaisie] = useState('')
  const [terme, setTerme] = useState('')
  const [tag, setTag] = useState('')
  const [soldeDu, setSoldeDu] = useState(false)
  const [tri, setTri] = useState<TriClient | null>(null)
  const [numero, setNumero] = useState(1)
  const [colonnes, setColonnes] = useState<ReadonlySet<ColonneClient>>(
    new Set(COLONNES_CLIENT.map((c) => c.id)),
  )

  useEffect(() => {
    const minuteur = window.setTimeout(() => {
      setTerme(saisie.trim())
      setNumero(1)
    }, 300)
    return () => window.clearTimeout(minuteur)
  }, [saisie])

  const archives = onglet === 'archives'
  // Ensemble « actifs sans recherche » : source des chiffres de l'en-tête et de la liste par défaut.
  const base = useListeClients(true, '', false, version)
  const vue = useListeClients(archives || Boolean(terme), terme, archives, version)
  const source = archives || terme ? vue : base

  const tags = tagsConnus(source.clients ?? [])
  const tagValide = tags.includes(tag) ? tag : ''
  const tries = trierClients(filtrerClients(source.clients ?? [], { onglet, tag: tagValide, soldeDu }), tri)
  const { pages, page, debut } = paginer(tries.length, numero, PAR_PAGE)

  /** Un changement de filtre ou de tri ramène à la première page. */
  const premierePage = () => setNumero(1)
  const avecRetour =
    <T,>(changer: (v: T) => void) =>
    (v: T) => {
      changer(v)
      premierePage()
    }

  return {
    saisie,
    changerSaisie: setSaisie,
    terme,
    tag: tagValide,
    tags,
    changerTag: avecRetour(setTag),
    soldeDu,
    changerSolde: avecRetour(setSoldeDu),
    tri,
    trier: avecRetour((cle: CleTriClient) => setTri((t) => triSuivant(t, cle))),
    colonnes,
    basculerColonne: (c: ColonneClient) =>
      setColonnes((s) => {
        const suite = new Set(s)
        if (!suite.delete(c)) suite.add(c)
        return suite
      }),
    base,
    source,
    chiffres: base.clients ? compterClients(base.clients) : null,
    total: tries.length,
    affichees: tries.slice(debut, debut + PAR_PAGE),
    page,
    pages,
    debut,
    allerPage: setNumero,
    premierePage,
    filtre: Boolean(terme || tagValide || soldeDu),
  }
}
