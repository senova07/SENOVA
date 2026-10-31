import { Bouton } from '@/ui/Bouton'
import { Icone, type NomIcone } from '@/ui/Icone'
import { Dialogue } from '@/ui/Dialogue'
import { useToast } from '@/store/toastContext'
import type { Devis } from './donnees'

const CHOIX: { id: string; icone: NomIcone; titre: string; texte: string; toast: string }[] = [
  {
    id: 'commande',
    icone: 'documents',
    titre: 'Bon de commande',
    texte: 'Reprend les lignes du devis pour lancer la prestation.',
    toast: 'Bon de commande créé en brouillon',
  },
  {
    id: 'acompte',
    icone: 'factures',
    titre: 'Facture d’acompte',
    texte: 'Brouillon calculé sur le pourcentage d’acompte du devis.',
    toast: 'Facture d’acompte créée en brouillon',
  },
]

/** Proposée après « Marquer accepté » : rien n'est créé sans un clic. Maquette : simple toast. */
export function ModaleApresAccord({ devis, onFermer }: { devis: Devis | null; onFermer(): void }) {
  const { notifier } = useToast()
  return (
    <Dialogue
      ouvert={devis !== null}
      onFermer={onFermer}
      titre="Après l’accord"
      soustitre={devis ? `${devis.numero} · ${devis.clientNom}` : ''}
      pied={<Bouton onClick={onFermer}>Rien pour l’instant</Bouton>}
    >
      <p className="devis-accord__question">Que voulez-vous créer ?</p>
      <ul className="devis-accord">
        {CHOIX.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="devis-accord__choix"
              onClick={() => {
                notifier(c.toast, { message: devis?.numero, ton: 'succes' })
                onFermer()
              }}
            >
              <Icone nom={c.icone} taille={22} />
              <span>
                <strong>{c.titre}</strong>
                <span className="devis-accord__texte">{c.texte}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Dialogue>
  )
}
