import { useRef, useState, type DragEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Icone } from '@/ui/Icone'
import { analyserCsv, decoderTexte, ErreurTableau, estFichierExcel, estFichierTexte, MAX_OCTETS, MESSAGE_EXCEL, type Matrice } from './csv'

interface Props {
  mode: 'fichier' | 'collage'
  onCharger(nom: string, matrice: Matrice): void
}

/** Étape 1 : fichier CSV/TSV/TXT ou collage. Les fichiers Excel sont refusés avec un message clair. */
export function EtapeSource({ mode, onCharger }: Props) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [survol, setSurvol] = useState(false)
  const champ = useRef<HTMLInputElement>(null)

  const charger = (nom: string, lire: () => Matrice) => {
    try {
      const matrice = lire()
      if (!matrice.length) setErreur('Aucune donnée trouvée. Vérifiez que le fichier contient un tableau.')
      else {
        setErreur(null)
        onCharger(nom, matrice)
      }
    } catch (e) {
      setErreur(e instanceof ErreurTableau ? e.message : `Impossible de lire « ${nom} ».`)
    }
  }

  const lireFichier = async (fichier: File | undefined) => {
    if (!fichier) return
    if (estFichierExcel(fichier.name)) return setErreur(MESSAGE_EXCEL)
    if (!estFichierTexte(fichier.name)) return setErreur(`« ${fichier.name} » n'est pas accepté. Formats : .csv, .tsv, .txt.`)
    if (fichier.size > MAX_OCTETS) return setErreur(`« ${fichier.name} » est trop volumineux (limite : 2 Mo). Découpez votre fichier en plusieurs parties.`)
    const texte = decoderTexte(await fichier.arrayBuffer())
    charger(fichier.name, () => analyserCsv(texte))
  }

  const deposer = (e: DragEvent) => {
    e.preventDefault()
    setSurvol(false)
    void lireFichier(e.dataTransfer.files[0])
  }

  return (
    <section className="import" aria-label={mode === 'fichier' ? 'Importer un fichier' : 'Copier depuis un tableur'}>
      {mode === 'fichier' ? (
        <div
          className="import__depot"
          data-survol={survol || undefined}
          onDragOver={(e) => { e.preventDefault(); setSurvol(true) }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
        >
          <Icone nom="telecharger" taille={30} />
          <p className="import__depot-titre">Déposez votre fichier ici</p>
          <p className="import__depot-texte">CSV, TSV ou texte (.csv, .tsv, .txt). Excel arrive bientôt.</p>
          <Bouton taille="sm" icone="documents" onClick={() => champ.current?.click()}>Choisir un fichier</Bouton>
          <input
            ref={champ}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            hidden
            aria-label="Fichier à importer"
            onChange={(e) => {
              void lireFichier(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      ) : (
        <div className="import__collage">
          <label htmlFor="import-collage" className="import__collage-label">
            Sélectionnez vos lignes dans votre tableur (avec la ligne d'en-têtes si possible), copiez-les, puis collez-les ici.
          </label>
          <textarea
            id="import-collage"
            className="textarea import__collage-zone"
            placeholder={'Désignation\tCode\tPU HT\tTVA\nHeure de plomberie\tMO-001\t65,00\t20 %'}
            onPaste={(e) => {
              e.preventDefault()
              const texte = e.clipboardData.getData('text/plain')
              if (texte.length > MAX_OCTETS) setErreur('Texte collé trop volumineux (limite : 2 Mo).')
              else charger('Collage', () => analyserCsv(texte))
            }}
            onChange={(e) => {
              const texte = e.target.value
              if (texte.length > MAX_OCTETS) setErreur('Texte collé trop volumineux (limite : 2 Mo).')
              else if (texte.includes('\n')) charger('Collage', () => analyserCsv(texte))
            }}
          />
        </div>
      )}
      {erreur ? <p className="import__erreur" role="alert"><Icone nom="attention" taille={16} poids="fill" /> {erreur}</p> : null}
    </section>
  )
}
