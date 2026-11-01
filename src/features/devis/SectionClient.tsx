import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { CaseACocher } from '@/ui/CaseACocher'
import { Bouton } from '@/ui/Bouton'
import { Icone } from '@/ui/Icone'
import { apiClients } from '@/services/clientsApi'
import { nomAffichageClient, type Client } from '@shared/clients'
import { Champs } from './Champs'
import { champsClient, initiales } from './champsClient'
import type { AdresseChantier, Devis } from './types'

interface Props {
  devis: Devis
  lectureSeule: boolean
  onModifier(patch: Partial<Devis>): void
}

type Recherche = { requete: string; clients: Client[]; erreur: boolean }

const DELAI_RECHERCHE_MS = 250

/** Recherche dans la vraie API clients ; ne tient compte que de la dernière requête. */
function useRechercheClients(requete: string, actif: boolean) {
  const [resultat, setResultat] = useState<Recherche | null>(null)
  useEffect(() => {
    if (!actif) return
    let annule = false
    const t = window.setTimeout(() => {
      apiClients.lister({ recherche: requete.trim(), archives: false, page: 1, parPage: 8 }).then(
        (p) => !annule && setResultat({ requete, clients: p.donnees, erreur: false }),
        () => !annule && setResultat({ requete, clients: [], erreur: true }),
      )
    }, DELAI_RECHERCHE_MS)
    return () => {
      annule = true
      window.clearTimeout(t)
    }
  }, [requete, actif])
  return { resultat, enCours: resultat?.requete !== requete }
}

function AdresseChantierChamps({
  adresse,
  onChange,
}: {
  adresse: AdresseChantier
  onChange(a: AdresseChantier): void
}) {
  return (
    <div className="devis-chantier">
      <input
        className="input"
        aria-label="Adresse du chantier"
        placeholder="Adresse"
        value={adresse.rue}
        onChange={(ev) => onChange({ ...adresse, rue: ev.target.value })}
      />
      <div className="devis-chantier__ligne">
        <input
          className="input"
          aria-label="Code postal du chantier"
          placeholder="Code postal"
          value={adresse.codePostal}
          onChange={(ev) => onChange({ ...adresse, codePostal: ev.target.value })}
        />
        <input
          className="input"
          aria-label="Ville du chantier"
          placeholder="Ville"
          value={adresse.ville}
          onChange={(ev) => onChange({ ...adresse, ville: ev.target.value })}
        />
      </div>
    </div>
  )
}

export function SectionClient({ devis, lectureSeule, onModifier }: Props) {
  const choisi = devis.clientNom !== ''
  const [recherche, setRecherche] = useState(!choisi)
  const [requete, setRequete] = useState('')
  const { resultat, enCours } = useRechercheClients(requete, recherche)

  const annuler = () => {
    setRecherche(false)
    setRequete('')
  }
  const echapper = (ev: KeyboardEvent) => {
    if (choisi && ev.code === 'Escape') annuler()
  }

  const choisir = (c: Client) => {
    onModifier(champsClient(c))
    setRecherche(false)
    setRequete('')
  }

  return (
    <Champs desactive={lectureSeule}>
      <div className="devis-client">
        {recherche || !choisi ? (
          <div className="devis-recherche">
            <Icone nom="recherche" taille={16} className="devis-recherche__icone" />
            <input
              className="input"
              type="search"
              autoFocus={choisi}
              placeholder="Rechercher un client par nom ou e-mail…"
              aria-label="Rechercher un client"
              value={requete}
              onChange={(ev) => setRequete(ev.target.value)}
              onKeyDown={echapper}
            />
            {choisi ? (
              <Bouton variante="fantome" taille="sm" onClick={annuler}>
                Annuler
              </Bouton>
            ) : null}
            <ul className="devis-recherche__liste" aria-label="Clients trouvés" aria-busy={enCours}>
              {resultat?.clients.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => choisir(c)}>
                    <span className="devis-avatar">{initiales(nomAffichageClient(c))}</span>
                    <span>
                      <strong>{nomAffichageClient(c)}</strong>
                      <small>{c.email ?? 'Pas d’e-mail'}</small>
                    </span>
                  </button>
                </li>
              ))}
              {resultat && !enCours && !resultat.clients.length ? (
                <li className="devis-recherche__vide" role="status">
                  {resultat.erreur
                    ? 'Impossible de charger les clients.'
                    : 'Aucun client trouvé. Créez-le avec « Nouveau client ».'}
                </li>
              ) : null}
            </ul>
          </div>
        ) : (
          <div className="devis-client-carte">
            <span className="devis-avatar devis-avatar--lg">{initiales(devis.clientNom)}</span>
            <div className="devis-client-carte__texte">
              <strong>{devis.clientNom}</strong>
              {devis.clientEmail ? (
                <span>
                  <Icone nom="courriel" taille={13} /> {devis.clientEmail}
                </span>
              ) : null}
              {devis.clientTelephone ? (
                <span>
                  <Icone nom="telephone" taille={13} /> {devis.clientTelephone}
                </span>
              ) : null}
            </div>
            <Bouton variante="fantome" taille="sm" onClick={() => setRecherche(true)}>
              Changer
            </Bouton>
          </div>
        )}
        {/* Création : la fiche client a son propre écran, le brouillon reste enregistré. */}
        {lectureSeule ? null : <Link to="/clients?nouveau=1" className="btn btn--secondary btn--sm devis-client__nouveau">
          <Icone nom="utilisateur_plus" taille={16} /> Nouveau client
        </Link>}
      </div>

      {choisi && !recherche ? (
        <div className="devis-duo">
          <div className="devis-adresse">
            <span className="devis-etiquette">Adresse de facturation</span>
            <p>{devis.clientAdresse || 'Aucune adresse renseignée'}</p>
          </div>
          <div className="devis-adresse">
            <CaseACocher
              libelle="Adresse du chantier différente"
              checked={devis.adresseChantier !== undefined}
              onChange={(ev) =>
                onModifier({
                  adresseChantier: ev.target.checked
                    ? { rue: '', codePostal: '', ville: '' }
                    : undefined,
                })
              }
            />
            {devis.adresseChantier ? (
              <AdresseChantierChamps
                adresse={devis.adresseChantier}
                onChange={(adresseChantier) => onModifier({ adresseChantier })}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </Champs>
  )
}
