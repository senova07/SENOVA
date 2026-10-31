import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formaterEuro } from '@/lib/format'
import { sansAccent } from '@/lib/texte'
import { aujourdhuiIso, dateFinValidite, totauxDevis } from './calculs'
import type { CleTri, LigneListe, Tri } from './ListeDevis'
import { magasinDevis } from './magasin'
import type { StatutDevis } from './types'

export const PAR_PAGE = 12

export const ONGLETS: readonly { id: string; libelle: string; statuts?: readonly StatutDevis[] }[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'brouillons', libelle: 'Brouillons', statuts: ['brouillon'] },
  { id: 'envoyes', libelle: 'Envoyés', statuts: ['envoye'] },
  { id: 'acceptes', libelle: 'Acceptés', statuts: ['accepte'] },
  { id: 'refuses', libelle: 'Refusés', statuts: ['refuse', 'expire'] },
]

export const OPTIONS_TRI: { valeur: string; cle: CleTri; sens: Tri['sens']; libelle: string }[] = [
  { valeur: 'date:desc', cle: 'date', sens: 'desc', libelle: 'Plus récents' },
  { valeur: 'date:asc', cle: 'date', sens: 'asc', libelle: 'Plus anciens' },
  { valeur: 'ttc:desc', cle: 'ttc', sens: 'desc', libelle: 'Montant décroissant' },
  { valeur: 'ttc:asc', cle: 'ttc', sens: 'asc', libelle: 'Montant croissant' },
  { valeur: 'client:asc', cle: 'client', sens: 'asc', libelle: 'Client A–Z' },
  { valeur: 'numero:desc', cle: 'numero', sens: 'desc', libelle: 'Numéro' },
]

const comparerTexte = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare

function valeurTri(l: LigneListe, cle: CleTri): string | number {
  switch (cle) {
    case 'numero':
      return l.devis.numero
    case 'client':
      return l.devis.clientNom
    case 'objet':
      return l.devis.objet
    case 'date':
      return l.devis.dateCreation
    case 'validite':
      return l.fin
    case 'ht':
      return l.totaux.totalHt
    case 'ttc':
      return l.totaux.totalTtc
    case 'statut':
      return l.devis.statut
  }
}

/** Recherche, période, onglet, tri et pagination de la liste ; l'onglet vit dans l'URL (?onglet=). */
export function useVueListeDevis() {
  const tousLesDevis = magasinDevis.useListe()
  const [parametres, setParametres] = useSearchParams()
  const [recherche, setRecherche] = useState('')
  const [periode, setPeriode] = useState('tout')
  const [tri, setTri] = useState<Tri>({ cle: 'date', sens: 'desc' })
  const [numero, setNumero] = useState(1)

  const ongletDemande = parametres.get('onglet')
  const onglet = ONGLETS.find((o) => o.id === ongletDemande) ?? ONGLETS[0]!
  const choisirOnglet = (id: string) => {
    setParametres((p) => {
      const suite = new URLSearchParams(p)
      if (id === 'tous') suite.delete('onglet')
      else suite.set('onglet', id)
      return suite
    })
    setNumero(1)
  }

  const auj = aujourdhuiIso()
  const lignes: LigneListe[] = tousLesDevis.map((devis) => {
    const fin = dateFinValidite(devis)
    const jours = Math.round((new Date(`${fin}T12:00:00`).getTime() - new Date(`${auj}T12:00:00`).getTime()) / 864e5)
    return { devis, totaux: totauxDevis(devis), fin, jours }
  })

  const limite = new Date(`${auj}T12:00:00`)
  limite.setMonth(limite.getMonth() - 3)
  const debutPeriode =
    periode === 'mois' ? auj.slice(0, 8) + '01' : periode === 'trimestre' ? limite.toISOString().slice(0, 10) : ''
  const terme = sansAccent(recherche.trim())

  const visibles = lignes
    .filter(
      ({ devis: d }) =>
        (!onglet.statuts || onglet.statuts.includes(d.statut)) &&
        d.dateCreation >= debutPeriode &&
        (!terme || sansAccent(`${d.numero} ${d.clientNom} ${d.objet}`).includes(terme)),
    )
    .sort((a, b) => {
      const va = valeurTri(a, tri.cle)
      const vb = valeurTri(b, tri.cle)
      const ecart =
        typeof va === 'number' && typeof vb === 'number' ? va - vb : comparerTexte(String(va), String(vb))
      return tri.sens === 'asc' ? ecart : -ecart
    })

  const pages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE))
  const page = Math.min(numero, pages)
  const debut = (page - 1) * PAR_PAGE

  const compte = (statuts?: readonly StatutDevis[]) =>
    tousLesDevis.filter((d) => !statuts || statuts.includes(d.statut)).length
  const onglets = ONGLETS.map((o) => ({ id: o.id, libelle: o.libelle, compte: compte(o.statuts) }))

  const enAttente = lignes
    .filter((l) => l.devis.statut === 'envoye' && l.jours >= 0)
    .reduce((s, l) => s + l.totaux.totalTtc, 0)
  const envoyes = tousLesDevis.filter((d) => d.statut !== 'brouillon')
  const taux = envoyes.length
    ? Math.round((envoyes.filter((d) => d.statut === 'accepte').length / envoyes.length) * 100)
    : 0
  const compteurs = [
    { libelle: 'En attente de réponse', valeur: formaterEuro(enAttente) },
    { libelle: 'Taux d’acceptation', valeur: `${taux} %` },
    { libelle: 'Brouillons', valeur: String(compte(['brouillon'])) },
  ]

  return {
    onglet,
    onglets,
    choisirOnglet,
    compteurs,
    recherche,
    changerRecherche: (valeur: string) => {
      setRecherche(valeur)
      setNumero(1)
    },
    periode,
    changerPeriode: (valeur: string) => {
      setPeriode(valeur)
      setNumero(1)
    },
    tri,
    changerTri: setTri,
    trier: (cle: CleTri) => {
      setTri((t) => ({ cle, sens: t.cle === cle && t.sens === 'asc' ? 'desc' : 'asc' }))
      setNumero(1)
    },
    filtre: Boolean(terme || debutPeriode),
    reinitialiser: () => {
      setRecherche('')
      setPeriode('tout')
      setNumero(1)
    },
    visibles,
    affichees: visibles.slice(debut, debut + PAR_PAGE),
    debut,
    page,
    pages,
    allerPage: setNumero,
  }
}
