import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { ChampRecherche } from '@/ui/ChampRecherche'
import { Dialogue } from '@/ui/Dialogue'
import { EntetePage } from '@/ui/EntetePage'
import { EtatVide } from '@/ui/EtatVide'
import { Onglets } from '@/ui/Onglets'
import { Pagination } from '@/ui/Pagination'
import { apiClients } from '@/services/clientsApi'
import { useToast } from '@/store/toastContext'
import { apiDevis } from './api'
import { BarreOutilsDevis } from './BarreOutilsDevis'
import { champsClient } from './champsClient'
import { ListeDevis } from './ListeDevis'
import type { Devis, StatutDevis } from './types'
import { useVueListeDevis } from './useVueListeDevis'
import './liste-devis.css'

const VIDE_PAR_ONGLET: Record<string, { titre: string; texte: string }> = {
  tous: { titre: 'Aucun devis pour le moment', texte: 'Créez votre premier devis en quelques clics.' },
  brouillons: { titre: 'Aucun brouillon', texte: 'Les devis en cours de rédaction apparaissent ici.' },
  envoyes: { titre: 'Aucun devis en attente', texte: 'Les devis envoyés à vos clients apparaissent ici.' },
  acceptes: { titre: 'Aucun devis accepté', texte: 'Les devis signés par vos clients apparaissent ici.' },
  refuses: { titre: 'Aucun devis refusé ou expiré', texte: 'Bonne nouvelle : rien à relancer de ce côté.' },
}

export function PageDevis() {
  const navigate = useNavigate()
  const { notifier } = useToast()
  const vue = useVueListeDevis()
  const [parametres] = useSearchParams()
  const [aSupprimer, setASupprimer] = useState<Devis | null>(null)
  const echec = () => notifier('Action impossible', { message: 'Réessayez dans un instant.', ton: 'alerte' })

  // « + Nouveau → Devis » de la topbar arrive ici avec ?nouveau=1 ; la ref évite un 2e brouillon en StrictMode.
  const creationFaite = useRef(false)
  const demandeCreation = parametres.has('nouveau')
  const clientId = parametres.get('client')
  useEffect(() => {
    if (!demandeCreation || creationFaite.current) return
    creationFaite.current = true
    const ouvrir = (client?: Partial<Devis>) =>
      apiDevis.creerBrouillon(client).then(
        (d) => navigate(`/devis/${d.id}`, { replace: true }),
        () => notifier('Création impossible', { message: 'Réessayez dans un instant.', ton: 'alerte' }),
      )
    if (!clientId) ouvrir()
    else
      apiClients.lire(clientId).then(
        (c) => ouvrir(champsClient(c)),
        () => ouvrir(),
      )
  }, [demandeCreation, clientId, navigate, notifier])

  const nouveau = () => apiDevis.creerBrouillon().then((d) => navigate(`/devis/${d.id}`), echec)
  const changerStatut = (d: Devis, statut: StatutDevis, titre: string, ton: 'succes' | 'info') =>
    apiDevis.changerStatut(d.id, statut).then(() => notifier(titre, { message: d.numero, ton }), echec)
  const dupliquer = (d: Devis) =>
    apiDevis.dupliquer(d.id).then(
      (copie) => notifier('Devis dupliqué', { message: `Brouillon ${copie.numero}`, ton: 'succes' }),
      echec,
    )
  const supprimer = () => {
    if (!aSupprimer) return
    const { id, numero } = aSupprimer
    setASupprimer(null)
    apiDevis.supprimer(id).then(() => notifier('Brouillon supprimé', { message: numero, ton: 'succes' }), echec)
  }

  const { onglet, affichees, visibles, debut } = vue
  const vide = VIDE_PAR_ONGLET[onglet.id]!

  return (
    <>
      <EntetePage
        titre="Devis"
        sousTitre="Préparez, envoyez et suivez vos propositions."
        filAriane={[{ libelle: 'Ventes' }, { libelle: onglet.id === 'tous' ? 'Tous les devis' : onglet.libelle }]}
        actions={
          <>
            <Bouton onClick={() => navigate('/documents/apparence')}>Apparence des documents</Bouton>
            <Bouton variante="primaire" icone="plus" onClick={nouveau}>
              Nouveau devis
            </Bouton>
          </>
        }
      />

      <ChampRecherche
        valeur={vue.recherche}
        onChange={vue.changerRecherche}
        libelle="Rechercher un devis"
        placeholder="Rechercher un numéro, un client, un objet…"
      />

      <Onglets
        libelle="Statuts des devis"
        prefixe="devis"
        onglets={vue.onglets}
        actif={onglet.id}
        onChoisir={vue.choisirOnglet}
      />
      <BarreOutilsDevis
        compteurs={vue.compteurs}
        periode={vue.periode}
        onPeriode={vue.changerPeriode}
        tri={vue.tri}
        onTri={vue.changerTri}
      />

      <div role="tabpanel" id="devis-panneau" aria-labelledby={`devis-onglet-${onglet.id}`}>
        {affichees.length === 0 ? (
          vue.filtre ? (
            <EtatVide
              icone="recherche"
              titre="Aucun devis ne correspond"
              texte="Élargissez la recherche ou la période."
              action={<Bouton onClick={vue.reinitialiser}>Réinitialiser les filtres</Bouton>}
            />
          ) : (
            <EtatVide
              icone="devis"
              titre={vide.titre}
              texte={vide.texte}
              action={
                onglet.id === 'tous' || onglet.id === 'brouillons' ? (
                  <Bouton variante="primaire" icone="plus" onClick={nouveau}>
                    Nouveau devis
                  </Bouton>
                ) : undefined
              }
            />
          )
        ) : (
          <>
            <ListeDevis
              lignes={affichees}
              tri={vue.tri}
              onTrier={vue.trier}
              onOuvrir={(d) => navigate(`/devis/${d.id}`)}
              onDupliquer={dupliquer}
              onEnvoye={(d) => changerStatut(d, 'envoye', 'Devis marqué comme envoyé', 'succes')}
              onAccepte={(d) => changerStatut(d, 'accepte', 'Devis marqué comme accepté', 'succes')}
              onRefuse={(d) => changerStatut(d, 'refuse', 'Devis marqué comme refusé', 'info')}
              onSupprimer={setASupprimer}
            />
            <div className="liste-devis__pied">
              <span className="num" aria-live="polite">
                {debut + 1} à {debut + affichees.length} sur {visibles.length} devis
              </span>
              {vue.pages > 1 ? <Pagination page={vue.page} pages={vue.pages} onChoisir={vue.allerPage} /> : null}
            </div>
          </>
        )}
      </div>

      <Dialogue
        ouvert={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Supprimer ce brouillon ?"
        soustitre={aSupprimer?.numero ?? ''}
        pied={
          <>
            <Bouton onClick={() => setASupprimer(null)}>Conserver</Bouton>
            <Bouton variante="danger" icone="poubelle" onClick={supprimer}>
              Supprimer
            </Bouton>
          </>
        }
      >
        <p>Le brouillon disparaît définitivement. Seuls les brouillons peuvent être supprimés.</p>
      </Dialogue>
    </>
  )
}
