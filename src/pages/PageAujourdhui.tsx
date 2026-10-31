import { useState } from 'react'
import { Compteurs, type Compteur } from '@/ui/Compteurs'
import { EntetePage } from '@/ui/EntetePage'
import { formaterEuro } from '@/lib/format'
import { pluriel } from '@/lib/texte'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { FACTURES_DEMO, magasinDevis, PRESTATIONS_DU_JOUR, totalTtcDevis } from '@/features/devis'
import { construireActions, type Action } from './actionsAujourdhui'
import { ColonneAujourdhui } from './ColonneAujourdhui'
import { ListeActions } from './ListeActions'
import './aujourdhui.css'

const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function PageAujourdhui() {
  const { session } = useSession()
  const { notifier } = useToast()
  const devis = magasinDevis.useListe()
  const [relancees, setRelancees] = useState<ReadonlySet<string>>(new Set())
  const [masquees, setMasquees] = useState<ReadonlySet<string>>(new Set())
  const [afficherMasquees, setAfficherMasquees] = useState(false)
  const prenom = session?.utilisateur.nomComplet.trim().split(/\s+/)[0] ?? ''

  const maintenant = new Date()
  const moisCourant = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`

  const duMois = FACTURES_DEMO.filter((f) => f.date.startsWith(moisCourant))
  const caFacture = duMois.reduce((s, f) => s + f.montantTtc, 0)
  // shortcut: encaissé du mois = part payée des factures du mois ; brancher les vrais paiements.
  const encaisse = duMois.reduce((s, f) => s + f.montantTtc - f.resteDu, 0)
  const reste = FACTURES_DEMO.reduce((s, f) => s + f.resteDu, 0)
  const enRetard = FACTURES_DEMO.filter((f) => f.statut === 'en_retard').reduce((s, f) => s + f.resteDu, 0)
  const envoyes = devis.filter((d) => d.statut === 'envoye')
  const montantEnvoyes = envoyes.reduce((s, d) => s + totalTtcDevis(d), 0)

  const actions = construireActions(devis, maintenant)
  const visibles = actions.filter((a) => afficherMasquees || !masquees.has(a.id))
  const nbMasquees = actions.filter((a) => masquees.has(a.id)).length
  const nbAFaire = actions.filter((a) => !masquees.has(a.id) && !relancees.has(a.id)).length
  const nbInterventions = PRESTATIONS_DU_JOUR.length

  const relancer = (a: Action) => {
    setRelancees((s) => new Set(s).add(a.id))
    // Aucun envoi : la ligne est seulement marquée comme relancée.
    notifier('Marquée comme relancée', { message: a.client, ton: 'info' })
  }
  const basculerMasquee = (id: string) =>
    setMasquees((s) => {
      const suite = new Set(s)
      if (!suite.delete(id)) suite.add(id)
      return suite
    })

  const chiffres: Compteur[] = [
    {
      lien: '/factures',
      libelle: 'CA facturé du mois',
      valeur: formaterEuro(caFacture),
      sous: `${pluriel(duMois.length, 'facture')} émise${duMois.length > 1 ? 's' : ''}`,
    },
    {
      lien: '/paiements',
      libelle: 'Encaissé ce mois',
      valeur: formaterEuro(encaisse),
      sous: 'Paiements reçus',
    },
    {
      lien: '/factures',
      libelle: 'Reste à encaisser',
      valeur: formaterEuro(reste),
      sous: enRetard ? `dont ${formaterEuro(enRetard)} en retard` : 'Rien en retard',
      ton: enRetard > 0 ? 'danger' : undefined,
    },
    {
      lien: '/devis?onglet=envoyes',
      libelle: 'Devis en attente',
      valeur: formaterEuro(montantEnvoyes),
      sous: `${pluriel(envoyes.length, 'devis')} envoyé${envoyes.length > 1 ? 's' : ''}`,
    },
  ]

  const resume = `${nbAFaire ? `${pluriel(nbAFaire, 'action')} à faire` : 'Aucune action à faire'}, ${
    nbInterventions ? `${pluriel(nbInterventions, 'intervention')} aujourd'hui` : "pas d'intervention aujourd'hui"
  }.`

  return (
    <>
      <EntetePage titre={`Bonjour ${prenom}`} sousTitre={`${dateDuJour.format(maintenant)} · ${resume}`} />

      <Compteurs className="aujourdhui-compteurs" compteurs={chiffres} />

      <div className="aujourdhui-grille">
        <ListeActions
          actions={visibles}
          masquees={masquees}
          relancees={relancees}
          nbMasquees={nbMasquees}
          afficherMasquees={afficherMasquees}
          onBasculerAffichage={() => setAfficherMasquees((v) => !v)}
          onRelancer={relancer}
          onBasculerMasquee={basculerMasquee}
        />
        <ColonneAujourdhui devis={devis} />
      </div>
    </>
  )
}
