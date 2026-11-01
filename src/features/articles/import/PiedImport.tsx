import { Bouton } from '@/ui/Bouton'
import { pluriel } from '@/lib/texte'
import { MAX_ENVOI } from './envoi'

interface Props {
  nbRemplies: number
  nbErreurs: number
  nbPretes: number
  /** Lignes qui partiront au prochain envoi (au plus `MAX_ENVOI`). */
  nbAEnvoyer: number
  progression: { faits: number; total: number } | null
  onEnregistrer(): void
}

/** Pied de page : compteurs de lignes et bouton d'enregistrement. */
export function PiedImport({ nbRemplies, nbErreurs, nbPretes, nbAEnvoyer, progression, onEnregistrer }: Props) {
  const occupe = progression !== null
  return (
    <footer className="import-pied">
      <div className="import-pied__etat" aria-live="polite">
        <span><strong className="num">{nbRemplies}</strong> article{nbRemplies > 1 ? 's' : ''}</span>
        <span data-ton={nbErreurs ? 'erreur' : undefined}><span className="num">{nbErreurs}</span> erreur{nbErreurs > 1 ? 's' : ''}</span>
        <span data-ton="ok"><span className="num">{nbPretes}</span> prêt{nbPretes > 1 ? 's' : ''} à enregistrer</span>
        {nbPretes > nbAEnvoyer ? <span>Envoi limité à {MAX_ENVOI} lignes à la fois</span> : null}
        {progression ? <span role="status">Envoi en cours : {progression.faits} / {progression.total}</span> : null}
      </div>
      <Bouton variante="primaire" taille="lg" signature disabled={!nbPretes || occupe} onClick={onEnregistrer}>
        {occupe ? 'Enregistrement…' : `Enregistrer ${pluriel(nbAEnvoyer, 'article')}`}
      </Bouton>
    </footer>
  )
}
