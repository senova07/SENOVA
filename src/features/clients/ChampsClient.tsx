import { ChampSelect, ChampTexte, ChampZone } from '@/ui/Formulaire'
import type { NatureClient } from '@shared/clients'
import type { Brouillon, Erreurs } from './saisieClient'

interface Props {
  b: Brouillon
  erreurs: Erreurs
  maj<C extends keyof Brouillon>(champ: C, valeur: Brouillon[C]): void
}

/** Identité, coordonnées et identifiants d'entreprise. */
export function ChampsIdentite({ b, erreurs, maj }: Props) {
  const entreprise = b.nature === 'entreprise'
  return (
    <>
      <ChampSelect
        libelle="Nature"
        value={b.nature}
        onChange={(ev) => maj('nature', ev.target.value as NatureClient)}
      >
        <option value="particulier">Particulier</option>
        <option value="entreprise">Entreprise</option>
      </ChampSelect>

      <div className="form-client__duo">
        <ChampTexte
          libelle={entreprise ? 'Raison sociale' : 'Nom'}
          value={b.nom}
          onChange={(ev) => maj('nom', ev.target.value)}
          erreur={erreurs.nom}
          maxLength={150}
        />
        {entreprise ? null : (
          <ChampTexte
            libelle="Prénom"
            value={b.prenom}
            onChange={(ev) => maj('prenom', ev.target.value)}
            erreur={erreurs.prenom}
            maxLength={100}
          />
        )}
      </div>

      <div className="form-client__duo">
        <ChampTexte
          libelle="Email"
          type="email"
          value={b.email}
          onChange={(ev) => maj('email', ev.target.value)}
          erreur={erreurs.email}
        />
        <ChampTexte
          libelle="Téléphone"
          type="tel"
          value={b.telephone}
          onChange={(ev) => maj('telephone', ev.target.value)}
          erreur={erreurs.telephone}
        />
      </div>

      {entreprise ? (
        <fieldset className="form-client__groupe">
          <legend>Identité de l’entreprise</legend>
          <div className="form-client__trio">
            <ChampTexte
              libelle="SIREN"
              inputMode="numeric"
              value={b.siren}
              onChange={(ev) => maj('siren', ev.target.value)}
              erreur={erreurs.siren ? '9 chiffres attendus.' : undefined}
              aide="9 chiffres"
            />
            <ChampTexte
              libelle="SIRET"
              inputMode="numeric"
              value={b.siret}
              onChange={(ev) => maj('siret', ev.target.value)}
              erreur={erreurs.siret ? '14 chiffres attendus.' : undefined}
              aide="14 chiffres"
            />
            <ChampTexte
              libelle="TVA intracommunautaire"
              value={b.tvaIntracom}
              onChange={(ev) => maj('tvaIntracom', ev.target.value)}
              erreur={erreurs.tvaIntracom}
            />
          </div>
        </fieldset>
      ) : null}
    </>
  )
}

export function ChampNotes({ b, erreurs, maj }: Props) {
  return (
    <ChampZone
      libelle="Notes internes"
      value={b.notes}
      onChange={(ev) => maj('notes', ev.target.value)}
      erreur={erreurs.notes}
      maxLength={5000}
    />
  )
}
