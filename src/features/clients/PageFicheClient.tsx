import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Compteurs } from '@/ui/Compteurs'
import { EtatVide } from '@/ui/EtatVide'
import { Onglets } from '@/ui/Onglets'
import { magasinDevis } from '@/features/devis'
import { formaterEuro } from '@/lib/format'
import { ErreurApi } from '@/services/http'
import { useSession } from '@/store/sessionContext'
import { nomAffichageClient } from '@shared/clients'
import { ApercuClient } from './ApercuClient'
import { DialogueArchivage } from './DialogueArchivage'
import { DialogueSuppression } from './DialogueSuppression'
import { documentsClient } from './documentsClient'
import { EnteteFiche } from './EnteteFiche'
import { HistoriqueClient } from './HistoriqueClient'
import { ModaleClient } from './ModaleClient'
import { DevisClient, DocumentsClient, FacturesClient } from './PiecesClient'
import { useFicheClient } from './useFicheClient'
import './clients.css'

const ONGLETS = [
  { id: 'apercu', libelle: 'Vue d’ensemble' },
  { id: 'historique', libelle: 'Historique' },
  { id: 'devis', libelle: 'Devis' },
  { id: 'factures', libelle: 'Factures' },
  { id: 'documents', libelle: 'Documents' },
] as const
type OngletFiche = (typeof ONGLETS)[number]['id']

export function PageFicheClient() {
  const { id = '' } = useParams()
  const { peut } = useSession()
  const peutGerer = peut('clients.gerer')
  const tousLesDevis = magasinDevis.useListe()
  const [onglet, setOnglet] = useState<OngletFiche>('apercu')
  const fiche = useFicheClient(id)
  const { client, calque, fermer, enCours } = fiche

  if (fiche.chargement) {
    return (
      <p className="clients__chargement" role="status">
        Chargement de la fiche…
      </p>
    )
  }
  if (!client) {
    const introuvable = fiche.erreur instanceof ErreurApi && fiche.erreur.introuvable
    return (
      <EtatVide
        icone="clients"
        titre={introuvable ? 'Client introuvable' : 'Fiche indisponible'}
        texte={
          introuvable
            ? 'Ce client n’existe pas ou a été supprimé.'
            : (fiche.erreur?.message ?? 'Chargement impossible.')
        }
        action={
          <Link to="/clients" className="btn btn--primary">
            Retour aux clients
          </Link>
        }
      />
    )
  }

  const nom = nomAffichageClient(client)
  const { devis, factures, totaux } = documentsClient(client, tousLesDevis)

  return (
    <>
      <EnteteFiche
        client={client}
        peutGerer={peutGerer}
        enCours={enCours}
        onModifier={() => fiche.ouvrir('modifier')}
        onArchiver={() => fiche.ouvrir('archiver')}
        onRestaurer={() => void fiche.restaurer()}
        onSupprimer={() => fiche.ouvrir('supprimer')}
      />

      <Compteurs
        libelle="Chiffres du client"
        compteurs={[
          { libelle: 'Total devisé', valeur: formaterEuro(totaux.devise) },
          { libelle: 'Facturé', valeur: formaterEuro(totaux.facture) },
          { libelle: 'Encaissé', valeur: formaterEuro(totaux.encaisse) },
          { libelle: 'Reste dû', valeur: formaterEuro(totaux.resteDu), ton: totaux.resteDu > 0 ? 'danger' : undefined },
        ]}
      />

      <Onglets libelle="Sections de la fiche" prefixe="fiche" onglets={ONGLETS} actif={onglet} onChoisir={(o) => setOnglet(o)} />

      <div role="tabpanel" id="fiche-panneau" aria-labelledby={`fiche-onglet-${onglet}`}>
        {onglet === 'historique' ? (
          <HistoriqueClient devis={devis} factures={factures} />
        ) : onglet === 'devis' ? (
          <DevisClient devis={devis} />
        ) : onglet === 'factures' ? (
          <FacturesClient factures={factures} />
        ) : onglet === 'documents' ? (
          <DocumentsClient />
        ) : (
          <ApercuClient client={client} />
        )}
      </div>

      {calque === 'modifier' ? (
        <ModaleClient
          client={client}
          onFermer={fermer}
          onEnregistre={(maj) => {
            fermer()
            fiche.fusionner(maj)
          }}
        />
      ) : null}

      {calque === 'archiver' ? (
        <DialogueArchivage nom={nom} enCours={enCours} onFermer={fermer} onConfirmer={(motif) => void fiche.archiver(motif)} />
      ) : null}

      <DialogueSuppression
        ouvert={calque === 'supprimer'}
        nom={nom}
        enCours={enCours}
        onFermer={fermer}
        onConfirmer={() => void fiche.supprimer()}
      />
    </>
  )
}
