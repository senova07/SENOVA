import { Bouton } from '@/ui/Bouton'
import { ChampTexte } from '@/ui/Formulaire'
import { adresseParDefaut, adresseVide, sansAdresse, type Erreurs, type LigneAdresse } from './saisieClient'

interface Props {
  adresses: LigneAdresse[]
  erreurs: Erreurs
  onChange(adresses: LigneAdresse[]): void
}

export function AdressesClient({ adresses, erreurs, onChange }: Props) {
  const maj = (cle: number, morceau: Partial<LigneAdresse>) =>
    onChange(adresses.map((a) => (a.cle === cle ? { ...a, ...morceau } : a)))

  return (
    <fieldset className="form-client__groupe">
      <legend>Adresses</legend>
      {adresses.map((a, i) => {
        const err = (c: string) => erreurs[`adresses.${i}.${c}`]
        return (
          <div className="form-client__ligne" key={a.cle} role="group" aria-label={`Adresse ${i + 1}`}>
            <div className="form-client__duo">
              <ChampTexte
                libelle="Libellé"
                value={a.libelle}
                onChange={(ev) => maj(a.cle, { libelle: ev.target.value })}
                erreur={err('libelle')}
              />
              <ChampTexte
                libelle="Adresse"
                value={a.ligne1}
                onChange={(ev) => maj(a.cle, { ligne1: ev.target.value })}
                erreur={err('ligne1')}
              />
            </div>
            <ChampTexte
              libelle="Complément"
              value={a.ligne2}
              onChange={(ev) => maj(a.cle, { ligne2: ev.target.value })}
            />
            <div className="form-client__duo">
              <ChampTexte
                libelle="Code postal"
                value={a.codePostal}
                onChange={(ev) => maj(a.cle, { codePostal: ev.target.value })}
                erreur={err('codePostal')}
              />
              <ChampTexte
                libelle="Ville"
                value={a.ville}
                onChange={(ev) => maj(a.cle, { ville: ev.target.value })}
                erreur={err('ville')}
              />
            </div>
            <ChampTexte
              libelle="Pays"
              value={a.pays}
              maxLength={2}
              onChange={(ev) => maj(a.cle, { pays: ev.target.value.toUpperCase() })}
              erreur={err('pays')}
            />
            <div className="form-client__ligne-pied">
              <label className="form-client__case">
                <input
                  type="radio"
                  name="adresse-defaut"
                  checked={a.parDefaut}
                  onChange={() => onChange(adresseParDefaut(adresses, a.cle))}
                />
                Adresse par défaut
              </label>
              <Bouton
                variante="fantome"
                taille="sm"
                icone="poubelle"
                onClick={() => onChange(sansAdresse(adresses, a.cle))}
                aria-label={`Retirer l’adresse ${i + 1}`}
              />
            </div>
          </div>
        )
      })}
      <Bouton taille="sm" icone="plus" onClick={() => onChange([...adresses, adresseVide(adresses.length === 0)])}>
        Ajouter une adresse
      </Bouton>
    </fieldset>
  )
}
