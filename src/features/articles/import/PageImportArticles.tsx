import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CategorieArticle } from '@shared/articles'
import { apiCategories } from '@/services/articlesApi'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { Bouton } from '@/ui/Bouton'
import { GardeModifications } from '@/ui/GardeModifications'
import { EntetePage } from '@/ui/EntetePage'
import { EtatVide } from '@/ui/EtatVide'
import { Icone, type NomIcone } from '@/ui/Icone'
import { BarreOutilsImport } from './BarreOutilsImport'
import { EtapeColonnes } from './EtapeColonnes'
import { EtapeSource } from './EtapeSource'
import { MAX_ENVOI, envoyerLignes } from './envoi'
import { GrilleImport } from './GrilleImport'
import { ErreurTableau, MAX_LIGNES, type Matrice } from './csv'
import { COLONNES, estVide, validerLignes, type CleChamp } from './modele'
import { RecapEnvoi, type Recap } from './RecapEnvoi'
import { retirerDuBrouillon, useLignesImport } from './useLignesImport'
import './import.css'

type Mode = 'fichier' | 'tableau' | 'collage'
const MODES: { id: Mode; titre: string; texte: string; icone: NomIcone }[] = [
  { id: 'fichier', titre: 'Importer un fichier', texte: 'CSV, TSV ou texte (Excel bientôt)', icone: 'documents' },
  { id: 'tableau', titre: 'Saisir dans le tableau', texte: 'Ajoutez ou collez vos articles directement', icone: 'crayon' },
  { id: 'collage', titre: 'Copier depuis un tableur', texte: 'Copiez et collez plusieurs lignes', icone: 'copier' },
]
const FIL = [{ libelle: 'Catalogue' }, { libelle: 'Articles', vers: '/articles' }, { libelle: 'Ajout en masse' }] as const

