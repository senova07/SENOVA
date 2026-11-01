import { useState } from 'react'
import { LIBELLES_TYPE_ARTICLE, TAUX_TVA, TYPES_ARTICLE, UNITES_PAR_DEFAUT, type CategorieArticle, type TypeArticle } from '@shared/articles'
import { Bouton } from '@/ui/Bouton'
import { CaseACocher } from '@/ui/CaseACocher'
import { formaterMontant, libelleTva, lireMontant, type Defauts } from './modele'

type ChampRemplir = 'type' | 'tva' | 'unite' | 'categorie' | 'prix' | 'achat' | 'favori'
const CHAMPS: { cle: ChampRemplir; libelle: string }[] = [
  { cle: 'type', libelle: 'Type' }, { cle: 'tva', libelle: 'TVA' }, { cle: 'unite', libelle: 'Unité' },
  { cle: 'categorie', libelle: 'Catégorie' }, { cle: 'prix', libelle: 'Prix HT' }, { cle: 'achat', libelle: "Prix d'achat" },
  { cle: 'favori', libelle: 'Favori' },
]
const INITIALE: Record<ChampRemplir, string> = { type: 'service', tva: '20', unite: 'forfait', categorie: '', prix: '', achat: '', favori: 'true' }

interface Choix { valeurs: { v: string; l: string }[] }
const choixPour = (cle: ChampRemplir, categories: readonly CategorieArticle[]): Choix | null => {
  switch (cle) {
    case 'type': return { valeurs: TYPES_ARTICLE.map((t) => ({ v: t, l: LIBELLES_TYPE_ARTICLE[t] })) }
    case 'tva': return { valeurs: TAUX_TVA.map((t) => ({ v: String(t), l: libelleTva(String(t)) })) }
    case 'unite': return { valeurs: UNITES_PAR_DEFAUT.map((u) => ({ v: u, l: u })) }
    case 'categorie': return { valeurs: categories.map((c) => ({ v: c.nom, l: c.nom })) }
    case 'favori': return { valeurs: [{ v: 'true', l: 'Favori' }, { v: 'false', l: 'Pas favori' }] }
    default: return null
  }
}

interface RemplirProps {
  nbSelection: number
  nbRemplies: number
  categories: readonly CategorieArticle[]
  onAppliquer(cle: ChampRemplir, valeur: string, portee: 'selection' | 'toutes', videsSeulement: boolean): void
}

export function PanneauRemplir({ nbSelection, nbRemplies, categories, onAppliquer }: RemplirProps) {
  const [cle, setCle] = useState<ChampRemplir>('tva')
  const [valeur, setValeur] = useState('20')
  const [portee, setPortee] = useState<'selection' | 'toutes'>(nbSelection ? 'selection' : 'toutes')
  const [vides, setVides] = useState(false)
  const choix = choixPour(cle, categories)
  const nombre = portee === 'selection' ? nbSelection : nbRemplies
  const montant = cle === 'prix' || cle === 'achat' ? lireMontant(valeur) : null
  const invalide = (cle === 'prix' || cle === 'achat') && montant === null
  const final = montant !== null ? formaterMontant(montant) : valeur

  return (
    <div className="panneau-outil">
      <div className="panneau-outil__ligne">
        <label htmlFor="remplir-champ">Champ</label>
        <select id="remplir-champ" className="select" value={cle} onChange={(e) => { const k = e.target.value as ChampRemplir; setCle(k); setValeur(k === 'categorie' ? (categories[0]?.nom ?? '') : INITIALE[k]) }}>
          {CHAMPS.map((c) => <option key={c.cle} value={c.cle}>{c.libelle}</option>)}
        </select>
      </div>
      <div className="panneau-outil__ligne">
        <label htmlFor="remplir-valeur">Valeur</label>
        {choix ? (
          <select id="remplir-valeur" className="select" value={valeur} onChange={(e) => setValeur(e.target.value)}>
            {choix.valeurs.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ) : (
          <input id="remplir-valeur" className="input" inputMode="decimal" placeholder="0,00" value={valeur} aria-invalid={invalide || undefined} onChange={(e) => setValeur(e.target.value)} />
        )}
      </div>
      <fieldset className="panneau-outil__portee">
        <legend>Appliquer à</legend>
        <label className="case-cocher"><input type="radio" name="remplir-portee" checked={portee === 'selection'} disabled={!nbSelection} onChange={() => setPortee('selection')} /><span>Lignes sélectionnées ({nbSelection})</span></label>
        <label className="case-cocher"><input type="radio" name="remplir-portee" checked={portee === 'toutes'} onChange={() => setPortee('toutes')} /><span>Toutes les lignes remplies ({nbRemplies})</span></label>
        <CaseACocher libelle="Uniquement les cellules vides" checked={vides} onChange={(e) => setVides(e.target.checked)} />
      </fieldset>
      <Bouton variante="primaire" taille="sm" bloc disabled={!nombre || invalide || (cle === 'categorie' && !valeur)} onClick={() => onAppliquer(cle, final, portee, vides)}>
        Appliquer à {nombre} ligne{nombre > 1 ? 's' : ''}
      </Bouton>
    </div>
  )
}

interface DefautsProps {
  defauts: Defauts
  categories: readonly CategorieArticle[]
  onChange(patch: Partial<Defauts>): void
}

export function PanneauDefauts({ defauts, categories, onChange }: DefautsProps) {
  return (
    <div className="panneau-outil">
      <p className="panneau-outil__intro">Utilisées pour chaque nouvelle ligne et pour les lignes encore vides.</p>
      <div className="panneau-outil__ligne">
        <label htmlFor="def-type">Type</label>
        <select id="def-type" className="select" value={defauts.type} onChange={(e) => onChange({ type: e.target.value as TypeArticle })}>
          {TYPES_ARTICLE.map((t) => <option key={t} value={t}>{LIBELLES_TYPE_ARTICLE[t]}</option>)}
        </select>
      </div>
      <div className="panneau-outil__ligne">
        <label htmlFor="def-tva">TVA</label>
        <select id="def-tva" className="select" value={defauts.tva} onChange={(e) => onChange({ tva: e.target.value })}>
          {TAUX_TVA.map((t) => <option key={t} value={String(t)}>{libelleTva(String(t))}</option>)}
        </select>
      </div>
      <div className="panneau-outil__ligne">
        <label htmlFor="def-unite">Unité</label>
        <input id="def-unite" className="input" list="def-unites" value={defauts.unite} onChange={(e) => onChange({ unite: e.target.value })} />
        <datalist id="def-unites">{UNITES_PAR_DEFAUT.map((u) => <option key={u} value={u} />)}</datalist>
      </div>
      <div className="panneau-outil__ligne">
        <label htmlFor="def-cat">Catégorie</label>
        <select id="def-cat" className="select" value={defauts.categorie} onChange={(e) => onChange({ categorie: e.target.value })}>
          <option value="">Aucune</option>
          {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </select>
      </div>
    </div>
  )
}

export type { ChampRemplir }