export function PageImportArticles() {
  const { peut } = useSession()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const l = useLignesImport()
  const [mode, setMode] = useState<Mode>('tableau')
  const [source, setSource] = useState<{ nom: string; matrice: Matrice } | null>(null)
  const [masquees, setMasquees] = useState<Set<CleChamp>>(new Set())
  const [agrandi, setAgrandi] = useState(false)
  const [categories, setCategories] = useState<CategorieArticle[]>([])
  const [erreurCategories, setErreurCategories] = useState<string | null>(null)
  const [progression, setProgression] = useState<{ faits: number; total: number } | null>(null)
  const [recap, setRecap] = useState<Recap | null>(null)
  const present = useRef(true)

  useEffect(() => {
    present.current = true
    return () => { present.current = false }
  }, [])

  useEffect(() => {
    let actif = true
    apiCategories.lister().then(
      (c) => actif && setCategories(c),
      (e: unknown) => actif && setErreurCategories(e instanceof Error ? e.message : 'Catégories indisponibles'),
    )
    return () => { actif = false }
  }, [])

  const erreurs = useMemo(() => validerLignes(l.lignes, categories), [l.lignes, categories])
  const remplies = l.lignes.filter((x) => !estVide(x))
  const pretes = remplies.filter((x) => !erreurs.has(x.id))
  const aEnvoyer = pretes.slice(0, MAX_ENVOI)
  const occupe = progression !== null
  const colonnes = COLONNES.filter((c) => !masquees.has(c.cle))
  const colonnesNav = colonnes.filter((c) => c.genre !== 'etoile').map((c) => c.cle)
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

  if (!peut('articles.gerer')) {
    return <EtatVide icone="attention" titre="Accès non autorisé" texte="Votre rôle ne permet pas d'ajouter des articles. Demandez l'accès à un administrateur." />
  }

  const enregistrer = async () => {
    const avant = l.lignes // instantané de ce qui part : les rangs du récapitulatif se rapportent à lui
    setRecap(null)
    setProgression({ faits: 0, total: aEnvoyer.length })
    const bilan = await envoyerLignes(aEnvoyer, categories, (faits) => setProgression({ faits, total: aEnvoyer.length }), () => present.current)
    if (!present.current) return retirerDuBrouillon(bilan.crees)
    l.appliquerBilan(new Set(bilan.crees), new Map(bilan.echecs.map((e) => [e.id, e.message])))
    setRecap({
      ...bilan,
      reportees: pretes.length - aEnvoyer.length,
      detail: bilan.echecs.map((e) => ({ ...e, rang: avant.findIndex((x) => x.id === e.id) + 1, nom: avant.find((x) => x.id === e.id)?.nom ?? '' })),
    })
    setProgression(null)
  }

  const ajouterLignes = (n: number) => {
    if (l.ajouter(n) < n) notifier('Limite atteinte', { ton: 'alerte', message: `Le tableau est limité à ${MAX_LIGNES} lignes.` })
  }

  return (
    <div className="import-page" data-agrandi={agrandi || undefined}>
      {!agrandi ? (
        <>
          <EntetePage
            titre="Ajouter des articles en masse"
            sousTitre="Importez votre catalogue depuis un fichier ou saisissez directement vos articles dans le tableau."
            filAriane={FIL}
            actions={<Bouton icone="retour" disabled={occupe} onClick={() => navigate('/articles')}>Retour aux articles</Bouton>}
          />
          <div className="modes" role="group" aria-label="Mode de saisie">
            {MODES.map((m) => (
              <button key={m.id} type="button" className="mode" aria-pressed={mode === m.id} disabled={occupe} onClick={() => { setMode(m.id); setSource(null) }}>
                <Icone nom={m.icone} taille={24} />
                <span className="mode__texte"><span className="mode__titre">{m.titre}</span><span className="mode__sous">{m.texte}</span></span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {erreurCategories ? <p className="import__erreur" role="alert">Catégories non chargées : {erreurCategories}. Les lignes avec une catégorie seront refusées.</p> : null}
      {l.restaure !== null ? (
        <p className="import-bandeau" role="status">
          Brouillon restauré : {pluriel(l.restaure, 'ligne')}
          <button type="button" className="recap__fermer" disabled={occupe} onClick={l.vider}>Vider</button>
        </p>
      ) : null}
      {recap ? <RecapEnvoi recap={recap} onFermer={() => setRecap(null)} /> : null}

      {mode === 'tableau' ? (
        <fieldset className="import-zone" disabled={occupe}>
          <legend className="sr-only">Tableau de saisie</legend>
          <BarreOutilsImport
            nbSelection={l.selection.size}
            nbRemplies={remplies.length}
            categories={categories}
            defauts={l.defauts}
            masquees={masquees}
            agrandi={agrandi}
            occupe={occupe}
            onAjouter={ajouterLignes}
            onSupprimer={() => { const n = l.supprimerSelection(); notifier(`${pluriel(n, 'ligne')} supprimée${n > 1 ? 's' : ''} du tableau`) }}
            onDupliquer={() => { const n = l.dupliquerSelection(); notifier(`${pluriel(n, 'ligne')} dupliquée${n > 1 ? 's' : ''}`, { message: 'Références à compléter.' }) }}
            onRemplir={(...a) => { const n = l.remplir(...a); notifier(`Valeur appliquée à ${pluriel(n, 'ligne')}`) }}
            onDefauts={l.changerDefauts}
            onBasculerColonne={(cle) => setMasquees((s) => { const n = new Set(s); if (!n.delete(cle)) n.add(cle); return n })}
            onAgrandir={() => setAgrandi((a) => !a)}
          />
          <div className="import-grille">
            <GrilleImport
              lignes={l.lignes}
              colonnes={colonnes}
              erreurs={erreurs}
              selection={l.selection}
              tri={l.tri}
              categories={categories}
              onChange={l.changer}
              onSelection={l.setSelection}
              onTri={l.trier}
              ajouterLigne={() => ajouterLignes(1)}
              coller={(r, c, texte) => {
                try {
                  const res = l.coller(r, c, texte, colonnesNav)
                  notifier(`${pluriel(res.nombre, 'ligne')} collée${res.nombre > 1 ? 's' : ''}`, { message: res.reconnues ? `Colonnes reconnues : ${res.reconnues.join(', ')}` : undefined })
                } catch (e) {
                  if (!(e instanceof ErreurTableau)) throw e
                  notifier('Collage refusé', { ton: 'alerte', message: e.message })
                }
              }}
            />
          </div>
          <p className="import-aide"><Icone nom="info" taille={15} /> Collez depuis un tableur dans n'importe quelle cellule. Tab, Entrée et flèches pour se déplacer.</p>
        </fieldset>
      ) : source ? (
        <EtapeColonnes
          source={source}
          defauts={l.defauts}
          onChanger={() => setSource(null)}
          onAjouter={(lignes, nom) => {
            if (!l.ajouterImportees(lignes)) return notifier('Import refusé', { ton: 'alerte', message: `Le tableau serait limité à ${MAX_LIGNES} lignes.` })
            setMode('tableau')
            setSource(null)
            notifier(`${pluriel(lignes.length, 'ligne')} ajoutée${lignes.length > 1 ? 's' : ''} depuis « ${nom} »`, { message: 'Vérifiez les cellules signalées.' })
          }}
        />
      ) : (
        <EtapeSource key={mode} mode={mode} onCharger={(nom, matrice) => setSource({ nom, matrice })} />
      )}

      <footer className="import-pied">
        <div className="import-pied__etat" aria-live="polite">
          <span><strong className="num">{remplies.length}</strong> article{remplies.length > 1 ? 's' : ''}</span>
          <span data-ton={erreurs.size ? 'erreur' : undefined}><span className="num">{erreurs.size}</span> erreur{erreurs.size > 1 ? 's' : ''}</span>
          <span data-ton="ok"><span className="num">{pretes.length}</span> prêt{pretes.length > 1 ? 's' : ''} à enregistrer</span>
          {pretes.length > aEnvoyer.length ? <span>Envoi limité à {MAX_ENVOI} lignes à la fois</span> : null}
          {progression ? <span role="status">Envoi en cours : {progression.faits} / {progression.total}</span> : null}
        </div>
        <Bouton variante="primaire" taille="lg" signature disabled={!pretes.length || occupe} onClick={() => void enregistrer()}>
          {occupe ? 'Enregistrement…' : `Enregistrer ${pluriel(aEnvoyer.length, 'article')}`}
        </Bouton>
      </footer>

      <GardeModifications
        actif={remplies.length > 0 || occupe}
        message={
          occupe
            ? "Un enregistrement est en cours : quitter l'interrompt côté écran. Les articles déjà envoyés restent créés, les autres ne seront pas envoyés."
            : `${pluriel(remplies.length, 'ligne')} du tableau ${remplies.length > 1 ? 'ne sont pas créées' : "n'est pas créée"} dans le catalogue.`
        }
      />
    </div>
  )
}
